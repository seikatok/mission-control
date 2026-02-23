"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDefaultUser } from "@/providers/default-user-provider";

interface ResolveDialogProps {
  decisionId: Id<"decisions">;
  action: "approve" | "reject" | "request_changes";
  open: boolean;
  onClose: () => void;
}

const ACTION_LABELS = {
  approve: "承認",
  reject: "却下",
  request_changes: "修正依頼",
};

const ACTION_TOAST: Record<string, string> = {
  approve: "承認しました",
  reject: "却下しました",
  request_changes: "修正を依頼しました",
};

const ACTION_STYLES = {
  approve: "bg-green-600 hover:bg-green-700",
  reject: "bg-red-600 hover:bg-red-700",
  request_changes: "bg-orange-600 hover:bg-orange-700",
};

export function ResolveDialog({ decisionId, action, open, onClose }: ResolveDialogProps) {
  const { defaultUserId } = useDefaultUser();
  const resolveDecision = useMutation(api.decisions.resolve);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResolve() {
    if (!defaultUserId) { toast.error("No default user found"); return; }
    setIsSubmitting(true);
    try {
      await resolveDecision({
        decisionId,
        action,
        resolvedByUserId: defaultUserId,
        note: note || undefined,
      });
      toast.success(ACTION_TOAST[action]);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve decision");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">{ACTION_LABELS[action]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-300">メモ（任意）</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="判断に関するメモを入力..."
              className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">キャンセル</Button>
          <Button
            data-testid="resolve-confirm-btn"
            onClick={handleResolve}
            disabled={isSubmitting}
            className={ACTION_STYLES[action]}
          >
            {isSubmitting ? "処理中..." : ACTION_LABELS[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
