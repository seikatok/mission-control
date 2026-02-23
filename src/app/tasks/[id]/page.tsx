"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TimeAgo } from "@/components/shared/time-ago";
import { MoveStatusMenu } from "@/components/tasks/move-status-menu";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  DECISION_STATUS_LABELS,
  DECISION_STATUS_COLORS,
  OUTPUT_TYPE_LABELS,
} from "@/lib/constants";
import { formatDate, formatAge, timeAgo } from "@/lib/utils";
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
import { NotFound } from "@/components/shared/not-found";

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

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const taskId = id as Id<"tasks">;

  const task = useQuery(api.tasks.get, { id: taskId });
  const goal = useQuery(api.goals.get, task ? { id: task.goalId } : "skip");
  const outputs = useQuery(api.outputs.list, task ? { taskId: task._id, limit: 10 } : "skip");
  const activities = useQuery(api.activityEvents.list, task ? { taskId: task._id, limit: 20 } : "skip");
  const linkedDecision = useQuery(
    api.decisions.get,
    task?.latestDecisionId ? { id: task.latestDecisionId } : "skip"
  );

  if (task === undefined) {
    return (
      <div className="p-6 space-y-4 max-w-3xl animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-20 w-full bg-slate-800 rounded" />
      </div>
    );
  }

  if (task === null) {
    return <NotFound title="タスクが見つかりません" backHref="/tasks" backLabel="タスク一覧に戻る" />;
  }

  const isOverdue =
    task.dueAt !== undefined &&
    task.dueAt < Date.now() &&
    task.status !== "done" &&
    task.status !== "canceled";

  return (
    <div className="flex flex-col h-full">
      <div data-testid="task-detail-title">
      <PageHeader
        title={task.title}
        action={
          <div className="flex items-center gap-2">
            <MoveStatusMenu taskId={task._id} currentStatus={task.status} />
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400">
              ← 戻る
            </Button>
          </div>
        }
      />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
        {/* Section 1: Basic Info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
          <div data-testid="task-status-badge" className="flex flex-wrap gap-2">
            <StatusBadge
              label={TASK_STATUS_LABELS[task.status] ?? task.status}
              colorClass={TASK_STATUS_COLORS[task.status] ?? "bg-slate-500"}
            />
            <StatusBadge
              label={PRIORITY_LABELS[task.priority] ?? task.priority}
              colorClass={PRIORITY_COLORS[task.priority] ?? "bg-slate-500"}
            />
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-slate-400">
              Goal:{" "}
              {goal ? (
                <button
                  onClick={() => router.push(`/goals/${task.goalId}`)}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {goal.title}
                </button>
              ) : goal === null ? (
                <span className="text-slate-500">—</span>
              ) : (
                <span className="text-slate-500">読み込み中...</span>
              )}
            </p>
            <p className="text-slate-400">
              期限:{" "}
              {task.dueAt ? (
                <span className={isOverdue ? "text-red-400 font-medium" : "text-slate-300"}>
                  {formatDate(task.dueAt)}
                  {isOverdue && ` (${formatAge(Date.now() - task.dueAt)} 超過)`}
                </span>
              ) : (
                <span className="text-slate-500">未設定</span>
              )}
            </p>
            <p className="text-slate-400">
              担当:{" "}
              {task.assignee ? (
                <span className="text-slate-300">
                  {task.assignee.type === "human" ? "Human" : "Agent"}
                  {task.assignee.userId && ` (${task.assignee.userId})`}
                  {task.assignee.agentId && ` (${task.assignee.agentId})`}
                </span>
              ) : (
                <span className="text-slate-500">未割当</span>
              )}
            </p>
            <div className="flex gap-4 text-xs text-slate-500 pt-1">
              <span>作成: <TimeAgo ms={task.createdAt} /></span>
              <span>更新: <TimeAgo ms={task.updatedAt} /></span>
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        {task.description && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-2">説明</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Section 3: Linked Decision */}
        {task.latestDecisionId && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-2">関連判断</h2>
            {linkedDecision === undefined ? (
              <div className="animate-pulse h-8 w-full bg-slate-800 rounded" />
            ) : linkedDecision === null ? (
              <p className="text-sm text-slate-500">判断情報を取得できません</p>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusBadge
                    label={DECISION_STATUS_LABELS[linkedDecision.status] ?? linkedDecision.status}
                    colorClass={DECISION_STATUS_COLORS[linkedDecision.status] ?? "bg-slate-500"}
                  />
                  <span className="text-sm text-slate-200 truncate">{linkedDecision.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 shrink-0"
                  onClick={() => router.push(`/decisions/${linkedDecision._id}`)}
                >
                  判断を表示 →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Outputs */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-slate-400">成果物</h2>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300"
              onClick={() =>
                router.push(`/outputs/new?taskId=${task._id}&goalId=${task.goalId}`)
              }
            >
              + 成果物を登録
            </Button>
          </div>
          {outputs === undefined ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse h-8 w-full bg-slate-800 rounded" />
              ))}
            </div>
          ) : outputs.length === 0 ? (
            <EmptyState
              title="このタスクの成果物はまだありません"
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {outputs.map((out) => (
                <div
                  key={out._id}
                  className="flex items-center gap-3 rounded border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <span className="text-xs bg-slate-700 text-slate-300 rounded px-1.5 py-0.5">
                    {OUTPUT_TYPE_LABELS[out.type] ?? out.type}
                  </span>
                  <span className="text-sm text-slate-200 flex-1 truncate">{out.title}</span>
                  <TimeAgo ms={out.createdAt} className="text-xs text-slate-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Activity */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-medium text-slate-400 mb-2">アクティビティ</h2>
          {activities === undefined ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-6 w-full bg-slate-800 rounded" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              title="アクティビティはまだありません"
              className="py-8"
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities
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
        </div>
      </div>
    </div>
  );
}
