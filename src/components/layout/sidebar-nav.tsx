"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isEnabled } from "@/lib/feature-flags";
import {
  LayoutDashboard,
  CheckSquare,
  Package,
  Target,
  KanbanSquare,
  Users,
  Server,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/decisions", label: "Decisions", icon: CheckSquare },
  { href: "/outputs", label: "Outputs", icon: Package },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/gateways", label: "Gateways", icon: Server },
  { href: "/compliance", label: "Compliance", icon: ShieldAlert },
  { href: "/runs", label: "Runs", icon: Activity },
];

/** アクティブ判定が必要な nav リンク部分のみ Client Component */
export function SidebarNav() {
  const pathname = usePathname();
  const summary = useQuery(api.dashboard.getDashboardSummary, {});

  const pendingCount = summary?.decisions.pending ?? 0;
  const overdueCount = summary?.tasks.overdue ?? 0;

  useEffect(() => {
    document.title =
      pendingCount > 0
        ? `(${pendingCount}) Mission Control`
        : "Mission Control";
  }, [pendingCount]);

  function getBadgeCount(label: string): number {
    if (!isEnabled("FF_NOTIFICATION_BADGE")) return 0;
    if (label === "Decisions") return pendingCount;
    if (label === "Tasks") return overdueCount;
    return 0;
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        const badge = getBadgeCount(label);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
              active
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {badge > 0 && (
              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px]">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
