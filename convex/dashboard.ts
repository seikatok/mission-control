import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ダッシュボード用集計クエリ。
 * UIでのcount/filter集計を排除し、Convexのリアクティブqueryで最新値を保証する。
 */
export const getDashboardSummary = query({
  args: {
    recentOutputsLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.recentOutputsLimit ?? 5, 20);

    // tasks: status別件数
    // NOTE: 全件 collect はスケール時のボトルネック。
    // Phase3 で materialized count（status 別カウンタテーブル）への移行を検討。
    const allTasks = await ctx.db.query("tasks").collect();
    const taskCounts = {
      todo: 0,
      in_progress: 0,
      blocked: 0,
      waiting_decision: 0,
      done: 0,
      canceled: 0,
    } as Record<string, number>;
    const now = Date.now();
    let overdueCount = 0;
    for (const t of allTasks) {
      taskCounts[t.status] = (taskCounts[t.status] ?? 0) + 1;
      if (t.dueAt !== undefined && t.dueAt < now && t.status !== "done" && t.status !== "canceled") {
        overdueCount++;
      }
    }

    // decisions: pending（by_status_createdAt で createdAt 昇順 = 古い順に取得）
    // Top5 の JS sort を不要にする
    const pendingDecisions = await ctx.db
      .query("decisions")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("asc")
      .collect();

    // agents: status別件数
    const allAgents = await ctx.db.query("agents").collect();
    const agentCounts: Record<string, number> = {};
    for (const a of allAgents) {
      agentCounts[a.status] = (agentCounts[a.status] ?? 0) + 1;
    }

    // gateways: online/offline件数
    const allGateways = await ctx.db.query("gateways").collect();
    const gatewayOnline = allGateways.filter((g) => g.isOnline).length;
    const gatewayOffline = allGateways.length - gatewayOnline;

    // outputs: 直近N件（IDと基本情報のみ）
    const recentOutputs = await ctx.db
      .query("outputs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);

    // compliance: 未解決件数（severity別）
    const unresolvedCompliance = await ctx.db
      .query("complianceEvents")
      .withIndex("by_resolved_createdAt", (q) => q.eq("resolved", false))
      .collect();
    const complianceCounts: Record<string, number> = {};
    for (const e of unresolvedCompliance) {
      complianceCounts[e.severity] = (complianceCounts[e.severity] ?? 0) + 1;
    }

    // --- Phase1 KPI 計算 ---

    // pendingDecisions Top5（既に createdAt 昇順 = 古い順で取得済み → sort 不要）
    const pendingTop5 = pendingDecisions.slice(0, 5).map((d) => ({
      _id: d._id,
      title: d.title,
      ageMs: now - d.createdAt,
      type: d.type,
      taskId: d.taskId,
    }));
    const pendingOldest = pendingDecisions[0];

    // waitingDecisionTasks / blockedTasks
    const waitingDecisionTasks = allTasks
      .filter((t) => t.status === "waiting_decision")
      .sort((a, b) => a.updatedAt - b.updatedAt);
    const blockedTasksList = allTasks
      .filter((t) => t.status === "blocked")
      .sort((a, b) => a.updatedAt - b.updatedAt);

    // overdueTasks Top5（超過が長い順）
    const overdueTasks = allTasks
      .filter(
        (t) =>
          t.dueAt !== undefined &&
          t.dueAt < now &&
          t.status !== "done" &&
          t.status !== "canceled"
      )
      .sort((a, b) => a.dueAt! - b.dueAt!); // 古い due が先頭 = 最大超過
    const overdueTop5 = overdueTasks.slice(0, 5).map((t) => ({
      _id: t._id,
      title: t.title,
      ageMs: now - t.dueAt!,
      dueAt: t.dueAt!,
      priority: t.priority,
      goalId: t.goalId,
    }));

    return {
      tasks: {
        byStatus: taskCounts,
        total: allTasks.length,
        overdue: overdueCount,
      },
      decisions: {
        pending: pendingDecisions.length,
      },
      agents: {
        byStatus: agentCounts,
        total: allAgents.length,
      },
      gateways: {
        total: allGateways.length,
        online: gatewayOnline,
        offline: gatewayOffline,
      },
      recentOutputs: recentOutputs.map((o) => ({
        _id: o._id,
        title: o.title,
        type: o.type,
        createdAt: o.createdAt,
      })),
      compliance: {
        unresolvedBySeverity: complianceCounts,
        unresolvedTotal: unresolvedCompliance.length,
      },
      kpi: {
        pendingDecisions: {
          count: pendingDecisions.length,
          oldestAgeMs: pendingOldest ? now - pendingOldest.createdAt : null,
          top5: pendingTop5,
        },
        waitingDecisionTasks: {
          count: waitingDecisionTasks.length,
          oldestAgeMs:
            waitingDecisionTasks.length > 0
              ? now - waitingDecisionTasks[0].updatedAt
              : null,
        },
        blockedTasks: {
          count: blockedTasksList.length,
          oldestAgeMs:
            blockedTasksList.length > 0
              ? now - blockedTasksList[0].updatedAt
              : null,
        },
        overdueTasks: {
          count: overdueTasks.length,
          oldestAgeMs: overdueTasks.length > 0 ? now - overdueTasks[0].dueAt! : null,
          top5: overdueTop5,
        },
      },
    };
  },
});
