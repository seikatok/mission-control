"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewGatewayPage() {
  const router = useRouter();
  const createGateway = useMutation(api.gateways.create);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<"local" | "remote">("local");
  const [endpoint, setEndpoint] = useState("");
  const [workspaceRoot, setWorkspaceRoot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createGateway({
        name,
        kind,
        endpoint: endpoint || undefined,
        workspaceRoot: workspaceRoot || undefined,
      });
      toast.success("Gateway created");
      router.push("/gateways");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="New Gateway" />
      <div className="flex-1 overflow-y-auto p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 bg-slate-900 border-slate-700" />
          </div>
          <div>
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "local" | "remote")}>
              <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "remote" && (
            <div>
              <Label>Endpoint URL</Label>
              <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="mt-1 bg-slate-900 border-slate-700" placeholder="https://..." />
            </div>
          )}
          <div>
            <Label>Workspace Root</Label>
            <Input value={workspaceRoot} onChange={(e) => setWorkspaceRoot(e.target.value)} className="mt-1 bg-slate-900 border-slate-700" placeholder="/Users/..." />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "Creating..." : "Create Gateway"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
