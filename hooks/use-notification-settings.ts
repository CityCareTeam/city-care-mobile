import { Toast } from "@/components/ui/ToastMessage";
import { STRINGS } from "@/constants/strings";
import { getNotificationSettings, updateNotificationSettings } from "@/services/notifications";
import { getValidToken } from "@/storage/tokens";
import type { NotificationSettingsResponse, UpdateNotificationSettingsRequest } from "@/types/notifications";
import { useEffect, useState } from "react";

type Settings = NotificationSettingsResponse;

export function useNotificationSettings(enabled: boolean) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setSettings(null);
    setLoadError(false);
    void (async () => {
      try {
        const token = await getValidToken();
        if (!token) throw new Error();
        setSettings(await getNotificationSettings(token));
      } catch {
        setLoadError(true);
      }
    })();
  }, [enabled]);

  const savePatch = async (patch: UpdateNotificationSettingsRequest, prev: Settings | null) => {
    try {
      const token = await getValidToken();
      if (!token) throw new Error(STRINGS.api.sessionExpired);
      await updateNotificationSettings(token, patch);
      Toast.show({ type: "success", text1: "Préférences enregistrées" });
    } catch (e) {
      setSettings(prev);
      Toast.show({ type: "error", text1: "Erreur", text2: e instanceof Error ? e.message : STRINGS.api.unknownError });
    }
  };

  const toggle = (key: keyof Omit<Settings, "followed_incident_types" | "updated_at">) => (val: boolean) => {
    const prev = settings;
    setSettings(s => s ? { ...s, [key]: val } : s);
    void savePatch({ [key]: val }, prev);
  };

  const toggleType = (type: string) => {
    if (!settings) return;
    const prev = settings;
    const followed_incident_types = settings.followed_incident_types.includes(type)
      ? settings.followed_incident_types.filter(t => t !== type)
      : [...settings.followed_incident_types, type];
    setSettings(s => s ? { ...s, followed_incident_types } : s);
    void savePatch({ followed_incident_types }, prev);
  };

  return { settings, loadError, toggle, toggleType };
}
