"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ResolveDialog } from "@/components/decisions/resolve-dialog";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { DECISION_STATUS_LABELS, DECISION_STATUS_COLORS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";
import { NotFound } from "@/components/shared/not-found";

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const decisionId = id as Id<"decisions">;

  const decision = useQuery(api.decisions.get, { id: decisionId });
  const linkedTask = useQuery(api.tasks.get, decision?.taskId ? { id: decision.taskId } : "skip");
  const linkedGoal = useQuery(api.goals.get, decision?.goalId ? { id: decision.goalId } : "skip");

  const [resolveAction, setResolveAction] = useState<"approve" | "reject" | "request_changes" | null>(null);

  if (decision === undefined) return (
    <div className="p-6 space-y-4 max-w-3xl animate-pulse">
      <div className="h-6 w-48 bg-slate-800 rounded" />
      <div className="h-4 w-32 bg-slate-800 rounded" />
      <div className="h-20 w-full bg-slate-800 rounded" />
    </div>
  );
  if (decision === null) return <NotFound title="判断事項が見つかりません" backHref="/decisions" backLabel="判断一覧に戻る" />;

  const isPending = decision.status === "pending";

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={decision.title}
        action={
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400">
            ← 戻る
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge
            label={DECISION_STATUS_LABELS[decision.status]}
            colorClass={DECISION_STATUS_COLORS[decision.status] ?? "bg-slate-500"}
          />
          <span className="text-sm text-slate-400 capitalize">{decision.type.replace(/_/g, " ")}</span>
          <TimeAgo ms={decision.createdAt} className="text-xs text-slate-500" />
        </div>

        {(decision.taskId || decision.goalId) && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1">
            {decision.goalId && (
              <p className="text-xs text-slate-400">
                Goal:{" "}
                {linkedGoal === undefined ? (
                  <span className="text-slate-500">読み込み中...</span>
                ) : linkedGoal === null ? (
                  <span className="text-slate-500">—</span>
                ) : (
                  <button
                    onClick={() => router.push(`/goals/${decision.goalId}`)}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {linkedGoal.title}
                  </button>
                )}
              </p>
            )}
            {decision.taskId && (
              <p className="text-xs text-slate-400">
                Task:{" "}
                {linkedTask === undefined ? (
                  <span className="text-slate-500">読み込み中...</span>
                ) : linkedTask === null ? (
                  <span className="text-slate-500">—</span>
                ) : (
                  <button
                    onClick={() => router.push(`/tasks/${decision.taskId}`)}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {linkedTask.title}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        {decision.description && (
          <p className="text-slate-300">{decision.description}</p>
        )}

        {/* Options */}
        {decision.options && decision.options.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">選択肢</h2>
            <div className="space-y-2">
              {decision.options.map((opt) => (
                <div
                  key={opt.key}
                  className={`rounded-lg border p-3 ${decision.recommendation === opt.key ? "border-blue-700 bg-blue-950/30" : "border-slate-800 bg-slate-900"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{opt.label}</span>
                    {decision.recommendation === opt.key && (
                      <span className="text-xs bg-blue-600 text-white rounded px-1.5 py-0.5">推奨</span>
                    )}
                  </div>
                  {opt.details && <p className="mt-1 text-sm text-slate-400">{opt.details}</p>}
                  {opt.risk && <p className="mt-0.5 text-xs text-orange-400">リスク: {opt.risk}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Preview */}
        {decision.executionPreview && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">実行プレビュー</h2>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-sm">
              {decision.executionPreview.commands && decision.executionPreview.commands.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">コマンド:</p>
                  {decision.executionPreview.commands.map((cmd, i) => (
                    <p key={i} className="text-green-400">$ {cmd}</p>
                  ))}
                </div>
              )}
              {decision.executionPreview.fileWrites && decision.executionPreview.fileWrites.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">ファイル書き込み:</p>
                  {decision.executionPreview.fileWrites.map((fw, i) => (
                    <p key={i} className="text-yellow-400">write: {fw.path} {fw.note && `(${fw.note})`}</p>
                  ))}
                </div>
              )}
              {decision.executionPreview.externalActions && decision.executionPreview.externalActions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">外部アクション:</p>
                  {decision.executionPreview.externalActions.map((ea, i) => (
                    <p key={i} className="text-orange-400">{ea.kind} {ea.note && `- ${ea.note}`}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resolution Note */}
        {decision.resolutionNote && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500 mb-1">承認メモ</p>
            <p className="text-sm text-slate-300">{decision.resolutionNote}</p>
            {decision.resolvedAt && <TimeAgo ms={decision.resolvedAt} className="text-xs text-slate-500 mt-1" />}
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-3 pt-2">
            <Button
              data-testid="decision-action-approve"
              onClick={() => setResolveAction("approve")}
              className="bg-green-600 hover:bg-green-700"
            >
              承認
            </Button>
            <Button
              onClick={() => setResolveAction("reject")}
              className="bg-red-600 hover:bg-red-700"
            >
              却下
            </Button>
            <Button
              onClick={() => setResolveAction("request_changes")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              修正依頼
            </Button>
          </div>
        )}
      </div>

      {resolveAction && (
        <ResolveDialog
          decisionId={decisionId}
          action={resolveAction}
          open={true}
          onClose={() => { setResolveAction(null); router.push("/decisions"); }}
        />
      )}
    </div>
  );
}
