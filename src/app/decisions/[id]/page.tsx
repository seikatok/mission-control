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

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const decisionId = id as Id<"decisions">;

  const decision = useQuery(api.decisions.get, { id: decisionId });

  const [resolveAction, setResolveAction] = useState<"approve" | "reject" | "request_changes" | null>(null);

  if (decision === undefined) return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  if (decision === null) return <div className="p-6 text-sm text-slate-400">Decision not found</div>;

  const isPending = decision.status === "pending";

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={decision.title}
        action={
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400">
            ← Back
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

        {decision.description && (
          <p className="text-slate-300">{decision.description}</p>
        )}

        {/* Options */}
        {decision.options && decision.options.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">Options</h2>
            <div className="space-y-2">
              {decision.options.map((opt) => (
                <div
                  key={opt.key}
                  className={`rounded-lg border p-3 ${decision.recommendation === opt.key ? "border-blue-700 bg-blue-950/30" : "border-slate-800 bg-slate-900"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{opt.label}</span>
                    {decision.recommendation === opt.key && (
                      <span className="text-xs bg-blue-600 text-white rounded px-1.5 py-0.5">Recommended</span>
                    )}
                  </div>
                  {opt.details && <p className="mt-1 text-sm text-slate-400">{opt.details}</p>}
                  {opt.risk && <p className="mt-0.5 text-xs text-orange-400">Risk: {opt.risk}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Preview */}
        {decision.executionPreview && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">Execution Preview</h2>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-sm">
              {decision.executionPreview.commands && decision.executionPreview.commands.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Commands:</p>
                  {decision.executionPreview.commands.map((cmd, i) => (
                    <p key={i} className="text-green-400">$ {cmd}</p>
                  ))}
                </div>
              )}
              {decision.executionPreview.fileWrites && decision.executionPreview.fileWrites.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">File Writes:</p>
                  {decision.executionPreview.fileWrites.map((fw, i) => (
                    <p key={i} className="text-yellow-400">write: {fw.path} {fw.note && `(${fw.note})`}</p>
                  ))}
                </div>
              )}
              {decision.executionPreview.externalActions && decision.executionPreview.externalActions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">External Actions:</p>
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
            <p className="text-xs text-slate-500 mb-1">Resolution Note</p>
            <p className="text-sm text-slate-300">{decision.resolutionNote}</p>
            {decision.resolvedAt && <TimeAgo ms={decision.resolvedAt} className="text-xs text-slate-500 mt-1" />}
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setResolveAction("approve")}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button
              onClick={() => setResolveAction("reject")}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </Button>
            <Button
              onClick={() => setResolveAction("request_changes")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Request Changes
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
