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

/**
 * 出力タイプ別フォーマットテンプレート。
 * モデル呼び出し時に LANGUAGE_POLICY の後に append する。
 *
 * 使い方: buildSystemPrompt(LANGUAGE_POLICY, OUTPUT_FORMAT.output)
 */
export const OUTPUT_FORMAT = {
  /** Output（成果物）生成時 */
  output:
    "【出力フォーマット】\n" +
    "## 結論\n（何が判明・完成したか 1〜3行）\n\n" +
    "## 根拠\n（データ・調査結果・実行ログの要点）\n\n" +
    "## 次アクション\n（推奨される次の一手）\n\n" +
    "## 添付\n（ファイル・URL・コードブロックがあれば列挙）",

  /** Decision（判断依頼）生成時 */
  decision:
    "【出力フォーマット】\n" +
    "## 判断事項\n（何を決める必要があるか）\n\n" +
    "## 選択肢\n（各選択肢とトレードオフ）\n\n" +
    "## 推奨\n（エージェントの推奨とその理由）\n\n" +
    "## 期限\n（いつまでに決める必要があるか）\n\n" +
    "## 影響範囲\n（変更が及ぼすシステム・ユーザーへの影響）",

  /** Task（タスク）生成時 */
  task:
    "【出力フォーマット】\n" +
    "## 目的\n（このタスクで達成すること）\n\n" +
    "## 成果物\n（完了の証拠となる具体的な成果物）\n\n" +
    "## 受け入れ条件\n（Done の定義）\n\n" +
    "## 次の一手\n（完了後に取るべき次のアクション）",
} as const;

/**
 * system prompt を組み立てるヘルパー。
 * モデル呼び出し箇所でこれを使うことで言語ポリシー＋形式テンプレが必ず乗る。
 *
 * @example
 *   const systemPrompt = buildSystemPrompt(OUTPUT_FORMAT.output, agentTemplate.description);
 */
export function buildSystemPrompt(
  format: (typeof OUTPUT_FORMAT)[keyof typeof OUTPUT_FORMAT],
  agentInstructions?: string
): string {
  const parts = [LANGUAGE_POLICY, format];
  if (agentInstructions) parts.push("\n【エージェント指示】\n" + agentInstructions);
  return parts.join("\n\n");
}

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

/**
 * Task description に構造化された理由メモを追記する。
 *
 * フォーマット:
 *   ---
 *   [<label> YYYY-MM-DD HH:MM]
 *   <reason>
 *
 * - existingDescription が空なら区切り線 `---` を省略
 * - reason が空（trim後0文字）なら追記しない（元の description をそのまま返す）
 * - refId 指定時、既に同一 refId のメモが存在すれば二重追記しない
 */
export function appendReasonNote(
  existingDescription: string | undefined,
  label: string,
  reason: string,
  options?: { refId?: string; now?: number }
): string | undefined {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return existingDescription;

  const now = options?.now ?? Date.now();
  const refId = options?.refId;

  // 重複防止: 同一 refId が既に description 内に含まれていれば追記しない
  if (refId && existingDescription?.includes(`(ref:${refId})`)) {
    return existingDescription;
  }

  const ts = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`;

  const refTag = refId ? ` (ref:${refId})` : "";
  const header = `[${label} ${stamp}]${refTag}`;

  if (!existingDescription) {
    return `${header}\n${trimmedReason}`;
  }
  return `${existingDescription}\n---\n${header}\n${trimmedReason}`;
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
