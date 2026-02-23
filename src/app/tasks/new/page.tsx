"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";

export default function NewTaskPage() {
  const router = useRouter();
  const createTask = useMutation(api.tasks.create);
  const goals = useQuery(api.goals.list, {});
  const boards = useQuery(api.boards.list, {});

  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");
  const [boardId, setBoardId] = useState("_none");
  const [status, setStatus] = useState<"todo" | "in_progress" | "blocked" | "waiting_decision" | "done" | "canceled">("todo");
  const [priority, setPriority] = useState<"p1" | "p2" | "p3">("p2");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goalId) { toast.error("ゴールを選択してください"); return; }
    setIsSubmitting(true);
    try {
      await createTask({
        title,
        goalId: goalId as Id<"goals">,
        boardId: boardId === "_none" ? null : boardId as Id<"boards">,
        status,
        priority,
        description: description || undefined,
        dueAt: dueAt ? new Date(dueAt).getTime() : undefined,
      });
      toast.success("タスクを作成しました");
      router.push("/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="新規タスク" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>タイトル *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 bg-slate-900 border-slate-700" />
          </div>
          <div>
            <Label>ゴール *</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                <SelectValue placeholder="ゴールを選択..." />
              </SelectTrigger>
              <SelectContent>
                {goals?.map((g) => (
                  <SelectItem key={g._id} value={g._id}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ボード</Label>
            <Select value={boardId} onValueChange={setBoardId}>
              <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— ボードなし (未割当) —</SelectItem>
                {boards?.map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ステータス</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="waiting_decision">Waiting Decision</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>優先度</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">P1</SelectItem>
                  <SelectItem value="p2">P2</SelectItem>
                  <SelectItem value="p3">P3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>期限</Label>
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 bg-slate-900 border-slate-700" />
          </div>
          <div>
            <Label>説明</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 bg-slate-900 border-slate-700" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "作成中..." : "タスクを作成"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
