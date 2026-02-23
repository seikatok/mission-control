"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BlockedReasonDialogProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function BlockedReasonDialog({
  open,
  onConfirm,
  onCancel,
}: BlockedReasonDialogProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason.trim());
    setReason("");
  }

  function handleCancel() {
    setReason("");
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            ブロック理由
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="理由を入力（任意）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="bg-slate-800 border-slate-700 text-slate-100"
          rows={3}
        />
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-slate-400"
          >
            キャンセル
          </Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
            ブロックに変更
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
