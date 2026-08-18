import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { DANGER, ROLE_COLOR } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/ToastMessage";
import { MAP_DELTAS } from "@/constants/config";
import { MAX_INCIDENT_PHOTOS } from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { isNetworkError } from "@/services/api-client";
import { searchPlaces, type PlaceSuggestion } from "@/services/geocoding";
import { createIncident, reverseGeocode, uploadPhoto } from "@/services/incidents";
import { useNearbyDuplicates } from "@/hooks/use-nearby-duplicates";
import { metersBetween } from "@/utils/duplicates";
import { enqueueReport } from "@/storage/pending-reports";
import { clearDraft, isWorthSaving, latestDraft, listDrafts, saveDraft, type ReportDraft } from "@/storage/report-draft";
import { getValidToken } from "@/storage/tokens";
import { mixHex } from "@/utils/color";
import { succeeded } from "@/utils/feedback";
import type { IncidentType } from "@/types/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { ModalShell } from "@/components/ui/ModalShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { timeAgo } from "@/utils/format-date";
import { useUserLocation } from "@/hooks/use-user-location";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";

type PickedPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

const INCIDENT_TYPES: {
  value: IncidentType;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}[] = [
  { value: "Road",     icon: "construction",    color: "#FF7043" },
  { value: "Lighting", icon: "lightbulb",       color: "#FFC107" },
  { value: "Waste",    icon: "delete-outline",  color: "#66BB6A" },
  { value: "Graffiti", icon: "format-paint",    color: "#AB47BC" },
  { value: "Safety",   icon: "shield",          color: "#EF5350" },
  { value: "Other",    icon: "help-outline",    color: ROLE_COLOR.citizen },
];


/**
 * La carte du formulaire, isolée derrière `memo`.
 *
 * Elle vit dans un écran qui se rend à chaque frappe de la description, à
 * chaque enregistrement de brouillon et à chaque réponse réseau. Une vue de
 * carte n'aime pas ça : sur Android elle est adossée à une surface native, et
 * la faire retraverser le pont à tout propos la fait clignoter, perdre son
 * cadrage ou saccader sous le doigt.
 *
 * Isolée, elle ne se rend plus que si sa position ou sa couleur changent.
 * `initialRegion` est figé de son côté — c'est un cadrage de départ, le
 * recomposer à chaque rendu n'avait aucun sens.
 */
const ReportMap = memo(function ReportMap({
  mapRef,
  style,
  initialRegion,
  coords,
  pinColor,
  onPress,
}: {
  mapRef: React.RefObject<MapView | null>;
  style: StyleProp<ViewStyle>;
  initialRegion: Region;
  coords: { latitude: number; longitude: number };
  pinColor: string;
  onPress: (coordinate: { latitude: number; longitude: number }) => void;
}) {
  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={initialRegion}
      showsUserLocation
      onPress={(e) => onPress(e.nativeEvent.coordinate)}
    >
      <Marker coordinate={coords} pinColor={pinColor} tracksViewChanges={false} />
    </MapView>
  );
});

