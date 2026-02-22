import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * 全エージェント共通の出力言語ポリシー。
 * モデル呼び出し実装時に system prompt の先頭に必ず prepend すること。
 * AgentTemplate の description にも埋め込んで意図を明示する。
 */
export const LANGUAGE_POLICY =
  "【言語ポリシー】あなたの出力は原則として日本語で行うこと。" +
  "固有名詞・コード・API名・識別子・コマンドは英語のままでよい。" +
  "UIラベルの単語（ステータス名など）は英語のままでよい。" +
  "出力の構成は「結論 → 根拠 → 次のアクション」の順で簡潔にまとめること。";

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
