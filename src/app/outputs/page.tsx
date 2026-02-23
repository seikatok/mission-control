"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { OUTPUT_TYPE_LABELS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";
import { Id } from "../../../convex/_generated/dataModel";

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

export default function OutputsPage() {
  const router = useRouter();
  const [goalId, setGoalId] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const goals = useQuery(api.goals.list, {});
  const outputs = useQuery(api.outputs.list, {
    goalId: goalId !== "all" ? goalId as Id<"goals"> : undefined,
    type: type !== "all" ? type as "research" : undefined,
    limit: 50,
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Outputs"
        description="エージェントが生成した成果物"
        action={
          <Button onClick={() => router.push("/outputs/new")} className="bg-blue-600 hover:bg-blue-700">
            + New Output
          </Button>
        }
      />
      <div className="flex gap-3 px-6 py-3 border-b border-slate-800">
        <Select value={goalId} onValueChange={setGoalId}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="すべてのゴール" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのゴール</SelectItem>
            {goals?.map((g) => <SelectItem key={g._id} value={g._id}>{g.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="すべての種類" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての種類</SelectItem>
            {Object.entries(OUTPUT_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!outputs ? (
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
        ) : outputs.length === 0 ? (
          <EmptyState title="成果物はまだありません" action={<Button onClick={() => router.push("/outputs/new")} className="bg-blue-600 hover:bg-blue-700">New Output</Button>} />
        ) : (
          <div className="space-y-3">
            {outputs.map((out) => (
              <div key={out._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={OUTPUT_TYPE_LABELS[out.type] ?? out.type}
                        colorClass={OUTPUT_COLORS[out.type] ?? "bg-slate-600"}
                      />
                      <h3 className="font-medium text-slate-100">{out.title}</h3>
                    </div>
                    {out.summary && <p className="mt-1 text-sm text-slate-400 line-clamp-3">{out.summary}</p>}
                    {out.artifacts && out.artifacts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {out.artifacts.map((a, i) => (
                          <a
                            key={i}
                            href={a.ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 underline hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            [{a.kind}] {a.note ?? a.ref}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <TimeAgo ms={out.createdAt} className="text-xs text-slate-500 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
