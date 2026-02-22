"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  AGENT_STATUS_COLORS,
  AGENT_STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const pendingDecisions = useQuery(api.decisions.list, { status: "pending", limit: 200 });
  const overdueTasks = useQuery(api.tasks.listOverdue, { limit: 200 });
  const agents = useQuery(api.agents.list);
  const gateways = useQuery(api.gateways.list);

  const pendingCount = pendingDecisions?.length ?? 0;
  const overdueCount = overdueTasks?.length ?? 0;

  const agentsByStatus = agents?.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  const onlineGateways = gateways?.filter((g) => g.isOnline).length ?? 0;
  const offlineGateways = gateways?.filter((g) => !g.isOnline).length ?? 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Current state of all AI operations"
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Pending Decisions */}
        <Card
          className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
          onClick={() => router.push("/decisions")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-3xl font-bold", pendingCount > 0 ? "text-yellow-400" : "text-slate-100")}>
              {pendingCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">Awaiting human approval</p>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card
          className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
          onClick={() => router.push("/tasks")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-3xl font-bold", overdueCount > 0 ? "text-red-400" : "text-slate-100")}>
              {overdueCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">Past due date</p>
          </CardContent>
        </Card>

        {/* Agents by Status */}
        <Card
          className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
          onClick={() => router.push("/team")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{agents?.length ?? 0}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(agentsByStatus).map(([status, count]) => (
                <span
                  key={status}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white",
                    AGENT_STATUS_COLORS[status] ?? "bg-slate-500",
                  )}
                >
                  {AGENT_STATUS_LABELS[status] ?? status} {count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gateways */}
        <Card
          className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
          onClick={() => router.push("/gateways")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Gateways</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{gateways?.length ?? 0}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-400">{onlineGateways} online</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{offlineGateways} offline</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick summaries */}
      {pendingCount > 0 && (
        <div className="px-6">
          <div className="rounded-lg border border-yellow-800 bg-yellow-950/30 p-4">
            <p className="text-sm font-medium text-yellow-400">
              {pendingCount} decision{pendingCount > 1 ? "s" : ""} need{pendingCount === 1 ? "s" : ""} your attention
            </p>
            <button
              onClick={() => router.push("/decisions")}
              className="mt-1 text-xs text-yellow-500 underline hover:text-yellow-300"
            >
              Go to Decisions →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
