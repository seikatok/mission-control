"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { TaskCard } from "./task-card";
import { KANBAN_COLUMNS, TASK_STATUS_LABELS } from "@/lib/constants";

interface KanbanBoardProps {
  tasks: Doc<"tasks">[];
  goalId?: string;
}

export function KanbanBoard({ tasks, goalId }: KanbanBoardProps) {
  const filteredTasks = goalId
    ? tasks.filter((t) => t.goalId === goalId)
    : tasks;

  const byStatus = KANBAN_COLUMNS.reduce<Record<string, Doc<"tasks">[]>>((acc, col) => {
    acc[col] = filteredTasks.filter((t) => t.status === col);
    return acc;
  }, {});

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {KANBAN_COLUMNS.map((col) => (
        <div key={col} className="flex flex-col w-64 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {TASK_STATUS_LABELS[col]}
            </span>
            <span className="text-xs text-slate-600">{byStatus[col].length}</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {byStatus[col].length === 0 ? (
              <div className="rounded border border-dashed border-slate-800 p-3 text-center">
                <p className="text-xs text-slate-600">No tasks</p>
              </div>
            ) : (
              byStatus[col].map((task) => <TaskCard key={task._id} task={task} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
