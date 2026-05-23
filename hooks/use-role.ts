import { getMe } from "@/services/auth";
import { getValidToken } from "@/storage/tokens";
import type { MeResponse } from "@/types/auth";
import { useEffect, useState } from "react";

type Role = MeResponse["mainRole"];

type UseRoleResult = {
  role: Role;
  firstName: string | null;
  isStaff: boolean;
  isAdmin: boolean;
};

/**
 * Charge le rôle de l'utilisateur connecté une seule fois au montage.
 * Fournit également des drapeaux dérivés `isStaff` et `isAdmin`.
 */
export function useRole(): UseRoleResult {
  const [role, setRole] = useState<Role>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getValidToken();
        if (!token || cancelled) return;
        const me = await getMe(token);
        if (!cancelled) {
          setRole(me.mainRole);
          setFirstName(me.firstName);
        }
      } catch {
        // silencieux — rôle reste null
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    role,
    firstName,
    isStaff: role === "Admin" || role === "Agent",
    isAdmin: role === "Admin",
  };
}
