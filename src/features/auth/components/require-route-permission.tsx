"use client";

import { usePathname } from "next/navigation";
import { routeForPathname } from "@/lib/navigation/routes";
import { RequirePermission } from "./require-permission";

/**
 * Applies the navigation catalog's read permission to direct URL visits as
 * well as sidebar navigation. Assessments remain outside this guard because
 * that workflow is maintained independently.
 */
export function RequireRoutePermission({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = routeForPathname(pathname);

  if (pathname.startsWith("/assessments") || !route?.permission) {
    return <>{children}</>;
  }

  return <RequirePermission perm={route.permission}>{children}</RequirePermission>;
}
