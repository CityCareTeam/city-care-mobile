export type MessageResponse = {
  id: string;
  incident_id: string;
  author_user_id: string;
  author_name: string | null;
  author_role: "Admin" | "Agent" | "Citizen" | null;
  content: string;
  created_at: string;
};

export type CreateMessageRequest = {
  content: string;
};
