"use client";

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { GOAL_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GOAL_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600",
  paused: "bg-yellow-600",
  completed: "bg-blue-600",
  archived: "bg-zinc-600",
};

function GoalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const domainFromUrl = (searchParams.get("domain") ?? "all") as "all" | "work" | "personal";
  const statusFromUrl = (searchParams.get("status") ?? "all") as "all" | "active" | "paused" | "completed" | "archived";

  function setDomain(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "all") { params.delete("domain"); } else { params.set("domain", v); }
    router.replace(`/goals?${params.toString()}`);
  }

  function setStatus(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "all") { params.delete("status"); } else { params.set("status", v); }
    router.replace(`/goals?${params.toString()}`);
  }

  const goals = useQuery(api.goals.list, {
    domain: domainFromUrl === "all" ? undefined : domainFromUrl,
    status: statusFromUrl === "all" ? undefined : statusFromUrl,
  });

  return (
    <>
      <div className="flex gap-3 px-6 py-3 border-b border-slate-800">
        <Select value={domainFromUrl} onValueChange={setDomain}>
          <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFromUrl} onValueChange={setStatus}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!goals ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            title="ゴールが見つかりません"
            description="最初のゴールを作成してタスクを追加しましょう"
            action={<Button onClick={() => router.push("/goals/new")} className="bg-blue-600 hover:bg-blue-700">New Goal</Button>}
          />
        ) : (
          <div className="grid gap-3">
            {goals.map((goal) => (
              <div
                key={goal._id}
                className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800 transition-colors"
                onClick={() => router.push(`/goals/${goal._id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-slate-100 truncate">{goal.title}</h3>
                      <StatusBadge
                        label={GOAL_STATUS_LABELS[goal.status] ?? goal.status}
                        colorClass={GOAL_STATUS_COLORS[goal.status] ?? "bg-slate-500"}
                      />
                      <StatusBadge
                        label={PRIORITY_LABELS[goal.priority] ?? goal.priority}
                        colorClass={PRIORITY_COLORS[goal.priority] ?? "bg-slate-500"}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className={cn("capitalize", goal.domain === "work" ? "text-blue-400" : "text-purple-400")}>
                        {goal.domain}
                      </span>
                      {goal.area && <span>· {goal.area}</span>}
                      {goal.timeframe?.endDate && <span>· Due {goal.timeframe.endDate}</span>}
                    </div>
                    {goal.description && (
                      <p className="mt-1.5 text-sm text-slate-400 line-clamp-1">{goal.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function GoalsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Goals"
        description="目標とアウトカムの管理"
        action={
          <Button onClick={() => router.push("/goals/new")} className="bg-blue-600 hover:bg-blue-700">
            + New Goal
          </Button>
        }
      />
      <Suspense fallback={<div className="h-8 animate-pulse bg-slate-800 rounded mx-6 my-3" />}>
        <GoalsContent />
      </Suspense>
    </div>
  );
}
