import { mutation } from "./_generated/server";
import { appendActivity, LANGUAGE_POLICY } from "./helpers";

export default mutation({
  args: {},
  handler: async (ctx) => {
    // 既存ユーザーチェック
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      console.log("Seed already run. Skipping.");
      return;
    }

    const now = Date.now();

    // --- User ---
    const userId = await ctx.db.insert("users", {
      displayName: "管理者",
      email: "admin@mission-control.local",
      createdAt: now,
      updatedAt: now,
    });

    // --- Skills ---
    // key は識別子なので英語のまま
    const skillWebSearch = await ctx.db.insert("skills", {
      key: "web_search",
      name: "Web 検索",
      description: "Web 上の情報を検索・収集する",
      category: "tool",
      risk: { canReadSensitive: false, canWrite: false, canExternalSend: true },
      createdAt: now,
      updatedAt: now,
    });

    const skillFileWrite = await ctx.db.insert("skills", {
      key: "file_write",
      name: "ファイル書き込み",
      description: "ワークスペース内にファイルを作成・編集する",
      category: "tool",
      risk: { canReadSensitive: false, canWrite: true, canExternalSend: false },
      createdAt: now,
      updatedAt: now,
    });

    const skillCodeExec = await ctx.db.insert("skills", {
      key: "code_exec",
      name: "コード実行",
      description: "ワークスペース内でコードを実行する",
      category: "tool",
      risk: { canReadSensitive: true, canWrite: true, canExternalSend: false },
      createdAt: now,
      updatedAt: now,
    });

    // --- AgentTemplates ---
    // description に LANGUAGE_POLICY を埋め込み、モデル呼び出し実装時の指針とする
    const researchTemplateId = await ctx.db.insert("agentTemplates", {
      name: "リサーチエージェント",
      description:
        "Web 検索でリサーチを行い、調査結果を日本語でまとめる。" + LANGUAGE_POLICY,
      policy: {
        allowExternalSend: false,
        allowFileWriteOutsideWorkspace: false,
        allowDangerousCommands: false,
        requireApprovalFor: ["external_send", "file_write"],
      },
      allowedSkillIds: [skillWebSearch],
      createdAt: now,
      updatedAt: now,
    });

    const devTemplateId = await ctx.db.insert("agentTemplates", {
      name: "開発エージェント",
      description:
        "コードを生成・実行し、実装結果を日本語でレポートする。" + LANGUAGE_POLICY,
      policy: {
        allowExternalSend: false,
        allowFileWriteOutsideWorkspace: false,
        allowDangerousCommands: false,
        requireApprovalFor: ["dangerous_commands", "external_send"],
      },
      allowedSkillIds: [skillFileWrite, skillCodeExec],
      createdAt: now,
      updatedAt: now,
    });

    // --- Gateway ---
    const gatewayId = await ctx.db.insert("gateways", {
      name: "ローカル開発環境",
      kind: "local",
      workspaceRoot: "/Users/seika/Dev",
      isOnline: true,
      lastHeartbeatAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // --- Agents ---
    const researchAgentId = await ctx.db.insert("agents", {
      name: "調査ボット",
      templateId: researchTemplateId,
      status: "idle",
      gatewayId,
      createdAt: now,
      updatedAt: now,
    });

    const devAgentId = await ctx.db.insert("agents", {
      name: "開発ボット",
      templateId: devTemplateId,
      status: "running",
      gatewayId,
      createdAt: now,
      updatedAt: now,
    });

    // --- Goals ---
    const goal1Id = await ctx.db.insert("goals", {
      title: "新規LPのCVR改善：ヒーロービジュアルと訴求文言の最適化",
      description: "現行LPのCVRが1.5%と低い。ヒーロービジュアルと訴求文言を見直し、A/Bテストで3%以上を目指す。",
      domain: "work",
      area: "マーケティング",
      status: "active",
      priority: "p1",
      ownerUserId: userId,
      timeframe: { startDate: "2026-02-01", endDate: "2026-03-31" },
      successMetrics: [
        { label: "CVR", target: "3%以上", current: "1.5%" },
        { label: "A/Bテスト完了", target: "1回", current: "0回" },
      ],
      tags: ["lp", "cvr", "marketing"],
      createdAt: now,
      updatedAt: now,
    });

    const goal1BoardId = await ctx.db.insert("boards", {
      name: "CVR改善 タスクボード",
      goalId: goal1Id,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const goal2Id = await ctx.db.insert("goals", {
      title: "エージェント監視基盤の強化",
      description: "エージェントの実行ログと異常検知を改善し、オペレーターが迅速に状況を把握できるようにする。",
      domain: "work",
      area: "エンジニアリング",
      status: "active",
      priority: "p2",
      ownerUserId: userId,
      tags: ["observability", "agent"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boards", {
      name: "監視基盤強化 タスクボード",
      goalId: goal2Id,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const goal3Id = await ctx.db.insert("goals", {
      title: "Convex の習得と実践",
      description: "Convex のリアクティブDBとミューテーション設計を理解し、Mission Control の開発に活かす。",
      domain: "personal",
      area: "学習",
      status: "active",
      priority: "p2",
      ownerUserId: userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boards", {
      name: "Convex 習得 タスクボード",
      goalId: goal3Id,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // --- Tasks ---
    const task1Id = await ctx.db.insert("tasks", {
      title: "現状分析：主要導線のクリック率と離脱ポイントの確認",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "done",
      priority: "p1",
      assignee: { type: "agent", agentId: devAgentId },
      createdAt: now,
      updatedAt: now,
    });

    const task2Id = await ctx.db.insert("tasks", {
      title: "仮説出し：CVR改善案を3つ作りスコアリングする",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "in_progress",
      priority: "p1",
      assignee: { type: "agent", agentId: devAgentId },
      createdAt: now,
      updatedAt: now,
    });

    const task3Id = await ctx.db.insert("tasks", {
      title: "検証：A/Bテストの設計と実装",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "todo",
      priority: "p2",
      dueAt: now + 7 * 24 * 60 * 60 * 1000, // 7日後
      createdAt: now,
      updatedAt: now,
    });

    const task4Id = await ctx.db.insert("tasks", {
      title: "競合AIエージェントツールの機能・価格・訴求ポイントの調査",
      goalId: goal2Id,
      boardId: null,
      status: "todo",
      priority: "p3",
      assignee: { type: "agent", agentId: researchAgentId },
      createdAt: now,
      updatedAt: now,
    });

    // 期限切れタスク（ダッシュボードのデモ用）
    const overdueTaskId = await ctx.db.insert("tasks", {
      title: "デプロイ手順書の更新（本番環境対応）",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "todo",
      priority: "p2",
      dueAt: now - 3 * 24 * 60 * 60 * 1000, // 3日前（期限切れ）
      createdAt: now,
      updatedAt: now,
    });

    // --- Runs ---
    const runId = await ctx.db.insert("runs", {
      agentId: devAgentId,
      taskId: task2Id,
      goalId: goal1Id,
      gatewayId,
      status: "running",
      objective: "既存LPの導線を分析し、CVRが低い箇所を特定する。改善仮説を3案作成してスコアリングまで行う。",
      startedAt: now - 10 * 60 * 1000, // 10分前に開始
      createdAt: now,
      updatedAt: now,
    });

    const run2Id = await ctx.db.insert("runs", {
      agentId: researchAgentId,
      taskId: task4Id,
      goalId: goal2Id,
      status: "succeeded",
      objective: "上位5件のAIエージェントツールの機能・価格・訴求ポイントを調査し、日本語でまとめる。",
      startedAt: now - 30 * 60 * 1000,
      finishedAt: now - 5 * 60 * 1000,
      summary: "主要競合5社の調査完了。各社の差別化ポイントと価格帯を比較表にまとめた。Mission Control の強みは承認ファーストの設計にある。",
      createdAt: now - 30 * 60 * 1000,
      updatedAt: now - 5 * 60 * 1000,
    });

    // --- Decisions ---
    const decisionId = await ctx.db.insert("decisions", {
      type: "execution_approval",
      status: "pending",
      title: "A/Bテスト案Aでの実施承認：ヒーロービジュアル変更の適用",
      description: "エージェントが案A（ヒーロービジュアル変更）でA/Bテストを実施しようとしています。承認してよいか確認してください。",
      goalId: goal1Id,
      taskId: task2Id,
      agentId: devAgentId,
      options: [
        { key: "approve_a", label: "案Aで進める", details: "ヒーロービジュアルを差し替えてA/Bテストを開始する", risk: "低" },
        { key: "delay", label: "1週間後に再検討", details: "追加データ収集後に改めて判断する", risk: "なし" },
      ],
      recommendation: "approve_a",
      executionPreview: {
        commands: ["pnpm build", "pnpm deploy --env staging"],
        fileWrites: [{ path: "public/hero.jpg", note: "ヒーロー画像を差し替え" }],
        externalActions: [{ kind: "http_post", note: "A/Bテスト開始 webhook に通知" }],
      },
      createdAt: now,
      updatedAt: now,
    });

    const decision2Id = await ctx.db.insert("decisions", {
      type: "clarification",
      status: "pending",
      title: "データベースのリージョン選択：東京 or バージニア",
      description: "新サービスのDBリージョンについて人間の判断が必要です。どちらを優先しますか？",
      goalId: goal2Id,
      agentId: researchAgentId,
      options: [
        { key: "ap_northeast_1", label: "東京（ap-northeast-1）", risk: "国内ユーザー低レイテンシ・GDPR非対象" },
        { key: "us_east_1", label: "バージニア（us-east-1）", risk: "グローバル展開に有利・コスト低" },
      ],
      createdAt: now - 60 * 60 * 1000,
      updatedAt: now - 60 * 60 * 1000,
    });

    // --- Outputs ---
    await ctx.db.insert("outputs", {
      title: "競合調査レポート：上位5社の訴求パターンと価格帯まとめ",
      type: "research",
      goalId: goal2Id,
      taskId: task4Id,
      summary: "主要競合5社を調査。各社は「自動化の速さ」を訴求しているが、承認フローの透明性を前面に出している製品はなかった。Mission Control の差別化ポイントとして有効。",
      artifacts: [
        { kind: "doc", ref: "https://notion.so/competitor-analysis", note: "Notion 詳細レポート" },
      ],
      createdAt: now - 5 * 60 * 1000,
      updatedAt: now - 5 * 60 * 1000,
    });

    await ctx.db.insert("outputs", {
      title: "スキーマ設計書 v1：15テーブル構成とインデックス設計",
      type: "architecture",
      goalId: goal1Id,
      taskId: task1Id,
      summary: "Mission Control MVP 向けの 15テーブル Convex スキーマを設計。全クエリに対応するインデックスを網羅し、ページング・フィルタ・ソートに対応。",
      createdAt: now - 60 * 60 * 1000,
      updatedAt: now - 60 * 60 * 1000,
    });

    // --- ComplianceEvents ---
    await ctx.db.insert("complianceEvents", {
      severity: "warn",
      message: "個人情報を含む可能性のあるログが出力されました。内容を確認してください。",
      agentId: devAgentId,
      gatewayId,
      attemptedAction: "file_write: /etc/hosts",
      policyRule: "allowFileWriteOutsideWorkspace = false",
      resolved: false,
      createdAt: now - 2 * 60 * 60 * 1000,
    });

    await ctx.db.insert("complianceEvents", {
      severity: "info",
      message: "外部HTTP通信のリクエストを検知しました。マスキング処理を適用して対応済みです。",
      agentId: researchAgentId,
      attemptedAction: "http_get: https://example.com",
      policyRule: "requireApprovalFor: external_send",
      resolved: true,
      resolvedAt: now - 30 * 60 * 1000,
      resolvedNote: "調査目的のアクセスであることを確認。承認済み。",
      createdAt: now - 3 * 60 * 60 * 1000,
    });

    await appendActivity(ctx, {
      type: "system_seed",
      message: "シードデータを初期化しました",
    });

    console.log("Seed completed successfully.");
  },
});
