import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  BookOpen,
  Building2,
  ClipboardCheck,
  Database,
  FileBarChart2,
  FileText,
  GitBranch,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Map,
  Paperclip,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Route map — single source of truth for navigation (plan §5.2/§5.3).
 * `permission` mirrors the backend catalog (shared/constants/permissions.ts);
 * the sidebar shows an item only when the user holds it. `phase` marks which
 * build phase ships the screen — later-phase items render disabled with a
 * phase chip instead of silently 404ing.
 */
export type NavGroup =
  | "Overview"
  | "Programme"
  | "Operations"
  | "Enforcement"
  | "Proof"
  | "System";

export interface AppRoute {
  href: string;
  label: string;
  /** One-line purpose, used in breadcrumb tooltips and the search palette. */
  description: string;
  group: NavGroup;
  icon: LucideIcon;
  /** Read permission from the backend catalog; absent = any authenticated user. */
  permission?: string;
  /** Build phase that ships the screen (1 = shipped with Phase 1 shell). */
  phase: number;
  /** Screen exists in the current build — false keeps the item disabled. */
  shipped?: boolean;
  /** Match pathname prefix instead of exact equality. */
  prefixMatch?: boolean;
}

/** True when the route's screen exists and is reachable at this build phase. */
export function isRouteLive(route: AppRoute): boolean {
  return Boolean(route.shipped) && route.phase <= CURRENT_PHASE;
}

/** Build phase shipped so far — later-phase nav items render disabled. */
export const CURRENT_PHASE = 8;

export const NAV_GROUPS: NavGroup[] = [
  "Overview",
  "Programme",
  "Operations",
  "Enforcement",
  "Proof",
  "System",
];

