"use client";

import * as React from "react";

/**
 * Permissions context (Features A.3.4 + A.3.5).
 * Seeded from the server (no loading flash) and kept in sync client-side.
 * The frontend check is a UX convenience; the backend requirePermission()
 * stays the real security boundary. Both read the same matrix.
 */
interface PermissionsState {
  role: string | null;
  permissions: string[];
  ready: boolean;
}

const PermissionsContext = React.createContext<PermissionsState>({
  role: null,
  permissions: [],
  ready: false,
});

export function PermissionsProvider({
  initialRole,
  initialPermissions,
  children,
}: {
  initialRole: string | null;
  initialPermissions: string[];
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<PermissionsState>({
    role: initialRole,
    permissions: initialPermissions,
    ready: true, // seeded from server -> immediately usable
  });

  // Re-sync from the API in the background (e.g. after impersonation changes).
  React.useEffect(() => {
    let active = true;
    fetch("/api/auth/permissions")
      .then((r) => r.json())
      .then((j) => {
        if (active && j.ok) {
          setState({
            role: j.data.role,
            permissions: j.data.permissions ?? [],
            ready: true,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <PermissionsContext.Provider value={state}>
      {children}
    </PermissionsContext.Provider>
  );
}

/** Full permissions context (role + list + helpers). */
export function usePermissions() {
  const ctx = React.useContext(PermissionsContext);
  const has = React.useCallback(
    (perm: string) => ctx.permissions.includes(perm),
    [ctx.permissions]
  );
  const hasAny = React.useCallback(
    (perms: string[]) => perms.some((p) => ctx.permissions.includes(p)),
    [ctx.permissions]
  );
  const hasAll = React.useCallback(
    (perms: string[]) => perms.every((p) => ctx.permissions.includes(p)),
    [ctx.permissions]
  );
  return { ...ctx, has, hasAny, hasAll };
}

/** Boolean hook: usePermission("finance.record_payment") -> true/false. */
export function usePermission(permission: string): boolean {
  const { has } = usePermissions();
  return has(permission);
}
