import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
import { createIncident, reverseGeocode, uploadPhoto } from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentType } from "@/types/incidents";
import type { AppColors } from "@/hooks/use-app-colors";
import { useAppColors } from "@/hooks/use-app-colors";
import { useUserLocation } from "@/hooks/use-user-location";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
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

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "Road", label: "Route abîmée" },
  { value: "Lighting", label: "Éclairage" },
  { value: "Waste", label: "Déchets" },
  { value: "Graffiti", label: "Graffiti" },
  { value: "Safety", label: "Sécurité" },
  { value: "Other", label: "Autre" },
];

export default function ReportScreen() {
  const { colors, isDark } = useAppColors();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const mapRef = useRef<MapView>(null);
  const { coords, setCoords, loading: locLoading } = useUserLocation(0.005);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  useEffect(() => {
    if (!locLoading) {
      reverseGeocode(coords.latitude, coords.longitude).then((result) => {
        if (result) setAddress(result.address_label);
      });
    }
  }, [locLoading]);

  async function handleMapPress(coordinate: {
    latitude: number;
    longitude: number;
  }) {
    setCoords(coordinate);
    const result = await reverseGeocode(
      coordinate.latitude,
      coordinate.longitude,
    );
    if (result) setAddress(result.address_label);
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à vos photos dans les paramètres.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });
    if (result.canceled) return;
    const picked: PickedPhoto[] = result.assets.map((a) => ({
      uri: a.uri,
      fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
      mimeType: a.mimeType ?? "image/jpeg",
    }));
    setPhotos((prev) => [...prev, ...picked].slice(0, 5));
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à l'appareil photo dans les paramètres.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.8,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    setPhotos((prev) => [...prev, {
      uri: a.uri,
      fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
      mimeType: a.mimeType ?? "image/jpeg",
    }].slice(0, 5));
  }

  function handleAddPhoto() {
    Alert.alert("Ajouter une photo", undefined, [
      { text: "Prendre une photo", onPress: handleTakePhoto },
      { text: "Choisir depuis la galerie", onPress: handlePickPhoto },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  async function handleSubmit() {
    if (!selectedType || !description.trim()) return;
    setSubmitting(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert(STRINGS.alert.sessionExpiredTitle, STRINGS.alert.sessionExpiredMsg);
        router.replace("/login");
        return;
      }
      const incident = await createIncident(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          type: selectedType,
          description: description.trim(),
        },
        token,
      );
      for (const photo of photos) {
        try {
          await uploadPhoto(incident.id, photo.uri, photo.fileName, photo.mimeType, token);
        } catch {
          // une photo en échec ne bloque pas le signalement
        }
      }
      Toast.show({
        type: "success",
        text1: STRINGS.toast.reportSuccessTitle,
        text2: STRINGS.toast.reportSuccess,
      });
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : STRINGS.api.unknownError;
      Alert.alert(STRINGS.alert.errorTitle, msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLabel = INCIDENT_TYPES.find(
    (t) => t.value === selectedType,
  )?.label;
  const initialRegion: Region = {
    ...coords,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Signaler un incident</Text>

      {/* Mini-carte */}
      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
          >
            <Marker
              coordinate={coords}
              pinColor={colors.primary}
              tracksViewChanges={false}
            />
          </MapView>
        )}
      </View>
      <Text style={styles.hint}>
        Appuyez sur la carte pour déplacer le marqueur
      </Text>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder="Décrivez brièvement l'incident..."
        placeholderTextColor={colors.text + "66"}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

      {/* Photos (optionnel) */}
      <Text style={styles.label}>Photos (optionnel)</Text>
      <View style={styles.photosRow}>
        {photos.map((p, i) => (
          <View key={p.uri} style={styles.photoThumb}>
            <Image source={{ uri: p.uri }} style={styles.photoImg} contentFit="cover" />
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Text style={styles.photoRemoveBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 5 && (
          <TouchableOpacity style={styles.photoAddBtn} onPress={handleAddPhoto} activeOpacity={0.7}>
            <Text style={styles.photoAddBtnIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Catégorie */}
      <Text style={styles.label}>Catégorie</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !selectedLabel && styles.placeholder]}>
          {selectedLabel ?? "Sélectionner une catégorie"}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      {/* Localisation (affichage seul) */}
      <Text style={styles.label}>Localisation</Text>
      <TextInput
        style={[styles.input, styles.inputReadonly]}
        value={address}
        editable={false}
        placeholder="Appuyez sur la carte pour définir le lieu"
        placeholderTextColor={colors.text + "55"}
      />

      <Button
        label="Envoyer le signalement"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!selectedType || !description.trim()}
      />
      {(!selectedType || !description.trim()) && (
        <Text style={styles.validationHint}>
          {!selectedType && !description.trim()
            ? "Sélectionnez une catégorie et entrez une description"
            : !selectedType
              ? "Sélectionnez une catégorie"
              : "Entrez une description"}
        </Text>
      )}

      {/* Modal sélection catégorie */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Catégorie</Text>
            {INCIDENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.option,
                  selectedType === t.value && styles.optionActive,
                ]}
                onPress={() => {
                  setSelectedType(t.value);
                  setPickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedType === t.value && styles.optionTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.background,
      padding: 20,
      paddingBottom: 48,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      textAlign: "center",
      marginBottom: 20,
    },
    mapContainer: {
      height: 180,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 6,
    },
    map: { flex: 1 },
    mapLoader: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? c.secondary : "#e8e6db",
    },
    hint: {
      fontSize: 12,
      color: c.text,
      opacity: 0.45,
      textAlign: "center",
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: c.text,
      marginBottom: 6,
    },
    textarea: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.inputBorder,
      padding: 12,
      fontSize: 14,
      color: c.text,
      minHeight: 90,
      marginBottom: 16,
    },
    input: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.inputBorder,
      padding: 12,
      height: 46,
      fontSize: 14,
      color: c.text,
      marginBottom: 24,
    },
    inputReadonly: { backgroundColor: isDark ? c.secondary : "#f4f2ea", color: c.text },
    select: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.inputBorder,
      paddingHorizontal: 12,
      height: 46,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectText: { fontSize: 14, color: c.text },
    placeholder: { color: c.text + "66" },
    arrow: { fontSize: 16, color: c.text + "88" },
    overlay: { flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: c.white,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
      marginBottom: 12,
    },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 4,
    },
    optionActive: { backgroundColor: c.primary + "22" },
    optionText: { fontSize: 15, color: c.text },
    optionTextActive: { fontWeight: "700", color: c.primary },
    validationHint: {
      fontSize: 13,
      color: c.statusRed,
      textAlign: "center",
      marginTop: 8,
      opacity: 0.8,
    },
    photosRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    photoThumb: {
      width: 72,
      height: 72,
      borderRadius: 10,
      overflow: "hidden",
    },
    photoImg: {
      width: 72,
      height: 72,
    },
    photoRemoveBtn: {
      position: "absolute",
      top: 3,
      right: 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#000a",
      alignItems: "center",
      justifyContent: "center",
    },
    photoRemoveBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    photoAddBtn: {
      width: 72,
      height: 72,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.inputBg,
    },
    photoAddBtnIcon: { fontSize: 28, color: c.text, opacity: 0.4 },
  });
}
