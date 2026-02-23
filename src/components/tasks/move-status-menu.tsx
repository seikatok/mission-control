"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { BlockedReasonDialog } from "./blocked-reason-dialog";

interface MoveStatusMenuProps {
  taskId: Id<"tasks">;
  currentStatus: string;
}

const ALLOWED: Record<string, string[]> = {
  todo: ["in_progress", "blocked", "canceled"],
  in_progress: ["todo", "blocked", "waiting_decision", "done", "canceled"],
  blocked: ["todo", "in_progress", "canceled"],
  waiting_decision: ["in_progress", "blocked", "done", "canceled"],
  done: ["todo"],
  canceled: ["todo"],
};

export function MoveStatusMenu({ taskId, currentStatus }: MoveStatusMenuProps) {
  const transitionStatus = useMutation(api.tasks.transitionTaskStatus);
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);

  const allowedStatuses = ALLOWED[currentStatus] ?? [];

  async function handleMove(newStatus: string, blockedReason?: string) {
    try {
      await transitionStatus({
        taskId,
        newStatus: newStatus as "todo" | "in_progress" | "blocked" | "waiting_decision" | "done" | "canceled",
        blockedReason: blockedReason || undefined,
      });
      if (newStatus === "waiting_decision") {
        toast.success("判断リクエストを自動作成しました");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ステータス変更に失敗しました");
    }
  }

  function handleMenuSelect(newStatus: string) {
    if (newStatus === "blocked") {
      setBlockedDialogOpen(true);
    } else {
      handleMove(newStatus);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-testid="move-status-trigger" variant="ghost" size="sm" className="h-6 text-xs text-slate-400 hover:text-slate-200 px-1">
            {TASK_STATUS_LABELS[currentStatus] ?? currentStatus}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700">
          {allowedStatuses.map((s) => (
            <DropdownMenuItem
              key={s}
              data-testid={`status-option-${s}`}
              onClick={() => handleMenuSelect(s)}
              className="text-slate-200 focus:bg-slate-800 cursor-pointer"
            >
              {TASK_STATUS_LABELS[s] ?? s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <BlockedReasonDialog
        open={blockedDialogOpen}
        onConfirm={(reason) => {
          setBlockedDialogOpen(false);
          handleMove("blocked", reason || undefined);
        }}
        onCancel={() => setBlockedDialogOpen(false)}
      />
    </>
  );
}
