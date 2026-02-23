"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import {
  Target,
  CheckSquare,
  ArrowRight,
  Plus,
  RefreshCw,
  Activity,
  Server,
  ShieldAlert,
  Package,
  Users,
} from "lucide-react";

const EVENT_ICONS: Record<string, typeof Activity> = {
  goal_created: Target,
  goal_updated: Target,
  task_created: Plus,
  task_updated: RefreshCw,
  task_moved: ArrowRight,
  decision_created: CheckSquare,
  decision_resolved: CheckSquare,
  agent_created: Users,
  agent_status_changed: Users,
  run_created: Activity,
  run_status_changed: Activity,
  output_created: Package,
  compliance_created: ShieldAlert,
  gateway_heartbeat: Server,
  system_seed: RefreshCw,
};

export function ActivityFeed() {
  const events = useQuery(api.activityEvents.list, { limit: 20 });

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-400">
          最近のアクティビティ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!events ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">アクティビティはまだありません</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events
              .map((ev, i) => ({ ev, i }))
              .sort((a, b) =>
                b.ev._creationTime !== a.ev._creationTime
                  ? b.ev._creationTime - a.ev._creationTime
                  : a.i - b.i
              )
              .map(({ ev }) => ev)
              .map((ev) => {
              const Icon = EVENT_ICONS[ev.type] ?? Activity;
              return (
                <div key={ev._id} className="flex items-start gap-2">
                  <Icon className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-snug">
                      {ev.message ?? ev.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {timeAgo(ev.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
