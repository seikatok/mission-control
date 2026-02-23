"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { OUTPUT_TYPE_LABELS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

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

function OutputsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goalIdFromUrl = searchParams.get("goalId") ?? "all";
  const typeFromUrl = searchParams.get("type") ?? "all";
  const taskIdFromUrl = searchParams.get("taskId") ?? "";

  const [searchQuery, setSearchQuery] = useState("");

  const goals = useQuery(api.goals.list, {});
  const taskForFilter = useQuery(
    api.tasks.get,
    taskIdFromUrl ? { id: taskIdFromUrl as Id<"tasks"> } : "skip"
  );
  const outputs = useQuery(api.outputs.list, {
    goalId: goalIdFromUrl !== "all" ? goalIdFromUrl as Id<"goals"> : undefined,
    type: typeFromUrl !== "all" ? typeFromUrl as "research" : undefined,
    taskId: taskIdFromUrl ? taskIdFromUrl as Id<"tasks"> : undefined,
    limit: 50,
  });

  const filteredOutputs = useMemo(() => {
    if (!outputs) return undefined;
    if (!searchQuery) return outputs;
    const q = searchQuery.toLowerCase();
    return outputs.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.summary?.toLowerCase().includes(q) ?? false)
    );
  }, [outputs, searchQuery]);

  function setGoalFilter(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "all") params.delete("goalId"); else params.set("goalId", v);
    router.replace(`/outputs?${params.toString()}`);
  }

  function setTypeFilter(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "all") params.delete("type"); else params.set("type", v);
    router.replace(`/outputs?${params.toString()}`);
  }

  function clearTaskFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("taskId");
    router.replace(`/outputs?${params.toString()}`);
  }

  return (
    <>
      <div className="flex gap-3 px-6 py-3 border-b border-slate-800 flex-wrap items-center">
        {taskIdFromUrl && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">
            タスク: {taskForFilter?.title ?? taskIdFromUrl}
            <button onClick={clearTaskFilter} className="ml-1 text-slate-500 hover:text-slate-200">×</button>
          </div>
        )}
        <Select value={goalIdFromUrl} onValueChange={setGoalFilter}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-sm">
            <SelectValue placeholder="すべてのゴール" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのゴール</SelectItem>
            {goals?.map((g) => <SelectItem key={g._id} value={g._id}>{g.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFromUrl} onValueChange={setTypeFilter}>
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
        <Input
          placeholder="タイトル・概要で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-48 h-8 text-sm bg-slate-900 border-slate-700"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!filteredOutputs ? (
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
        ) : filteredOutputs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12">
            <p className="text-sm text-slate-400">成果物はまだありません</p>
            <Link href="/outputs/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">成果物を登録</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOutputs.map((out) => (
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
    </>
  );
}

export default function OutputsPage() {
  const router = useRouter();
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
      <Suspense fallback={<div className="h-8 w-full animate-pulse bg-slate-800 rounded mx-6 my-3" />}>
        <OutputsContent />
      </Suspense>
    </div>
  );
}
