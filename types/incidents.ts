export type IncidentType =
  | "Road"
  | "Lighting"
  | "Waste"
  | "Graffiti"
  | "Safety"
  | "Other";

export type CreateIncidentPayload = {
  latitude: number;
  longitude: number;
  type: IncidentType;
  description: string;
};

export type IncidentResponse = {
  id: string;
  authorUserId: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  addressLabel: string;
  status: "reported" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type PhotoResponse = {
  id: string;
  incidentId: string;
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  createdAt: string;
};

export type IncidentListResponse = {
  data: IncidentResponse[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
};
