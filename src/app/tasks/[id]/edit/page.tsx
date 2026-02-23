"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";
import { NotFound } from "@/components/shared/not-found";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const taskId = id as Id<"tasks">;

  const task = useQuery(api.tasks.get, { id: taskId });
  const updateTask = useMutation(api.tasks.update);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"p1" | "p2" | "p3">("p2");
  const [dueAt, setDueAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (task && !initialized) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueAt(task.dueAt ? new Date(task.dueAt).toISOString().split("T")[0] : "");
      setInitialized(true);
    }
  }, [task, initialized]);

  if (task === undefined) {
    return (
      <div className="p-6 space-y-4 max-w-2xl animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-20 w-full bg-slate-800 rounded" />
      </div>
    );
  }

  if (task === null) {
    return <NotFound title="タスクが見つかりません" backHref="/tasks" backLabel="タスク一覧に戻る" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("タイトルを入力してください"); return; }
    setIsSubmitting(true);
    try {
      const dueAtMs = dueAt ? new Date(dueAt).getTime() : undefined;
      await updateTask({
        id: taskId,
        title: title.trim(),
        description: description || undefined,
        priority,
        ...(dueAtMs !== undefined ? { dueAt: dueAtMs } : {}),
      });
      toast.success("タスクを更新しました");
      router.push(`/tasks/${taskId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="タスクを編集" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>タイトル *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 bg-slate-900 border-slate-700"
            />
          </div>
          <div>
            <Label>説明</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1 bg-slate-900 border-slate-700"
            />
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
          <div>
            <Label>期限</Label>
            <Input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-700"
            />
            {task.dueAt && (
              <p className="text-xs text-slate-500 mt-1">
                ※ 一度設定した期限は変更のみ可能です（削除は非対応）
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-400"
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "更新中..." : "更新する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
