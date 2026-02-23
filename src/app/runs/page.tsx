"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RUN_STATUS_LABELS, RUN_STATUS_COLORS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const RUN_STATUSES = ["queued", "running", "waiting_decision", "succeeded", "failed", "canceled"] as const;

export default function RunsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | typeof RUN_STATUSES[number]>("all");

  const runs = useQuery(api.runs.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 50,
  });
  const agents = useQuery(api.agents.list);
  const setStatus = useMutation(api.runs.setStatus);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Runs" description="エージェント実行ログ" />
      <div className="flex gap-3 px-6 py-3 border-b border-slate-800">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {RUN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{RUN_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!runs ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <EmptyState title="実行ログはありません" description="エージェントの実行履歴がここに表示されます" />
        ) : (
          <div className="space-y-2">
            {runs.map((run) => {
              const agent = agents?.find((a) => a._id === run.agentId);
              return (
                <div key={run._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          label={RUN_STATUS_LABELS[run.status] ?? run.status}
                          colorClass={RUN_STATUS_COLORS[run.status] ?? "bg-slate-500"}
                        />
                        <span className="text-sm text-slate-300">{agent?.name ?? "(deleted)"}</span>
                      </div>
                      {run.objective && (
                        <p className="mt-1 text-sm text-slate-400">{run.objective}</p>
                      )}
                      <div className="mt-1 flex gap-3 text-xs text-slate-600">
                        <TimeAgo ms={run.createdAt} />
                        {run.startedAt && <span>Started {formatDate(run.startedAt)}</span>}
                        {run.finishedAt && <span>· Finished {formatDate(run.finishedAt)}</span>}
                      </div>
                      {run.summary && (
                        <p className="mt-1 text-sm text-slate-400 bg-slate-800 rounded px-2 py-1 line-clamp-2">{run.summary}</p>
                      )}
                      {run.error && (
                        <p className="mt-1 text-xs text-red-400 bg-red-950/30 rounded px-2 py-1">{run.error}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 border border-slate-700 shrink-0">
                          Status <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-slate-700">
                        {RUN_STATUSES.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            disabled={s === run.status}
                            className="text-slate-200 focus:bg-slate-800 cursor-pointer"
                            onClick={() =>
                              setStatus({ runId: run._id as Id<"runs">, status: s })
                                .catch((err) => toast.error(String(err)))
                            }
                          >
                            {RUN_STATUS_LABELS[s]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
