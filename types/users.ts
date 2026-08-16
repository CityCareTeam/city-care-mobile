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
  /**
   * **Absente de la réponse.** `/users/me/incidents` ne projette que
   * l'identifiant, le type, le statut, l'adresse et la date — pas la
   * description. Le type l'annonçait obligatoire, ce qui a fait croire aux
   * écrans qu'ils l'avaient : la recherche sur « mes signalements » ne trouvait
   * donc jamais rien, et l'affichage la récupérait déjà en douce depuis le fil
   * de la ville.
   */
  description?: string;
  address_label: string;
  created_at: string;
};

export type MyIncidentsResponse = {
  data: MyIncidentItem[];
};
