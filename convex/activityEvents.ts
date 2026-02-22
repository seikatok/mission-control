import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);

    if (args.goalId) {
      return await ctx.db
        .query("activityEvents")
        .withIndex("by_goal_createdAt", (q) => q.eq("goalId", args.goalId))
        .order("desc")
        .take(limit);
    }
    if (args.taskId) {
      return await ctx.db
        .query("activityEvents")
        .withIndex("by_task_createdAt", (q) => q.eq("taskId", args.taskId))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("activityEvents").withIndex("by_createdAt").order("desc").take(limit);
  },
});
