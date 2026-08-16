import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/ToastMessage";
import { MAP_DELTAS } from "@/constants/config";
import { MAX_INCIDENT_PHOTOS } from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { isNetworkError } from "@/services/api-client";
import { createIncident, reverseGeocode, uploadPhoto } from "@/services/incidents";
import { enqueueReport } from "@/storage/pending-reports";
import { clearDraft, isWorthSaving, loadDraft, saveDraft } from "@/storage/report-draft";
import { getValidToken } from "@/storage/tokens";
import type { IncidentType } from "@/types/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useStrings } from "@/hooks/use-strings";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useUserLocation } from "@/hooks/use-user-location";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

type PickedPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
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
  { value: "Other",    icon: "help-outline",    color: "#78909C" },
];


export default function ReportScreen() {
  const { colors, isDark } = useAppColors();
  const t = useStrings();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { coords, setCoords, loading: locLoading } = useUserLocation(MAP_DELTAS.report);
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions]   = useState<NominatimResult[]>([]);
  const [description, setDescription]   = useState("");
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [photos, setPhotos]             = useState<PickedPhoto[]>([]);
  const [draftChecked, setDraftChecked] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Un formulaire à moitié rempli devant un nid-de-poule, un appel entrant, et
  // tout est à refaire : c'est le moment où l'on renonce à signaler.
  useEffect(() => {
    void (async () => {
      const draft = await loadDraft();
      if (draft) {
        setCoords({ latitude: draft.latitude, longitude: draft.longitude });
        setAddressQuery(draft.addressQuery);
        setDescription(draft.description);
        setSelectedType(draft.type);
        setPhotos(draft.photos);
        setDraftRestored(true);
      }
      setDraftChecked(true);
    })();
  }, [setCoords]);

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
    const timer = setTimeout(() => void saveDraft(draft), 500);
    return () => clearTimeout(timer);
  }, [draftChecked, coords, addressQuery, description, selectedType, photos]);

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
          void clearDraft();
          setDraftRestored(false);
          setAddressQuery("");
          setDescription("");
          setSelectedType(null);
          setPhotos([]);
        },
      },
    ]);
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
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=1`,
          { headers: { "User-Agent": "CityCare/1.0" } },
        );
        const data = await res.json() as NominatimResult[];
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  }

  function selectSuggestion(s: NominatimResult) {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setAddressQuery(s.display_name);
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
      if (uploadFailed) Toast.show({ type: "error", text1: STRINGS.alert.errorTitle, text2: STRINGS.photos.uploadError });
      Toast.show({ type: "success", text1: STRINGS.toast.reportSuccessTitle, text2: STRINGS.toast.reportSuccess });
      await clearDraft();
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
        await clearDraft();
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

  const initialRegion: Region = { ...coords, latitudeDelta: MAP_DELTAS.report, longitudeDelta: MAP_DELTAS.report };
  const remaining  = 255 - description.length;
  const canSubmit  = !!selectedType && !!description.trim();

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* ── Brouillon restauré ── */}
      {draftRestored && (
        <View style={styles.draftBar} testID="draft-restored">
          <MaterialIcons name="history" size={16} color={colors.primary} />
          <Text style={styles.draftText}>{t.report.draftRestored}</Text>
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

      {/* ── Localisation ── */}
      <SectionHeader title={t.report.location} colors={colors} required />
      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.mapLoader}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
          >
            <Marker coordinate={coords} pinColor={colors.primary} tracksViewChanges={false} />
          </MapView>
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
            <TouchableOpacity onPress={() => { setAddressQuery(""); setSuggestions([]); }} style={{ marginRight: 10 }}>
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
                <Text style={styles.suggestionText} numberOfLines={2}>{s.display_name}</Text>
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

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: { backgroundColor: c.background, padding: 20, paddingBottom: 48 },

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
