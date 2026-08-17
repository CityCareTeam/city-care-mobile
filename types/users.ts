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
  /**
   * État de modération, renvoyé seulement ici — c'est la seule liste où un
   * contenu masqué reparaît, et seulement pour son auteur.
   *
   * Facultatif parce qu'un serveur plus ancien ne l'envoie pas : absent se lit
   * comme « visible », ce qui était le comportement d'avant.
   */
  visibility?: "visible" | "hidden" | "removed";
};

export type MyIncidentsResponse = {
  data: MyIncidentItem[];
};
