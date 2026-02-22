import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {
    goalId: v.optional(v.id("goals")),
    type: v.optional(v.union(
      v.literal("research"), v.literal("doc"), v.literal("code_diff"), v.literal("summary"),
      v.literal("linkset"), v.literal("image"), v.literal("video"), v.literal("architecture"),
      v.literal("decision"), v.literal("other"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    if (args.goalId) {
      const outputs = await ctx.db
        .query("outputs")
        .withIndex("by_goal_createdAt", (q) => q.eq("goalId", args.goalId))
        .order("desc")
        .take(limit);
      if (args.type) return outputs.filter((o) => o.type === args.type);
      return outputs;
    }
    if (args.type) {
      return await ctx.db
        .query("outputs")
        .withIndex("by_type_createdAt", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("outputs").withIndex("by_createdAt").order("desc").take(limit);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    type: v.union(
      v.literal("research"), v.literal("doc"), v.literal("code_diff"), v.literal("summary"),
      v.literal("linkset"), v.literal("image"), v.literal("video"), v.literal("architecture"),
      v.literal("decision"), v.literal("other"),
    ),
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    summary: v.optional(v.string()),
    artifacts: v.optional(v.array(v.object({
      kind: v.string(),
      ref: v.string(),
      note: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const title = validateString(args.title, "title", 200);
    const summary = validateOptionalString(args.summary, "summary", 2000);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      if (!goal) throw new Error(`Goal not found: ${args.goalId}`);
    }
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task) throw new Error(`Task not found: ${args.taskId}`);
    }
    if (args.artifacts && args.artifacts.length > 20) {
      throw new Error("artifacts cannot exceed 20 items");
    }

    const now = Date.now();
    const outputId = await ctx.db.insert("outputs", {
      title,
      type: args.type,
      goalId: args.goalId,
      taskId: args.taskId,
      summary,
      artifacts: args.artifacts,
      createdAt: now,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "output_created",
      goalId: args.goalId,
      taskId: args.taskId,
      outputId,
      message: `Output created: ${title}`,
    });

    return outputId;
  },
});
