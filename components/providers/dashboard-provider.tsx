"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SystemRoleSlug } from "@/lib/auth/constants";
import { type DashboardUser } from "@/lib/dashboard/mock-data";

export interface DashboardSession {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  organization: {
    id: string;
    slug: string;
    name: string;
  };
  roles: SystemRoleSlug[];
  permissions: string[];
  mfaVerified: boolean;
  isSuperAdmin: boolean;
}

interface DashboardContextValue {
  role: SystemRoleSlug;
  user: DashboardUser;
  session: DashboardSession;
  availableRoles: SystemRoleSlug[];
  setRole: (role: SystemRoleSlug) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function userDisplayName(session: DashboardSession): string {
  const fullName = [session.user.firstName, session.user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || session.user.email;
}

function initialsFor(name: string, email: string): string {
  const source = name.includes("@") ? email : name;
  const parts = source
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function createDashboardUser(
  session: DashboardSession,
  role: SystemRoleSlug,
): DashboardUser {
  const name = userDisplayName(session);
  return {
    name,
    email: session.user.email,
    role,
    organization: session.organization.name,
    avatarInitials: initialsFor(name, session.user.email),
  };
}

export function DashboardProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: DashboardSession;
}) {
  const availableRoles = useMemo<SystemRoleSlug[]>(
    () => (session.roles.length > 0 ? session.roles : ["employee"]),
    [session.roles],
  );
  const [role, setRoleState] = useState<SystemRoleSlug>(
    availableRoles[0] ?? "employee",
  );
  const user = useMemo(() => createDashboardUser(session, role), [session, role]);

  const setRole = useCallback((nextRole: SystemRoleSlug) => {
    if (availableRoles.includes(nextRole)) {
      setRoleState(nextRole);
    }
  }, [availableRoles]);

  const value = useMemo(
    () => ({ role, user, session, availableRoles, setRole }),
    [role, user, session, availableRoles, setRole],
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
