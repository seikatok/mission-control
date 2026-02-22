"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { DECISION_STATUS_LABELS, DECISION_STATUS_COLORS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";

export default function DecisionsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "changes_requested" | "canceled">("pending");

  const decisions = useQuery(api.decisions.list, { status, limit: 50 });

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Decisions" description="Pending approvals and human decisions" />
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
          <p className="text-sm text-slate-500">Loading...</p>
        ) : decisions.length === 0 ? (
          <EmptyState title="No decisions found" description="All clear! No pending decisions." />
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => (
              <div
                key={d._id}
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
                    </div>
                    <p className="mt-1 font-medium text-slate-100">{d.title}</p>
                    {d.description && (
                      <p className="mt-0.5 text-sm text-slate-400 line-clamp-1">{d.description}</p>
                    )}
                  </div>
                  <TimeAgo ms={d.createdAt} className="text-xs text-slate-500 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
