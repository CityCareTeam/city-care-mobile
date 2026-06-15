import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/ToastMessage";
import { MAP_DELTAS } from "@/constants/config";
import { MAX_INCIDENT_PHOTOS } from "@/constants/incidents";
import { STRINGS } from "@/constants/strings";
import { createIncident, reverseGeocode, uploadPhoto } from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentType } from "@/types/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
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
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}[] = [
  { value: "Road",     label: "Voirie",    icon: "construction",   color: "#FF7043" },
  { value: "Lighting", label: "Éclairage", icon: "lightbulb",      color: "#FFC107" },
  { value: "Waste",    label: "Déchets",   icon: "delete-outline",  color: "#66BB6A" },
  { value: "Graffiti", label: "Graffiti",  icon: "format-paint",   color: "#AB47BC" },
  { value: "Safety",   label: "Sécurité",  icon: "shield",         color: "#EF5350" },
  { value: "Other",    label: "Autre",     icon: "help-outline",   color: "#78909C" },
];


export default function ReportScreen() {
  const { colors, isDark } = useAppColors();
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

  useEffect(() => {
    if (!locLoading) {
      reverseGeocode(coords.latitude, coords.longitude).then((result) => {
        if (result) setAddressQuery(result.address_label);
      });
    }
  }, [locLoading]);

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
    if (status !== "granted") { Alert.alert("Permission refusée", STRINGS.photos.permissionDeniedGallery); return; }
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
    if (status !== "granted") { Alert.alert("Permission refusée", STRINGS.photos.permissionDeniedCamera); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8 });
    if (result.canceled) return;
    const a = result.assets[0];
    setPhotos((prev) => [...prev, {
      uri: a.uri, fileName: a.fileName ?? `photo_${Date.now()}.jpg`, mimeType: a.mimeType ?? "image/jpeg",
    }].slice(0, MAX_INCIDENT_PHOTOS));
  }

  function handleAddPhoto() {
    if (photos.length >= MAX_INCIDENT_PHOTOS) { Alert.alert(STRINGS.alert.errorTitle, STRINGS.photos.limitReached); return; }
    Alert.alert("Ajouter une photo", undefined, [
      { text: "Prendre une photo",        onPress: handleTakePhoto },
      { text: "Choisir depuis la galerie", onPress: handlePickPhoto },
      { text: "Annuler", style: "cancel" },
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
      router.back();
    } catch (e: unknown) {
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

      {/* ── Localisation ── */}
      <SectionHeader title="Localisation" colors={colors} required />
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
            placeholder="Rechercher ou taper une adresse..."
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
      <SectionHeader title="Catégorie" colors={colors} required />
      <View style={styles.typeGrid}>
        {INCIDENT_TYPES.map((t) => {
          const active = selectedType === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeCard, { backgroundColor: active ? t.color : colors.white, borderColor: active ? t.color : colors.chipBorder }]}
              onPress={() => setSelectedType(t.value)}
              activeOpacity={0.75}
            >
              <View style={[styles.typeIconBubble, { backgroundColor: active ? "rgba(255,255,255,0.22)" : t.color + "18" }]}>
                <MaterialIcons name={t.icon} size={22} color={active ? "#fff" : t.color} />
              </View>
              <Text style={[styles.typeLabel, { color: active ? "#fff" : colors.text }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Description ── */}
      <SectionHeader title="Description" colors={colors} required />
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder="Décrivez brièvement l'incident..."
        placeholderTextColor={colors.text + "55"}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
        maxLength={255}
      />
      <Text style={[styles.charCount, { color: remaining < 15 ? "#f0a500" : colors.text + "55" }]}>
        {remaining} caractère{remaining !== 1 ? "s" : ""} restant{remaining !== 1 ? "s" : ""}
      </Text>

      {/* ── Photos ── */}
      <SectionHeader title="Photos (optionnel)" colors={colors} />
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
            <Text style={styles.photoAddLabel}>{MAX_INCIDENT_PHOTOS - photos.length} restante{MAX_INCIDENT_PHOTOS - photos.length !== 1 ? "s" : ""}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Submit ── */}
      <Button label="Envoyer le signalement" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />
      {!canSubmit && (
        <Text style={styles.validationHint}>
          {!selectedType && !description.trim()
            ? "Sélectionnez une catégorie et entrez une description"
            : !selectedType ? "Sélectionnez une catégorie"
            : "Entrez une description"}
        </Text>
      )}

    </ScrollView>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: { backgroundColor: c.background, padding: 20, paddingBottom: 48 },

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
    suggestionDivider: { borderBottomWidth: 1, borderBottomColor: c.secondary },
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
