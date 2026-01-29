"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLayoutState } from "@components/global/Context";

/**
 * Route prefixes that are restricted to a single active role.
 * If the user's current active role doesn't match, they are redirected to /dashboard.
 */
const ADMIN_ONLY_PREFIXES = ["/dashboard/deletion-requests", "/dashboard/verification-requests"];
const VERIFICADOR_ONLY_PREFIXES = ["/dashboard/revision", "/revisions"];
const MODELADOR_ONLY_PREFIXES = ["/dashboard/shared", "/dashboard/projects", "/versions", "/share"];

function getPathRequiredRole(path: string): string | null {
  if (ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) return "admin";
  if (VERIFICADOR_ONLY_PREFIXES.some((p) => path.startsWith(p))) return "verificador";
  if (MODELADOR_ONLY_PREFIXES.some((p) => path.startsWith(p))) return "modelador";
  return null;
}

/**
 * Ensures the current path is allowed for the user's active role.
 * MODELADOR cannot access VERIFICADOR or ADMIN routes, and vice versa.
 */
export default function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole } = useLayoutState();

  useEffect(() => {
    if (!pathname || !activeRole) return;

    const normalizedPath = pathname.replace(/\/$/, "") || "/";
    const requiredRole = getPathRequiredRole(normalizedPath);

    if (requiredRole && activeRole.toLowerCase() !== requiredRole.toLowerCase()) {
      router.replace("/dashboard");
    }
  }, [pathname, activeRole, router]);

  return <>{children}</>;
}
