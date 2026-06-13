export type NotificationResponse = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  incident_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationsListResponse = {
  data: NotificationResponse[];
  unread_count: number;
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
};

export type NotificationSettingsResponse = {
  email_enabled: boolean;
  push_enabled: boolean;
  followed_incident_types: string[];
  updated_at: string;
};

export type UpdateNotificationSettingsRequest = {
  email_enabled?: boolean;
  push_enabled?: boolean;
  followed_incident_types?: string[];
};
