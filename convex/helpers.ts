import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type ActivityType =
  | "goal_created"
  | "goal_updated"
  | "task_created"
  | "task_updated"
  | "task_moved"
  | "decision_created"
  | "decision_resolved"
  | "agent_created"
  | "agent_status_changed"
  | "run_created"
  | "run_status_changed"
  | "output_created"
  | "compliance_created"
  | "gateway_heartbeat"
  | "system_seed";

interface AppendActivityArgs {
  type: ActivityType;
  message?: string;
  goalId?: Id<"goals">;
  taskId?: Id<"tasks">;
  decisionId?: Id<"decisions">;
  runId?: Id<"runs">;
  outputId?: Id<"outputs">;
  agentId?: Id<"agents">;
  gatewayId?: Id<"gateways">;
}

export async function appendActivity(ctx: MutationCtx, args: AppendActivityArgs) {
  await ctx.db.insert("activityEvents", {
    type: args.type,
    message: args.message,
    goalId: args.goalId,
    taskId: args.taskId,
    decisionId: args.decisionId,
    runId: args.runId,
    outputId: args.outputId,
    agentId: args.agentId,
    gatewayId: args.gatewayId,
    data: undefined,
    createdAt: Date.now(),
  });
}

export function validateString(value: string, fieldName: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error(`${fieldName} cannot be empty`);
  if (trimmed.length > maxLength) throw new Error(`${fieldName} exceeds max length of ${maxLength}`);
  return trimmed;
}

export function validateOptionalString(value: string | undefined, fieldName: string, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new Error(`${fieldName} exceeds max length of ${maxLength}`);
  return trimmed || undefined;
}
