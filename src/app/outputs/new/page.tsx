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
import { OUTPUT_TYPE_LABELS } from "@/lib/constants";

interface Artifact {
  kind: string;
  ref: string;
  note: string;
}

export default function NewOutputPage() {
  const router = useRouter();
  const createOutput = useMutation(api.outputs.create);
  const goals = useQuery(api.goals.list, {});

  const [title, setTitle] = useState("");
  const [type, setType] = useState("other");
  const [goalId, setGoalId] = useState("_none");
  const [summary, setSummary] = useState("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addArtifact() {
    setArtifacts((a) => [...a, { kind: "link", ref: "", note: "" }]);
  }

  function updateArtifact(index: number, field: keyof Artifact, value: string) {
    setArtifacts((a) => a.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function removeArtifact(index: number) {
    setArtifacts((a) => a.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createOutput({
        title,
        type: type as "other",
        goalId: goalId !== "_none" ? goalId as Id<"goals"> : undefined,
        summary: summary || undefined,
        artifacts: artifacts.filter((a) => a.ref).map((a) => ({
          kind: a.kind,
          ref: a.ref,
          note: a.note || undefined,
        })),
      });
      toast.success("Output created");
      router.push("/outputs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create output");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="New Output" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 bg-slate-900 border-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OUTPUT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Goal</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— None —</SelectItem>
                  {goals?.map((g) => <SelectItem key={g._id} value={g._id}>{g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="mt-1 bg-slate-900 border-slate-700" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Artifacts</Label>
              <Button type="button" variant="outline" size="sm" onClick={addArtifact} className="border-slate-700 text-slate-300">
                + Add Artifact
              </Button>
            </div>
            {artifacts.map((a, i) => (
              <div key={i} className="mt-2 flex gap-2 items-start">
                <Input value={a.kind} onChange={(e) => updateArtifact(i, "kind", e.target.value)} placeholder="kind (link, doc...)" className="w-28 bg-slate-900 border-slate-700" />
                <Input value={a.ref} onChange={(e) => updateArtifact(i, "ref", e.target.value)} placeholder="URL or path" className="flex-1 bg-slate-900 border-slate-700" />
                <Input value={a.note} onChange={(e) => updateArtifact(i, "note", e.target.value)} placeholder="Note" className="w-32 bg-slate-900 border-slate-700" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeArtifact(i)} className="text-red-400">×</Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "Creating..." : "Create Output"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
