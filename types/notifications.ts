export type NotificationResponse = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  incident_id: string | null;
  is_read: boolean;
  message_count?: number;
  created_at: string;
};

export type NotificationsListResponse = {
  data: NotificationResponse[];
  unread_count: number;
  total: number;
  page: number;
  page_size: number;
};

export type NotificationSettingsResponse = {
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_incidents_enabled: boolean;
  in_app_messages_enabled: boolean;
  push_messages_enabled: boolean;
  followed_incident_types: string[];
  updated_at: string;
};

export type UpdateNotificationSettingsRequest = {
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_incidents_enabled?: boolean;
  in_app_messages_enabled?: boolean;
  push_messages_enabled?: boolean;
  followed_incident_types?: string[];
};
