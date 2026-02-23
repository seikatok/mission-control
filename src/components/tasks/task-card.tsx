"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { StatusBadge } from "@/components/shared/status-badge";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { MoveStatusMenu } from "./move-status-menu";
import { formatDate, formatAge } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TaskCardProps {
  task: Doc<"tasks">;
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const isOverdue =
    task.dueAt !== undefined &&
    task.dueAt < Date.now() &&
    task.status !== "done" &&
    task.status !== "canceled";

  return (
    <div
      data-testid="task-card"
      className={cn("rounded border bg-slate-950 p-3 space-y-2 transition-colors cursor-pointer", isOverdue ? "border-red-700" : "border-slate-800 hover:border-slate-700")}
      onClick={() => router.push(`/tasks/${task._id}`)}
    >
      <p data-testid="task-card-title" className="text-sm font-medium text-slate-100 leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge
          label={PRIORITY_LABELS[task.priority] ?? task.priority}
          colorClass={PRIORITY_COLORS[task.priority] ?? "bg-slate-500"}
        />
        {task.dueAt && (
          <span className={cn("text-xs", isOverdue ? "text-red-400" : "text-slate-500")}>
            {isOverdue ? `${formatAge(Date.now() - task.dueAt)} 超過` : `Due ${formatDate(task.dueAt)}`}
          </span>
        )}
      </div>
      <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
        <MoveStatusMenu taskId={task._id} currentStatus={task.status} />
      </div>
    </div>
  );
}
