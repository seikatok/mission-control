"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { StatusBadge } from "@/components/shared/status-badge";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { MoveStatusMenu } from "./move-status-menu";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Doc<"tasks">;
}

export function TaskCard({ task }: TaskCardProps) {
  const isOverdue =
    task.dueAt !== undefined &&
    task.dueAt < Date.now() &&
    task.status !== "done" &&
    task.status !== "canceled";

  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-3 space-y-2 hover:border-slate-700 transition-colors">
      <p className="text-sm font-medium text-slate-100 leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge
          label={PRIORITY_LABELS[task.priority] ?? task.priority}
          colorClass={PRIORITY_COLORS[task.priority] ?? "bg-slate-500"}
        />
        {task.dueAt && (
          <span className={cn("text-xs", isOverdue ? "text-red-400" : "text-slate-500")}>
            {isOverdue ? "⚠ " : ""}Due {formatDate(task.dueAt)}
          </span>
        )}
      </div>
      <MoveStatusMenu taskId={task._id} currentStatus={task.status} />
    </div>
  );
}
