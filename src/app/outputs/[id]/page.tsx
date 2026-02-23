"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { NotFound } from "@/components/shared/not-found";
import { TimeAgo } from "@/components/shared/time-ago";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { OUTPUT_TYPE_LABELS } from "@/lib/constants";

const OUTPUT_COLORS: Record<string, string> = {
  research: "bg-blue-600",
  doc: "bg-indigo-600",
  code_diff: "bg-green-600",
  summary: "bg-teal-600",
  linkset: "bg-cyan-600",
  image: "bg-purple-600",
  video: "bg-pink-600",
  architecture: "bg-orange-600",
  decision: "bg-yellow-600",
  other: "bg-slate-600",
};

export default function OutputDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const outputId = id as Id<"outputs">;

  const output = useQuery(api.outputs.get, { id: outputId });
  const linkedTask = useQuery(api.tasks.get, output?.taskId ? { id: output.taskId } : "skip");
  const linkedGoal = useQuery(api.goals.get, output?.goalId ? { id: output.goalId } : "skip");

  if (output === undefined) {
    return (
      <div className="p-6 space-y-4 max-w-3xl animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-20 w-full bg-slate-800 rounded" />
      </div>
    );
  }

  if (output === null) {
    return <NotFound title="成果物が見つかりません" backHref="/outputs" backLabel="成果物一覧に戻る" />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={output.title}
        action={
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400">
            ← 戻る
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
        {/* Basic Info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={OUTPUT_TYPE_LABELS[output.type] ?? output.type}
              colorClass={OUTPUT_COLORS[output.type] ?? "bg-slate-600"}
            />
            <TimeAgo ms={output.createdAt} className="text-xs text-slate-500" />
          </div>

          {/* 関連コンテキスト */}
          {(output.taskId || output.goalId) && (
            <div className="space-y-1">
              {output.goalId && (
                <p className="text-xs text-slate-400">
                  Goal:{" "}
                  {linkedGoal === undefined ? (
                    <span className="text-slate-500">読み込み中...</span>
                  ) : linkedGoal === null ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <button
                      onClick={() => router.push(`/goals/${output.goalId}`)}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {linkedGoal.title}
                    </button>
                  )}
                </p>
              )}
              {output.taskId && (
                <p className="text-xs text-slate-400">
                  Task:{" "}
                  {linkedTask === undefined ? (
                    <span className="text-slate-500">読み込み中...</span>
                  ) : linkedTask === null ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <button
                      onClick={() => router.push(`/tasks/${output.taskId}`)}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {linkedTask.title}
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {output.summary && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-2">サマリー</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{output.summary}</p>
          </div>
        )}

        {/* Artifacts */}
        {output.artifacts && output.artifacts.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-3">アーティファクト</h2>
            <div className="space-y-2">
              {output.artifacts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded border border-slate-800 bg-slate-950 px-3 py-2">
                  <span className="text-xs bg-slate-700 text-slate-300 rounded px-1.5 py-0.5 shrink-0">
                    {a.kind}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={a.ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 underline hover:text-blue-300 break-all"
                    >
                      {a.note ?? a.ref}
                    </a>
                    {a.note && (
                      <p className="text-xs text-slate-500 mt-0.5 break-all">{a.ref}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