export const APP_ROUTES: AppRoute[] = [
  // Overview ----------------------------------------------------------------
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Compliance score, violations, evidence and rights at a glance",
    group: "Overview",
    icon: LayoutDashboard,
    phase: 1,
    shipped: true,
  },

  // Programme ---------------------------------------------------------------
  {
    href: "/framework",
    label: "Framework",
    description: "Generate and manage the compliance programme",
    group: "Programme",
    icon: BookOpen,
    permission: "framework:read",
    phase: 3,
    shipped: true,
  },
  {
    href: "/framework/roadmap",
    label: "Roadmap",
    description: "Phased rollout plan with due dates",
    group: "Programme",
    icon: Map,
    permission: "framework:read",
    phase: 3,
    shipped: true,
  },
  {
    href: "/controls",
    label: "Controls",
    description: "Control register with owners, status and evidence coverage",
    group: "Programme",
    icon: ShieldCheck,
    permission: "control:read",
    phase: 3,
    shipped: true,
  },
  {
    href: "/requirements",
    label: "Obligations",
    description: "Legal obligations mapped to controls",
    group: "Programme",
    icon: ListChecks,
    permission: "requirement:read",
    phase: 3,
    shipped: true,
  },

  // Operations --------------------------------------------------------------
  {
    href: "/inventory",
    label: "Inventory",
    description: "Data assets, sensitivity and retention",
    group: "Operations",
    icon: Database,
    permission: "data_asset:read",
    phase: 4,
    shipped: true,
  },
  {
    href: "/processing",
    label: "Processing",
    description: "Processing activities per data asset",
    group: "Operations",
    icon: GitBranch,
    permission: "processing_activity:read",
    phase: 4,
    shipped: true,
  },
  {
    href: "/notices",
    label: "Notices",
    description: "Privacy notices and their versions",
    group: "Operations",
    icon: FileText,
    permission: "notice:read",
    phase: 4,
    shipped: true,
  },
  {
    href: "/consent",
    label: "Consent",
    description: "Consent records and withdrawals",
    group: "Operations",
    icon: Handshake,
    permission: "consent:read",
    phase: 4,
    shipped: true,
  },
  {
    href: "/rights",
    label: "Rights",
    description: "Data subject request queue with SLA timers",
    group: "Operations",
    icon: UserRound,
    permission: "rights_request:read",
    phase: 7,
    shipped: true,
  },

  // Enforcement -------------------------------------------------------------
  {
    href: "/validations",
    label: "Validations",
    description: "Run and inspect compliance checks",
    group: "Enforcement",
    icon: Activity,
    permission: "validation:read",
    phase: 7,
    shipped: true,
  },
  {
    href: "/violations",
    label: "Violations",
    description: "Non-compliance queue with severity",
    group: "Enforcement",
    icon: AlertTriangle,
    permission: "violation:read",
    phase: 8,
    shipped: true,
  },
  {
    href: "/remediation",
    label: "Remediation",
    description: "Corrective tasks and verification",
    group: "Enforcement",
    icon: ClipboardCheck,
    permission: "remediation:read",
    phase: 8,
    shipped: true,
  },

  // Proof -------------------------------------------------------------------
  {
    href: "/evidence",
    label: "Evidence",
    description: "Evidence files and approval workflow",
    group: "Proof",
    icon: Paperclip,
    permission: "evidence:read",
    phase: 5,
    shipped: true,
  },
  {
    href: "/reports",
    label: "Reports",
    description: "Board-ready compliance reports",
    group: "Proof",
    icon: FileBarChart2,
    permission: "report:read",
    phase: 5,
    shipped: true,
  },
  {
    href: "/audit",
    label: "Audit",
    description: "Immutable activity trail",
    group: "Proof",
    icon: ScrollText,
    permission: "audit:read",
    phase: 5,
  },

  // System ------------------------------------------------------------------
  {
    href: "/notifications",
    label: "Notifications",
    description: "Alerts, digests and preferences",
    group: "System",
    icon: Bell,
    permission: "notification:read",
    phase: 3,
  },
  {
    href: "/ai",
    label: "AI assistant",
    description: "Explain and draft with the compliance copilot",
    group: "System",
    icon: Bot,
    permission: "ai:explain",
    phase: 5,
  },
  {
    href: "/users",
    label: "Users",
    description: "People, invites and status",
    group: "System",
    icon: Users,
    permission: "user:read",
    phase: 3,
  },
  {
    href: "/roles",
    label: "Roles",
    description: "Role permission catalog",
    group: "System",
    icon: Shield,
    permission: "role:read",
    phase: 3,
  },
  {
    href: "/departments",
    label: "Departments",
    description: "Organizational units",
    group: "System",
    icon: Building2,
    permission: "department:read",
    phase: 4,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Organization profile",
    group: "System",
    icon: Settings,
    permission: "organization:read",
    phase: 4,
  },
];

/**
 * Routes the user may *see* in navigation, filtered by read permission (§6.4).
 * Later-phase items stay in the list — the sidebar renders them disabled with
 * a phase chip, so the information architecture is visible before the screen
 * exists. `maxPhase` lets callers trim to a specific build horizon.
 */
export function accessibleRoutes(
  permissions: string[] | undefined,
  maxPhase = Number.POSITIVE_INFINITY,
): AppRoute[] {
  return APP_ROUTES.filter(
    (route) =>
      route.phase <= maxPhase &&
      (!route.permission || permissions?.includes(route.permission)),
  );
}

/**
 * True when the user may see a given href. Unauthenticated users only see the
 * dashboard's reduced view at most; unknown hrefs are never "accessible".
 */
export function canAccessRoute(
  href: string,
  permissions: string[] | undefined,
): boolean {
  const route = APP_ROUTES.find((r) => r.href === href);
  if (!route) return false;
  if (route.permission && !permissions?.includes(route.permission)) return false;
  return true;
}

/** Find the route matching a pathname (prefix-aware for nested screens). */
export function routeForPathname(pathname: string): AppRoute | undefined {
  return APP_ROUTES.find(
    (route) =>
      route.href === pathname ||
      (route.prefixMatch && pathname.startsWith(`${route.href}/`)),
  );
}
