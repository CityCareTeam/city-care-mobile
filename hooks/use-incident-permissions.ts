import { useAuth } from "@/context/AuthContext";
import type { IncidentResponse, PhotoResponse } from "@/types/incidents";

type IncidentPermissions = {
  canAccessChat: boolean;
  canChangeStatus: boolean;
  canDeleteIncident: boolean;
  canReportIncident: boolean;
  canVote: boolean;
  /**
   * Signaler un contenu à la modération. Refusé au personnel, pour la même
   * raison que le vote : un agent tranche, il ne prend pas parti dans la file
   * qu'il devra ensuite traiter. Se signaler à soi-même n'apporte rien.
   */
  canFlagContent: boolean;
  /** Masquer directement — ce que le personnel a à la place du signalement. */
  canHideContent: boolean;
  canDeletePhoto: (photo: Pick<PhotoResponse, "uploadedByUserId">) => boolean;
};

export function useIncidentPermissions(
  incident: IncidentResponse | null,
): IncidentPermissions {
  const { isStaff, isAdmin, dbUser } = useAuth();

  return {
    canAccessChat: isStaff || incident?.authorUserId === dbUser?.id,
    canChangeStatus: isStaff,
    canDeleteIncident: isAdmin,
    canReportIncident: !isStaff,
    canVote: !!dbUser && !isStaff,
    canFlagContent: !!dbUser && !isStaff,
    canHideContent: isStaff,
    canDeletePhoto: (photo) => isAdmin || dbUser?.id === photo.uploadedByUserId,
  };
}
