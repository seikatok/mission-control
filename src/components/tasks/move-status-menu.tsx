"use client";

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
import { TASK_STATUS_LABELS, KANBAN_COLUMNS } from "@/lib/constants";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

interface MoveStatusMenuProps {
  taskId: Id<"tasks">;
  currentStatus: string;
}

const ALL_STATUSES = [...KANBAN_COLUMNS, "canceled"] as const;

export function MoveStatusMenu({ taskId, currentStatus }: MoveStatusMenuProps) {
  const moveStatus = useMutation(api.tasks.moveStatus);

  async function handleMove(newStatus: typeof ALL_STATUSES[number]) {
    try {
      await moveStatus({ taskId, newStatus });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move task");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400 hover:text-slate-200 px-1">
          {TASK_STATUS_LABELS[currentStatus] ?? currentStatus}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700">
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={s === currentStatus}
            onClick={() => handleMove(s)}
            className="text-slate-200 focus:bg-slate-800 cursor-pointer"
          >
            {TASK_STATUS_LABELS[s] ?? s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
