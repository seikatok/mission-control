"use client";

import { Suspense, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskCard } from "@/components/tasks/task-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

function TasksSkeleton({ type }: { type: "kanban" | "list" }) {
  if (type === "kanban") {
    return (
      <div className="flex gap-4 overflow-x-auto">
        {[...Array(5)].map((_, col) => (
          <div key={col} className="w-64 shrink-0 space-y-2">
            <Skeleton className="h-6 w-24" />
            {[...Array(3)].map((_, row) => (
              <Skeleton key={row} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultBoardId = searchParams.get("boardId") ?? "";

  const [selectedBoardId, setSelectedBoardId] = useState<string>(defaultBoardId);
  const [goalFilter, setGoalFilter] = useState<string>("all");

  const boards = useQuery(api.boards.list, {});
  const goals = useQuery(api.goals.list, {});
  const boardTasks = useQuery(
    api.tasks.list,
    selectedBoardId ? { boardId: selectedBoardId as Id<"boards"> } : "skip"
  );
  const recentTasks = useQuery(
    api.tasks.listRecent,
    !selectedBoardId ? { limit: 50 } : "skip"
  );
  const unassignedTasks = useQuery(
    api.tasks.listUnassigned,
    !selectedBoardId ? { limit: 50 } : "skip"
  );

  const tasksForBoard = boardTasks ?? [];
  const filteredBoardTasks = goalFilter !== "all"
    ? tasksForBoard.filter((t) => t.goalId === goalFilter)
    : tasksForBoard;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tasks"
        description="カンバンボードとタスク管理"
        action={
          <Button onClick={() => router.push("/tasks/new")} className="bg-blue-600 hover:bg-blue-700">
            + New Task
          </Button>
        }
      />

      {/* Board selector */}
      <div className="flex gap-3 items-center px-6 py-3 border-b border-slate-800">
        <Select value={selectedBoardId || "_none"} onValueChange={(v) => setSelectedBoardId(v === "_none" ? "" : v)}>
          <SelectTrigger className="w-56 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="ボードを選択..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">— ボードなし (最近更新) —</SelectItem>
            {boards?.map((b) => (
              <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedBoardId && (
          <Select value={goalFilter} onValueChange={setGoalFilter}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-sm">
              <SelectValue placeholder="ゴールで絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのゴール</SelectItem>
              {goals?.map((g) => (
                <SelectItem key={g._id} value={g._id}>{g.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 overflow-hidden p-6">
        {selectedBoardId ? (
          /* Kanban View */
          !boardTasks ? (
            <TasksSkeleton type="kanban" />
          ) : filteredBoardTasks.length === 0 ? (
            <EmptyState
              title="このボードにタスクはありません"
              action={<Button onClick={() => router.push("/tasks/new")} className="bg-blue-600 hover:bg-blue-700">New Task</Button>}
            />
          ) : (
            <KanbanBoard tasks={filteredBoardTasks} />
          )
        ) : (
          /* List View (recent + unassigned) */
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-3">最近更新されたタスク</h2>
              {!recentTasks ? (
                <TasksSkeleton type="list" />
              ) : recentTasks.length === 0 ? (
                <EmptyState
                  title="タスクはまだありません"
                  action={<Button onClick={() => router.push("/tasks/new")} className="bg-blue-600 hover:bg-blue-700">New Task</Button>}
                />
              ) : (
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {recentTasks.filter((t) => t.status !== "canceled").map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              )}
            </div>

            {unassignedTasks && unassignedTasks.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-slate-400 mb-3">未割り当て (ボードなし)</h2>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {unassignedTasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full">
          <PageHeader title="Tasks" description="カンバンボードとタスク管理" />
          <div className="p-6">
            <TasksSkeleton type="list" />
          </div>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
