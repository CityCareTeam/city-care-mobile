import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/ToastMessage";
import { CityCareColors } from "@/constants/theme";
import { createIncident, reverseGeocode } from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { IncidentType } from "@/types/incidents";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "Road", label: "Route abîmée" },
  { value: "Lighting", label: "Éclairage" },
  { value: "Waste", label: "Déchets" },
  { value: "Graffiti", label: "Graffiti" },
  { value: "Safety", label: "Sécurité" },
  { value: "Other", label: "Autre" },
];

// Centre par défaut : Lyon
const DEFAULT_COORDS = { latitude: 45.748, longitude: 4.847 };

export default function ReportScreen() {
  const mapRef = useRef<MapView>(null);
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    async function initLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const c = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(c);
          mapRef.current?.animateToRegion(
            { ...c, latitudeDelta: 0.005, longitudeDelta: 0.005 },
            800,
          );
          const result = await reverseGeocode(c.latitude, c.longitude);
          if (result) setAddress(result.address_label);
        } catch {
          // garde les coords par défaut
        }
      }
      setLocLoading(false);
    }
    initLocation();
  }, []);

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

  async function handleSubmit() {
    if (!selectedType || !description.trim()) return;
    setSubmitting(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert("Session expirée", "Reconnectez-vous pour continuer.");
        router.replace("/login");
        return;
      }
      await createIncident(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          type: selectedType,
          description: description.trim(),
        },
        token,
      );
      Toast.show({
        type: "success",
        text1: "Signalement envoyé",
        text2: "Votre incident a été enregistré.",
      });
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      Alert.alert("Erreur", msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLabel = INCIDENT_TYPES.find(
    (t) => t.value === selectedType,
  )?.label;
  const initialRegion: Region = {
    ...DEFAULT_COORDS,
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
            <ActivityIndicator color={CityCareColors.primary} />
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
              pinColor={CityCareColors.primary}
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
        placeholderTextColor={CityCareColors.text + "66"}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

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
        placeholderTextColor={CityCareColors.text + "55"}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: CityCareColors.background,
    padding: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: CityCareColors.text,
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
    backgroundColor: "#e8e6db",
  },
  hint: {
    fontSize: 12,
    color: CityCareColors.text,
    opacity: 0.45,
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: CityCareColors.text,
    marginBottom: 6,
  },
  textarea: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0ddd0",
    padding: 12,
    fontSize: 14,
    color: CityCareColors.text,
    minHeight: 90,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0ddd0",
    padding: 12,
    height: 46,
    fontSize: 14,
    color: CityCareColors.text,
    marginBottom: 24,
  },
  inputReadonly: { backgroundColor: "#f4f2ea", color: CityCareColors.text },
  select: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0ddd0",
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 14, color: CityCareColors.text },
  placeholder: { color: CityCareColors.text + "66" },
  arrow: { fontSize: 16, color: CityCareColors.text + "88" },
  overlay: { flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: CityCareColors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: CityCareColors.primary + "22" },
  optionText: { fontSize: 15, color: CityCareColors.text },
  optionTextActive: { fontWeight: "700", color: CityCareColors.primary },
  validationHint: {
    fontSize: 13,
    color: CityCareColors.statusRed ?? "#e53935",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },
});