export default function ReportScreen() {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark, insets.top, insets.bottom), [colors, isDark, insets.top, insets.bottom]);

  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { coords, setCoords, loading: locLoading } = useUserLocation(MAP_DELTAS.report);
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions]   = useState<PlaceSuggestion[]>([]);
  const [description, setDescription]   = useState("");
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [photos, setPhotos]             = useState<PickedPhoto[]>([]);
  const [draftChecked, setDraftChecked] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  // Le brouillon sur lequel on écrit. `null` tant que rien n'a été enregistré :
  // la première écriture en crée un et retient son identifiant, sinon chaque
  // frappe fabriquerait un brouillon de plus.
  const [draftId, setDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ReportDraft[]>([]);
  const [picking, setPicking] = useState(false);

  const duplicates = useNearbyDuplicates(selectedType, coords);

  // Un formulaire à moitié rempli devant un nid-de-poule, un appel entrant, et
  // tout est à refaire : c'est le moment où l'on renonce à signaler.
  const applyDraft = useCallback((draft: ReportDraft) => {
    setCoords({ latitude: draft.latitude, longitude: draft.longitude });
    setAddressQuery(draft.addressQuery);
    setDescription(draft.description);
    setSelectedType(draft.type);
    setPhotos(draft.photos);
    setDraftId(draft.id);
    setDraftRestored(true);
  }, [setCoords]);

  useEffect(() => {
    void (async () => {
      const all = await listDrafts();
      setDrafts(all);
      const draft = await latestDraft();
      if (draft) applyDraft(draft);
      setDraftChecked(true);
    })();
  }, [applyDraft]);

  // La géolocalisation ne reprend la main que si aucun brouillon n'a été
  // restauré : sinon elle écraserait l'adresse retenue par celle d'ici, qui
  // n'est pas forcément celle de l'incident.
  useEffect(() => {
    if (locLoading || !draftChecked || draftRestored) return;
    reverseGeocode(coords.latitude, coords.longitude).then((result) => {
      if (result) setAddressQuery(result.address_label);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locLoading, draftChecked, draftRestored]);

  // Écriture différée : à chaque frappe, ce serait un accès disque par
  // caractère.
  useEffect(() => {
    if (!draftChecked) return;
    const draft = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      addressQuery,
      description,
      type: selectedType,
      photos,
    };
    if (!isWorthSaving(draft)) return;
    const timer = setTimeout(() => {
      void saveDraft(draft, draftId ?? undefined).then(setDraftId);
    }, 500);
    return () => clearTimeout(timer);
  }, [draftChecked, coords, addressQuery, description, selectedType, photos, draftId]);

  /**
   * Le geste est devenu facile à atteindre — c'est ce qu'on voulait — donc aussi
   * facile à déclencher par erreur. Or il jette précisément ce que le brouillon
   * servait à sauver : un formulaire rempli, photos comprises, et sans retour
   * possible. Toutes les autres actions destructives de l'application demandent
   * confirmation ; celle-ci n'avait pas de raison d'y échapper.
   */
  function discardDraft() {
    Alert.alert(t.report.discardTitle, t.report.discardMessage, [
      { text: t.alert.cancel, style: "cancel" },
      {
        text: t.report.discardDraft,
        style: "destructive",
        onPress: () => {
          if (draftId) void clearDraft(draftId).then(() => listDrafts().then(setDrafts));
          resetForm();
        },
      },
    ]);
  }

  /** Vide le formulaire sans toucher au stockage : à l'appelant d'en décider. */
  function resetForm() {
    setDraftRestored(false);
    setDraftId(null);
    setAddressQuery("");
    setDescription("");
    setSelectedType(null);
    setPhotos([]);
  }

  /**
   * Met le formulaire de côté et repart d'une page blanche.
   *
   * Le brouillon en cours est déjà enregistré — l'écriture différée s'en est
   * chargée — il suffit donc d'oublier son identifiant pour que la suite en
   * ouvre un autre. C'est ce qui permet de préparer trois signalements en
   * marchant, au lieu d'en écraser deux.
   */
  async function startNewDraft() {
    resetForm();
    setDrafts(await listDrafts());
  }

  async function handleMapPress(coordinate: { latitude: number; longitude: number }) {
    setCoords(coordinate);
    setSuggestions([]);
    const result = await reverseGeocode(coordinate.latitude, coordinate.longitude);
    if (result) setAddressQuery(result.address_label);
  }

  function handleAddressChange(text: string) {
    setAddressQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 3) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(() => {
      // Les environs d'abord : « Garibaldi » saisi depuis Lyon doit proposer la
      // rue avant une place italienne.
      searchPlaces(text, coords)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 350);
  }

  function selectSuggestion(s: PlaceSuggestion) {
    const { latitude: lat, longitude: lon } = s;
    setAddressQuery(s.label);
    setSuggestions([]);
    setCoords({ latitude: lat, longitude: lon });
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: MAP_DELTAS.report,
      longitudeDelta: MAP_DELTAS.report,
    });
  }

  async function handlePickPhoto() {
    if (photos.length >= MAX_INCIDENT_PHOTOS) { Alert.alert(STRINGS.alert.errorTitle, STRINGS.photos.limitReached); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert(t.report.permissionDenied, t.photos.permissionDeniedGallery); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", allowsMultipleSelection: true, quality: 0.8,
      selectionLimit: MAX_INCIDENT_PHOTOS - photos.length,
    });
    if (result.canceled) return;
    const picked: PickedPhoto[] = result.assets.map((a) => ({
      uri: a.uri, fileName: a.fileName ?? `photo_${Date.now()}.jpg`, mimeType: a.mimeType ?? "image/jpeg",
    }));
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_INCIDENT_PHOTOS));
  }

  async function handleTakePhoto() {
    if (photos.length >= MAX_INCIDENT_PHOTOS) { Alert.alert(STRINGS.alert.errorTitle, STRINGS.photos.limitReached); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert(t.report.permissionDenied, t.photos.permissionDeniedCamera); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8 });
    if (result.canceled) return;
    const a = result.assets[0];
    setPhotos((prev) => [...prev, {
      uri: a.uri, fileName: a.fileName ?? `photo_${Date.now()}.jpg`, mimeType: a.mimeType ?? "image/jpeg",
    }].slice(0, MAX_INCIDENT_PHOTOS));
  }

  function handleAddPhoto() {
    if (photos.length >= MAX_INCIDENT_PHOTOS) { Alert.alert(STRINGS.alert.errorTitle, STRINGS.photos.limitReached); return; }
    Alert.alert(t.report.addPhoto, undefined, [
      { text: t.report.takePhoto, onPress: handleTakePhoto },
      { text: t.report.pickPhoto, onPress: handlePickPhoto },
      { text: t.alert.cancel, style: "cancel" },
    ]);
  }

  async function handleSubmit() {
    if (!selectedType || !description.trim() || description.trim().length > 255) return;

    // La carte au-dessus informe ; cette question-ci ne bloque pas non plus.
    // Un doublon reste parfois légitime — deux trous voisins, une aggravation à
    // signaler — et c'est l'utilisateur sur place qui sait, pas nous.
    if (duplicates.length > 0 && !(await confirmDuplicate())) return;

    setSubmitting(true);
    try {
      const token = await getValidToken();
      if (!token) { Alert.alert(STRINGS.alert.sessionExpiredTitle, STRINGS.alert.sessionExpiredMsg); router.replace("/login"); return; }
      const incident = await createIncident(
        { latitude: coords.latitude, longitude: coords.longitude, type: selectedType, description: description.trim() },
        token,
      );
      let uploadFailed = false;
      for (const photo of photos) {
        const uploadToken = await getValidToken();
        if (!uploadToken) { uploadFailed = true; break; }
        try { await uploadPhoto(incident.id, photo.uri, photo.fileName, photo.mimeType, uploadToken); }
        catch (uploadErr) {
          console.warn("[upload photo]", uploadErr instanceof Error ? uploadErr.message : uploadErr);
          uploadFailed = true;
        }
      }
      if (uploadFailed) Toast.show({ type: "error", text1: t.alert.errorTitle, text2: t.photos.uploadError });
      succeeded();
      Toast.show({ type: "success", text1: t.toast.reportSuccessTitle, text2: t.toast.reportSuccess });
      if (draftId) await clearDraft(draftId);
      router.back();
    } catch (e: unknown) {
      // La requête n'a jamais atteint le serveur : le signalement est accepté
      // localement et repartira au retour du réseau. Renvoyer l'utilisateur à
      // son formulaire au milieu d'une rue sans réseau, c'est le perdre.
      if (isNetworkError(e)) {
        await enqueueReport({
          latitude: coords.latitude,
          longitude: coords.longitude,
          type: selectedType,
          description: description.trim(),
          photos,
        });
        if (draftId) await clearDraft(draftId);
        // Mis en file plutôt qu'envoyé, mais du point de vue de l'utilisateur
        // le geste a abouti : c'est ce que le retour doit dire.
        succeeded();
        Toast.show({
          type: "success",
          text1: t.report.queuedTitle,
          text2: t.report.queuedDetail,
        });
        router.back();
        return;
      }
      Alert.alert(STRINGS.alert.errorTitle, e instanceof Error ? e.message : STRINGS.api.unknownError);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Ouvre le signalement existant sur la carte.
   *
   * `router.push` était faux ici : ce formulaire est présenté en fenêtre
   * modale, et pousser un onglet depuis une modale l'empile **par-dessus** au
   * lieu de la remplacer — les deux écrans se superposent, le formulaire
   * restant monté sous la carte. `dismissTo` referme la fenêtre et navigue d'un
   * seul geste, ce qui est le comportement attendu : on quitte le brouillon
   * pour aller voir ce qui existe déjà.
   */
  function openExisting(existingId: string) {
    const target = { pathname: "/(tabs)/explore" as const, params: { selectId: existingId } };
    if (router.canDismiss()) router.dismissTo(target);
    else router.push(target);
  }

  /** `Alert` est déclaratif ; on l'enveloppe pour pouvoir l'attendre. */
  function confirmDuplicate(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        t.report.duplicateConfirmTitle,
        t.report.duplicateConfirmMsg(duplicates.length),
        [
          { text: t.alert.cancel, style: "cancel", onPress: () => resolve(false) },
          { text: t.report.duplicateSendAnyway, onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  }

  /**
   * Cadrage de départ, calculé une fois.
   *
   * `initialRegion` n'est lu qu'au montage de la carte : le recomposer à chaque
   * rendu ne changeait rien à l'écran mais renvoyait un objet neuf à la vue
   * native, encore et encore.
   */
  const frozenRegion = useRef<Region | null>(null);
  if (!frozenRegion.current && !locLoading) {
    frozenRegion.current = {
      ...coords,
      latitudeDelta: MAP_DELTAS.report,
      longitudeDelta: MAP_DELTAS.report,
    };
  }
  const initialRegion = frozenRegion.current;

  const remaining  = 255 - description.length;
  const canSubmit  = !!selectedType && !!description.trim();

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* ── Brouillon restauré ── */}
      {draftRestored && (
        <View style={styles.draftBar} testID="draft-restored">
          <MaterialIcons name="history" size={16} color={colors.primary} />
          <Text style={styles.draftText} numberOfLines={2}>{t.report.draftRestored}</Text>
          {/* Mettre de côté plutôt qu'écraser : c'est tout l'objet des
              brouillons multiples. */}
          <TouchableOpacity
            style={styles.draftNewBtn}
            onPress={() => void startNewDraft()}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t.report.newDraftA11y}
            hitSlop={6}
          >
            <MaterialIcons name="note-add" size={15} color={colors.primary} />
            <Text style={styles.draftNewText}>{t.report.newDraft}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.draftDiscardBtn}
            onPress={discardDraft}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t.report.discardTitle}
            hitSlop={8}
          >
            <Text style={styles.draftDiscard}>{t.report.discardDraft}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Les autres brouillons, quand il y en a : une ligne discrète qui
          ouvre la liste, plutôt qu'une pile de cartes au-dessus du formulaire. */}
      {drafts.length > 1 && (
        <TouchableOpacity
          style={styles.draftsLink}
          onPress={() => setPicking(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <MaterialIcons name="layers" size={15} color={colors.text} style={{ opacity: 0.5 }} />
          <Text style={styles.draftsLinkText}>{t.report.draftCount(drafts.length)}</Text>
          <MaterialIcons name="chevron-right" size={16} color={colors.text} style={{ opacity: 0.35 }} />
        </TouchableOpacity>
      )}

      <ModalShell visible={picking} title={t.report.draftsTitle} onClose={() => setPicking(false)}>
        {drafts.map((draft) => (
          <TouchableOpacity
            key={draft.id}
            style={[styles.draftRow, draft.id === draftId && styles.draftRowActive]}
            onPress={() => {
              applyDraft(draft);
              setPicking(false);
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <View style={styles.draftRowText}>
              <Text style={styles.draftRowTitle} numberOfLines={1}>
                {draft.description.trim() || t.report.untitledDraft}
              </Text>
              <Text style={styles.draftRowMeta} numberOfLines={1}>
                {draft.type ? t.report.types[draft.type] : "—"} · {timeAgo(draft.savedAt, t)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => void clearDraft(draft.id).then(async () => {
                const left = await listDrafts();
                setDrafts(left);
                // On vient de jeter celui qu'on éditait : le formulaire ne doit
                // plus prétendre écrire dedans.
                if (draft.id === draftId) resetForm();
                if (left.length <= 1) setPicking(false);
              })}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t.report.discardTitle}
            >
              <MaterialIcons name="delete-outline" size={19} color={DANGER} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ModalShell>

      {/* ── Localisation ── */}
      <SectionHeader title={t.report.location} colors={colors} required />
      <View style={styles.mapContainer}>
        {locLoading || !initialRegion ? (
          <View style={styles.mapLoader}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <ReportMap
            mapRef={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            coords={coords}
            pinColor={colors.primary}
            onPress={handleMapPress}
          />
        )}
      </View>

      {/* Champ adresse avec autocomplete */}
      <View style={styles.addressWrap}>
        <View style={styles.addressInputRow}>
          <MaterialIcons name="search" size={18} color={colors.text + "55"} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.addressInput}
            value={addressQuery}
            onChangeText={handleAddressChange}
            placeholder={t.report.addressPlaceholder}
            placeholderTextColor={colors.text + "55"}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (suggestions.length > 0) selectSuggestion(suggestions[0]);
            }}
          />
          {addressQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => { setAddressQuery(""); setSuggestions([]); }}
              style={{ marginRight: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t.alert.a11yClearAddress}
            >
              <MaterialIcons name="close" size={16} color={colors.text + "55"} />
            </TouchableOpacity>
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionDivider]}
                onPress={() => selectSuggestion(s)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="location-on" size={14} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={styles.suggestionText} numberOfLines={2}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── Catégorie ── */}
      <SectionHeader title={t.report.category} colors={colors} required />
      <View style={styles.typeGrid}>
        {INCIDENT_TYPES.map((incidentType) => {
          const active = selectedType === incidentType.value;
          return (
            <TouchableOpacity
              key={incidentType.value}
              style={[styles.typeCard, { backgroundColor: active ? incidentType.color : colors.white, borderColor: active ? incidentType.color : colors.chipBorder }]}
              onPress={() => setSelectedType(incidentType.value)}
              activeOpacity={0.75}
            >
              <View style={[styles.typeIconBubble, { backgroundColor: active ? "rgba(255,255,255,0.22)" : incidentType.color + "18" }]}>
                <MaterialIcons name={incidentType.icon} size={22} color={active ? "#fff" : incidentType.color} />
              </View>
              <Text style={[styles.typeLabel, { color: active ? "#fff" : colors.text }]}>
                {t.report.types[incidentType.value]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Description ── */}
      <SectionHeader title={t.report.description} colors={colors} required />
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder={t.report.descriptionPlaceholder}
        placeholderTextColor={colors.text + "55"}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
        maxLength={255}
      />
      <Text style={[styles.charCount, { color: remaining < 15 ? "#f0a500" : colors.text + "55" }]}>
        {t.report.charactersLeft(remaining)}
      </Text>

      {/* ── Photos ── */}
      <SectionHeader title={t.report.photos} colors={colors} />
      <View style={styles.photosRow}>
        {photos.map((p, i) => (
          <View key={p.uri} style={styles.photoThumb}>
            <Image source={{ uri: p.uri }} style={styles.photoImg} contentFit="cover" />
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              accessibilityRole="button"
              accessibilityLabel={t.alert.a11yRemovePhoto}
            >
              <MaterialIcons name="close" size={11} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_INCIDENT_PHOTOS && (
          <TouchableOpacity style={styles.photoAddBtn} onPress={handleAddPhoto} activeOpacity={0.7}>
            <MaterialIcons name="add-a-photo" size={22} color={colors.text + "55"} />
            <Text style={styles.photoAddLabel}>{t.report.photosLeft(MAX_INCIDENT_PHOTOS - photos.length)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Doublon probable ──
          Averti ici et non au moment de l'envoi : mieux vaut le dire avant que
          l'utilisateur ait rédigé sa description. Il n'a aucun moyen de savoir
          qu'un voisin l'a devancé, et ce trou-là est le premier travers d'une
          application de signalement — la même bouche d'égout déclarée quinze
          fois, et un agent qui trie à la main. */}
      {duplicates.length > 0 && (
        <TouchableOpacity
          style={styles.duplicateCard}
          onPress={() => openExisting(duplicates[0].id)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t.report.duplicateOpen}
        >
          <MaterialIcons name="content-copy" size={19} color={colors.primary} />
          <View style={styles.duplicateText}>
            <Text style={styles.duplicateTitle}>
              {t.report.duplicateTitle(
                duplicates.length,
                metersBetween(coords, duplicates[0]),
              )}
            </Text>
            <Text style={styles.duplicateDetail} numberOfLines={2}>
              {duplicates[0].description || t.report.duplicateOpen}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.text + "55"} />
        </TouchableOpacity>
      )}

      {/* ── Submit ── */}
      <Button label={t.report.submit} onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />
      {!canSubmit && (
        <Text style={styles.validationHint}>
          {!selectedType && !description.trim()
            ? t.report.needBoth
            : !selectedType ? t.report.needCategory
            : t.report.needDescription}
        </Text>
      )}

    </ScrollView>
  );
}

function makeStyles(c: AppColors, isDark: boolean, topInset: number, bottomInset: number) {
  return StyleSheet.create({
    // Poussé en modale, donc plein écran sur Android : sans les encoches, le
    // titre passait sous la barre d état et le dernier bouton sous la barre de
    // navigation.
    container: {
      backgroundColor: c.background,
      padding: 20,
      paddingTop: topInset + 20,
      paddingBottom: bottomInset + 48,
    },

    // ── Doublon probable ──
    // Teinté de la couleur de l'application et non du rouge des erreurs : ce
    // n'est pas une faute, c'est un renseignement.
    duplicateCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      padding: 13,
      borderRadius: 14,
      marginBottom: 14,
      backgroundColor: mixHex(c.background, c.primary, 0.13),
    },
    duplicateText: { flex: 1, gap: 2 },
    duplicateTitle: { fontSize: 13.5, fontWeight: "700", color: c.text },
    duplicateDetail: { fontSize: 12, color: c.text, opacity: 0.6, lineHeight: 16 },

    // ── Brouillon ──
    draftBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      // Le bouton porte désormais son propre rembourrage : la barre resserre le
      // sien pour ne pas grandir d'autant.
      paddingVertical: 7,
      paddingLeft: 12,
      paddingRight: 7,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: c.primary + "14",
      borderWidth: 1,
      borderColor: c.primary + "33",
    },
    draftText: { flex: 1, fontSize: 12, color: c.text, opacity: 0.75 },
    draftNewBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: c.white,
    },
    draftNewText: { fontSize: 12, fontWeight: "700", color: c.primary },
    draftsLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 2,
      marginTop: -8,
      marginBottom: 12,
    },
    draftsLinkText: { fontSize: 12.5, color: c.text, opacity: 0.6, fontWeight: "600" },
    draftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.chipBorder,
      backgroundColor: c.white,
      marginBottom: 8,
    },
    draftRowActive: { borderColor: c.primary, borderWidth: 2 },
    draftRowText: { flex: 1, gap: 2 },
    draftRowTitle: { fontSize: 14, fontWeight: "600", color: c.text },
    draftRowMeta: { fontSize: 11.5, color: c.text, opacity: 0.5 },
    // Le libellé faisait douze pixels de haut : la zone touchable valait la
    // hauteur du texte. Elle atteint maintenant les quarante-quatre points
    // recommandés, rembourrage et `hitSlop` compris.
    draftDiscardBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: c.primary + "22",
    },
    draftDiscard: { fontSize: 12.5, fontWeight: "700", color: c.primary },

    // ── Map ──
    mapContainer: {
      height: 190, borderRadius: 16, overflow: "hidden", marginBottom: 10,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    map: { flex: 1 },
    mapLoader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? c.secondary : "#e8e6db" },

    // ── Address autocomplete ──
    addressWrap: { marginBottom: 20 },
    addressInputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.inputBorder,
      height: 46,
    },
    addressInput: {
      flex: 1,
      paddingHorizontal: 10,
      fontSize: 13,
      color: c.text,
    },
    suggestions: {
      backgroundColor: c.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.inputBorder,
      marginTop: 4,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    suggestionDivider: { borderBottomWidth: 1, borderBottomColor: c.chipBorder },
    suggestionText: { fontSize: 13, color: c.text, flex: 1, lineHeight: 18 },

    // ── Type grid ──
    typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
    typeCard: {
      width: "47%", borderRadius: 14, borderWidth: 1.5,
      padding: 14, alignItems: "center", gap: 10,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    },
    typeIconBubble: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    typeLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },

    // ── Description ──
    textarea: {
      backgroundColor: c.inputBg, borderRadius: 12, borderWidth: 1, borderColor: c.inputBorder,
      padding: 14, fontSize: 14, color: c.text, minHeight: 96, marginBottom: 6,
    },
    charCount: { fontSize: 12, textAlign: "right", marginBottom: 20 },

    // ── Photos ──
    photosRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
    photoThumb: { width: 80, height: 80, borderRadius: 12, overflow: "hidden" },
    photoImg: { width: 80, height: 80 },
    photoRemoveBtn: {
      position: "absolute", top: 4, right: 4, width: 20, height: 20,
      borderRadius: 10, backgroundColor: "#000a", alignItems: "center", justifyContent: "center",
    },
    photoAddBtn: {
      width: 80, height: 80, borderRadius: 12, borderWidth: 1.5,
      borderColor: c.inputBorder, borderStyle: "dashed",
      alignItems: "center", justifyContent: "center", backgroundColor: c.inputBg, gap: 4,
    },
    photoAddLabel: { fontSize: 10, color: c.text, opacity: 0.4, fontWeight: "600" },

    // ── Validation ──
    validationHint: { fontSize: 13, color: c.statusRed, textAlign: "center", marginTop: 8, opacity: 0.8 },
  });
}
