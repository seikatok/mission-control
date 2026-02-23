import { mutation } from "./_generated/server";

export const setupE2E = mutation({
  args: {},
  handler: async (ctx) => {
    const E2E_GOAL_TITLE = "E2E テスト用ゴール";
    const now = Date.now();

    // 1. 既存 E2E ゴールの検索と全関連データ削除（cascade）
    const prevGoal = (await ctx.db.query("goals").collect())
      .find(g => g.title === E2E_GOAL_TITLE);

    if (prevGoal) {
      const gId = prevGoal._id;
      // 削除順序: activity → outputs → decisions → runs → tasks → boards → goal
      for (const ev of await ctx.db.query("activityEvents")
           .withIndex("by_goal_createdAt", q => q.eq("goalId", gId)).collect())
        await ctx.db.delete(ev._id);
      for (const out of await ctx.db.query("outputs")
           .withIndex("by_goal_createdAt", q => q.eq("goalId", gId)).collect())
        await ctx.db.delete(out._id);
      for (const dec of await ctx.db.query("decisions")
           .withIndex("by_goal_status", q => q.eq("goalId", gId)).collect())
        await ctx.db.delete(dec._id);
      for (const run of await ctx.db.query("runs")
           .withIndex("by_goal", q => q.eq("goalId", gId)).collect())
        await ctx.db.delete(run._id);
      for (const task of await ctx.db.query("tasks")
           .withIndex("by_goal_status", q => q.eq("goalId", gId)).collect())
        await ctx.db.delete(task._id);
      for (const b of await ctx.db.query("boards")
           .withIndex("by_goal_createdAt", q => q.eq("goalId", gId)).collect())
        await ctx.db.delete(b._id);
      await ctx.db.delete(gId);
    }

    // 2. ユーザー取得（既存を流用）
    const userId = (await ctx.db.query("users").first())?._id;
    if (!userId) throw new Error("ユーザーが存在しません。先に seed を実行してください。");

    // 3. E2E ゴール作成
    const goalId = await ctx.db.insert("goals", {
      title: E2E_GOAL_TITLE,
      description: "E2E テスト専用のゴール。自動生成・削除されます。",
      domain: "work", area: "QA", status: "active", priority: "p3",
      ownerUserId: userId, createdAt: now, updatedAt: now,
    });

    // 4. 期限超過タスク（E2E-1 用）
    const overdueTaskId = await ctx.db.insert("tasks", {
      title: "E2E: 期限超過タスク（自動生成）",
      goalId, boardId: null, status: "todo", priority: "p2",
      dueAt: now - 3 * 86_400_000,
      createdAt: now, updatedAt: now,
    });

    // 5. TaskCard テスト用タスク（E2E-2 用）
    const cardTaskId = await ctx.db.insert("tasks", {
      title: "E2E: カードテスト用タスク（自動生成）",
      goalId, boardId: null, status: "in_progress", priority: "p3",
      createdAt: now, updatedAt: now,
    });

    // 6. 判断ループテスト用タスク（E2E-3 用）
    const e2e3TaskId = await ctx.db.insert("tasks", {
      title: "E2E: 判断ループテスト用タスク（自動生成）",
      goalId, boardId: null, status: "in_progress", priority: "p1",
      createdAt: now, updatedAt: now,
    });

    return { goalId, overdueTaskId, cardTaskId, e2e3TaskId };
  }
});
