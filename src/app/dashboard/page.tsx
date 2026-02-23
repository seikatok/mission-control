"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn, formatAge, formatDate } from "@/lib/utils";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function DashboardPage() {
  const router = useRouter();
  const summary = useQuery(api.dashboard.getDashboardSummary, {});

  if (!summary) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="ダッシュボード" description="AI運用の現在の状況" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { kpi } = summary;
  const pendingCount = kpi.pendingDecisions.count;

  const kpiCards = [
    {
      title: "保留中の判断",
      description: "人間の承認を待っています",
      count: kpi.pendingDecisions.count,
      oldestAgeMs: kpi.pendingDecisions.oldestAgeMs,
      href: "/decisions",
      highlight: kpi.pendingDecisions.count > 0,
      highlightColor: "text-yellow-400",
    },
    {
      title: "判断待ちタスク",
      description: "Decision の結果を待っています",
      count: kpi.waitingDecisionTasks.count,
      oldestAgeMs: kpi.waitingDecisionTasks.oldestAgeMs,
      href: "/tasks",
      highlight: kpi.waitingDecisionTasks.count > 0,
      highlightColor: "text-yellow-400",
    },
    {
      title: "ブロック中",
      description: "何らかの理由で停止中",
      count: kpi.blockedTasks.count,
      oldestAgeMs: kpi.blockedTasks.oldestAgeMs,
      href: "/tasks",
      highlight: kpi.blockedTasks.count > 0,
      highlightColor: "text-red-400",
    },
    {
      title: "期限超過",
      description: "期限を過ぎたタスク",
      count: kpi.overdueTasks.count,
      oldestAgeMs: kpi.overdueTasks.oldestAgeMs,
      href: "/tasks",
      highlight: kpi.overdueTasks.count > 0,
      highlightColor: "text-red-400",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="ダッシュボード" description="AI運用の現在の状況" />

      {/* KPI Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
            onClick={() => router.push(card.href)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p
                  className={cn(
                    "text-3xl font-bold",
                    card.highlight ? card.highlightColor : "text-slate-100"
                  )}
                >
                  {card.count}
                </p>
                {card.oldestAgeMs != null && (
                  <span className="text-xs text-slate-500">
                    最長 {formatAge(card.oldestAgeMs)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top5 Lists */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Decisions Top5 */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              保留中の判断 Top5
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.pendingDecisions.top5.length === 0 ? (
              <p className="text-sm text-slate-500">該当なし</p>
            ) : (
              <div className="space-y-2">
                {kpi.pendingDecisions.top5.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2 hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => router.push(`/decisions/${d._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {d.title}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {d.type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <span className="ml-2 text-xs font-medium text-yellow-400 shrink-0">
                      {formatAge(d.ageMs)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks Top5 */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              期限超過タスク Top5
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.overdueTasks.top5.length === 0 ? (
              <p className="text-sm text-slate-500">該当なし</p>
            ) : (
              <div className="space-y-2">
                {kpi.overdueTasks.top5.map((t) => (
                  <div
                    key={t._id}
                    data-testid="overdue-task-item"
                    className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2 hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => router.push(`/tasks/${t._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p data-testid="overdue-task-title" className="text-sm font-bold text-red-400 truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        期限: {formatDate(t.dueAt)} / {t.priority.toUpperCase()}
                      </p>
                    </div>
                    <span className="ml-2 text-xs font-medium text-red-400 shrink-0">
                      {formatAge(t.ageMs)} 超過
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="px-6 mt-4">
        <ActivityFeed />
      </div>

      {/* Alert Banner */}
      {pendingCount > 0 && (
        <div className="px-6 mt-4">
          <div className="rounded-lg border border-yellow-800 bg-yellow-950/30 p-4">
            <p className="text-sm font-medium text-yellow-400">
              {pendingCount} 件の判断があなたの対応を待っています
            </p>
            <button
              onClick={() => router.push("/decisions")}
              className="mt-1 text-xs text-yellow-500 underline hover:text-yellow-300"
            >
              判断一覧へ →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
