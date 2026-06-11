export type UserMeResponse = {
  id: string;
  keycloakId: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateMePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  newPassword?: string;
};

export type MyIncidentItem = {
  id: string;
  type: string;
  status: string;
  description: string;
  address_label: string;
  created_at: string;
};

export type MyIncidentsResponse = {
  data: MyIncidentItem[];
};
