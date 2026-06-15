import { useAuth } from "@/context/AuthContext";
import type { IncidentResponse, PhotoResponse } from "@/types/incidents";

type IncidentPermissions = {
  canAccessChat: boolean;
  canChangeStatus: boolean;
  canDeleteIncident: boolean;
  canReportIncident: boolean;
  canVote: boolean;
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
    canDeletePhoto: (photo) => isAdmin || dbUser?.id === photo.uploadedByUserId,
  };
}
