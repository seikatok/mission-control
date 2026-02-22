"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  GOAL_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  OUTPUT_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  DECISION_STATUS_LABELS,
  DECISION_STATUS_COLORS,
} from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";

const GOAL_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600",
  paused: "bg-yellow-600",
  completed: "bg-blue-600",
  archived: "bg-zinc-600",
};

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const goalId = id as Id<"goals">;

  const goal = useQuery(api.goals.get, { id: goalId });
  const boards = useQuery(api.boards.list, { goalId });
  const outputs = useQuery(api.outputs.list, { goalId, limit: 5 });
  const decisions = useQuery(api.decisions.list, { status: "pending", limit: 5 });

  if (goal === undefined) return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  if (goal === null) return <div className="p-6 text-sm text-slate-400">Goal not found</div>;

  const goalDecisions = decisions?.filter((d) => d.goalId === goalId) ?? [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={goal.title}
        action={
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={() => router.push(`/goals/${goalId}/edit`)}
          >
            Edit
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={GOAL_STATUS_LABELS[goal.status]} colorClass={GOAL_STATUS_COLORS[goal.status] ?? "bg-slate-500"} />
            <StatusBadge label={PRIORITY_LABELS[goal.priority]} colorClass={PRIORITY_COLORS[goal.priority] ?? "bg-slate-500"} />
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-200 capitalize">{goal.domain}</span>
            {goal.area && <span className="text-sm text-slate-400">{goal.area}</span>}
          </div>
          {goal.description && <p className="text-sm text-slate-300">{goal.description}</p>}
          {goal.timeframe && (
            <p className="text-xs text-slate-500">
              {goal.timeframe.startDate && `From ${goal.timeframe.startDate}`}
              {goal.timeframe.endDate && ` → ${goal.timeframe.endDate}`}
            </p>
          )}
          {goal.successMetrics && goal.successMetrics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Success Metrics</p>
              <div className="space-y-1">
                {goal.successMetrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-slate-400">{m.label}:</span>
                    <span>{m.current ?? "–"}</span>
                    <span className="text-slate-600">/ {m.target ?? "–"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boards & Tasks */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Boards</h2>
          {!boards ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : boards.length === 0 ? (
            <EmptyState title="No boards" description="A default board is created with each goal" />
          ) : (
            <div className="space-y-2">
              {boards.map((board) => (
                <div key={board._id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900 px-4 py-2">
                  <span className="text-sm text-slate-200">{board.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300"
                    onClick={() => router.push(`/tasks?boardId=${board._id}`)}
                  >
                    View Tasks →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outputs */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Recent Outputs</h2>
          {!outputs || outputs.length === 0 ? (
            <EmptyState title="No outputs yet" />
          ) : (
            <div className="space-y-2">
              {outputs.map((out) => (
                <div key={out._id} className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900 px-4 py-2">
                  <span className="text-xs bg-slate-700 text-slate-300 rounded px-1.5 py-0.5">{OUTPUT_TYPE_LABELS[out.type] ?? out.type}</span>
                  <span className="text-sm text-slate-200 flex-1 truncate">{out.title}</span>
                  <TimeAgo ms={out.createdAt} className="text-xs text-slate-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decisions */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Pending Decisions</h2>
          {goalDecisions.length === 0 ? (
            <EmptyState title="No pending decisions" />
          ) : (
            <div className="space-y-2">
              {goalDecisions.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900 px-4 py-2 cursor-pointer hover:bg-slate-800"
                  onClick={() => router.push(`/decisions/${d._id}`)}
                >
                  <StatusBadge label={DECISION_STATUS_LABELS[d.status]} colorClass={DECISION_STATUS_COLORS[d.status] ?? "bg-slate-500"} />
                  <span className="text-sm text-slate-200 flex-1 truncate">{d.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
