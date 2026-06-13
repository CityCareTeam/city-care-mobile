import { STRINGS } from "@/constants/strings";
import { deletePhoto, getPhotos, getStatusHistory } from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { PhotoResponse, StatusHistoryEntry } from "@/types/incidents";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export function useIncidentPhotos(incidentId: string | null) {
  const [photos, setPhotos] = useState<PhotoResponse[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState(false);

  useEffect(() => {
    if (!incidentId) {
      setPhotos([]);
      setStatusHistory([]);
      setPhotosError(false);
      return;
    }
    setPhotosLoading(true);
    setPhotosError(false);
    Promise.all([
      getPhotos(incidentId).catch(() => { setPhotosError(true); return [] as PhotoResponse[]; }),
      getStatusHistory(incidentId).catch(() => [] as StatusHistoryEntry[]),
    ]).then(([p, h]) => {
      setPhotos(p);
      setStatusHistory(h);
    }).finally(() => setPhotosLoading(false));
  }, [incidentId]);

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(STRINGS.photos.deleteConfirmTitle, STRINGS.photos.deleteConfirmMsg, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getValidToken();
            if (!token) return;
            await deletePhoto(incidentId!, photoId, token);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          } catch {
            Alert.alert(STRINGS.alert.errorTitle, STRINGS.photos.deleteError);
          }
        },
      },
    ]);
  };

  return { photos, photosLoading, photosError, statusHistory, handleDeletePhoto };
}
