"use client";

import { Suspense, useMemo, useState } from "react";
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
import Link from "next/link";

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

const STATUS_PRESETS = [
  { key: "all",              label: "すべて" },
  { key: "in_progress",      label: "進行中" },
  { key: "waiting_decision", label: "判断待ち" },
  { key: "blocked",          label: "ブロック中" },
  { key: "overdue",          label: "期限超過" },
] as const;

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultBoardId = searchParams.get("boardId") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";

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

  const allListTasks = useMemo(() => {
    const recent = recentTasks ?? [];
    const unassigned = unassignedTasks ?? [];
    const combined = [...recent, ...unassigned.filter((u) => !recent.some((r) => r._id === u._id))];
    return combined.filter((t) => t.status !== "canceled");
  }, [recentTasks, unassignedTasks]);

  const filteredListTasks = useMemo(() => {
    if (statusFilter === "all") return allListTasks;
    if (statusFilter === "overdue")
      return allListTasks.filter((t) => t.dueAt !== undefined && t.dueAt < Date.now());
    return allListTasks.filter((t) => t.status === statusFilter);
  }, [allListTasks, statusFilter]);

  const tasksForBoard = boardTasks ?? [];
  const filteredBoardTasks = goalFilter !== "all"
    ? tasksForBoard.filter((t) => t.goalId === goalFilter)
    : tasksForBoard;

  function setStatusFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("status");
    } else {
      params.set("status", key);
    }
    router.replace(`/tasks?${params.toString()}`);
  }

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
      <div className="flex gap-3 items-center px-6 py-3 border-b border-slate-800 flex-wrap">
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

        {!selectedBoardId && (
          <div className="flex gap-1">
            {STATUS_PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => setStatusFilter(preset.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === preset.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
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
          /* List View */
          !recentTasks && !unassignedTasks ? (
            <TasksSkeleton type="list" />
          ) : filteredListTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12">
              <p className="text-sm text-slate-400">タスクはまだありません</p>
              <Link href="/tasks/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">最初のタスクを作成</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredListTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )
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
