"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { COMPLIANCE_SEVERITY_COLORS, COMPLIANCE_SEVERITY_LABELS } from "@/lib/constants";
import { TimeAgo } from "@/components/shared/time-ago";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDate } from "@/lib/utils";

export default function CompliancePage() {
  const [showResolved, setShowResolved] = useState<"unresolved" | "all" | "resolved">("unresolved");
  const [severity, setSeverity] = useState<"all" | "info" | "warn" | "high" | "critical">("all");
  const [resolveTarget, setResolveTarget] = useState<Id<"complianceEvents"> | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const resolved =
    showResolved === "unresolved" ? false :
    showResolved === "resolved" ? true :
    undefined;

  const events = useQuery(api.complianceEvents.list, {
    resolved,
    severity: severity !== "all" ? severity : undefined,
    limit: 50,
  });

  const resolveEvent = useMutation(api.complianceEvents.resolve);

  async function handleResolve() {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await resolveEvent({ complianceEventId: resolveTarget, note: resolveNote || undefined });
      toast.success("Event resolved");
      setResolveTarget(null);
      setResolveNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setResolving(false);
    }
  }

  // Sort by severity order for UI
  const severityOrder = { critical: 0, high: 1, warn: 2, info: 3 };
  const sortedEvents = events
    ? [...events].sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))
    : events;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Compliance" description="Policy violations and audit log" />
      <div className="flex gap-3 px-6 py-3 border-b border-slate-800">
        <Select value={showResolved} onValueChange={(v) => setShowResolved(v as typeof showResolved)}>
          <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
          <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="warn">Warn</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {!sortedEvents ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : sortedEvents.length === 0 ? (
          <EmptyState title="No events found" description="No compliance events match the current filter." />
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((ev) => (
              <div key={ev._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start gap-3">
                  <StatusBadge
                    label={COMPLIANCE_SEVERITY_LABELS[ev.severity]}
                    colorClass={COMPLIANCE_SEVERITY_COLORS[ev.severity] ?? "bg-slate-500"}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{ev.message}</p>
                    {ev.attemptedAction && (
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">Action: {ev.attemptedAction}</p>
                    )}
                    {ev.policyRule && (
                      <p className="text-xs text-slate-500 font-mono">Rule: {ev.policyRule}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                      <TimeAgo ms={ev.createdAt} />
                      {ev.resolved && ev.resolvedAt && (
                        <span className="text-green-600">Resolved {formatDate(ev.resolvedAt)}</span>
                      )}
                      {ev.resolvedNote && (
                        <span className="text-slate-500">Note: {ev.resolvedNote}</span>
                      )}
                    </div>
                  </div>
                  {!ev.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 text-xs shrink-0"
                      onClick={() => setResolveTarget(ev._id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!resolveTarget} onOpenChange={(o) => { if (!o) { setResolveTarget(null); setResolveNote(""); } }}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-slate-100">Resolve Event</DialogTitle></DialogHeader>
          <div>
            <Label className="text-slate-300">Note (optional)</Label>
            <Textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} rows={2} className="mt-1 bg-slate-800 border-slate-700" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setResolveTarget(null); setResolveNote(""); }} className="text-slate-400">Cancel</Button>
            <Button onClick={handleResolve} disabled={resolving} className="bg-green-600 hover:bg-green-700">
              {resolving ? "Resolving..." : "Mark Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
