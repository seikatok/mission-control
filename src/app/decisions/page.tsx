"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StaleBadge } from "@/components/decisions/stale-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { DECISION_STATUS_LABELS, DECISION_STATUS_COLORS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";
import { useDefaultUser } from "@/providers/default-user-provider";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function DecisionsPage() {
  const router = useRouter();
  const { defaultUserId } = useDefaultUser();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "changes_requested" | "canceled">("pending");
  const [processingId, setProcessingId] = useState<Id<"decisions"> | null>(null);

  const decisions = useQuery(api.decisions.list, { status, limit: 50 });
  const resolve = useMutation(api.decisions.resolve);

  async function handleInlineResolve(
    e: React.MouseEvent,
    decisionId: Id<"decisions">,
    action: "approve" | "reject"
  ) {
    e.stopPropagation();
    if (!defaultUserId || processingId) return;

    setProcessingId(decisionId);
    try {
      await resolve({ decisionId, action, resolvedByUserId: defaultUserId });
      toast.success(action === "approve" ? "承認しました" : "却下しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Decisions" description="承認待ちの判断事項" />
      <div className="flex gap-3 px-6 py-3 border-b border-slate-800">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="changes_requested">Changes Requested</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!decisions ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : decisions.length === 0 ? (
          <EmptyState
            title="該当する判断事項はありません"
            description="現在、対応が必要な判断はありません"
          />
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => (
              <div
                key={d._id}
                data-testid="decision-item"
                className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800 transition-colors"
                onClick={() => router.push(`/decisions/${d._id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        label={DECISION_STATUS_LABELS[d.status] ?? d.status}
                        colorClass={DECISION_STATUS_COLORS[d.status] ?? "bg-slate-500"}
                      />
                      <span className="text-xs text-slate-500 capitalize">{d.type.replace(/_/g, " ")}</span>
                      {d.status === "pending" && (
                        <StaleBadge createdAt={d.createdAt} />
                      )}
                    </div>
                    <p className="mt-1 font-medium text-slate-100">{d.title}</p>
                    {d.description && (
                      <p className="mt-0.5 text-sm text-slate-400 line-clamp-1">{d.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.status === "pending" && (
                      <>
                        <button
                          data-testid="inline-approve-btn"
                          onClick={(e) => handleInlineResolve(e, d._id, "approve")}
                          disabled={!!processingId}
                          aria-label={`${d.title} を承認`}
                          title="承認"
                          className="text-green-500 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleInlineResolve(e, d._id, "reject")}
                          disabled={!!processingId}
                          aria-label={`${d.title} を却下`}
                          title="却下"
                          className="text-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <TimeAgo ms={d.createdAt} className="text-xs text-slate-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
