import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, validateOptionalString } from "./helpers";

export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("queued"), v.literal("running"), v.literal("waiting_decision"),
      v.literal("succeeded"), v.literal("failed"), v.literal("canceled"),
    )),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);

    if (args.agentId && args.status) {
      return await ctx.db
        .query("runs")
        .withIndex("by_agent_status", (q) => q.eq("agentId", args.agentId!).eq("status", args.status!))
        .order("desc")
        .take(limit);
    }
    if (args.taskId) {
      const runs = await ctx.db
        .query("runs")
        .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
        .order("desc")
        .take(limit);
      if (args.status) return runs.filter((r) => r.status === args.status);
      return runs;
    }
    if (args.status) {
      return await ctx.db
        .query("runs")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("runs").withIndex("by_createdAt").order("desc").take(limit);
  },
});

export const create = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    goalId: v.optional(v.id("goals")),
    gatewayId: v.optional(v.id("gateways")),
    objective: v.optional(v.string()),
    relatedDecisionId: v.optional(v.id("decisions")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error(`Agent not found: ${args.agentId}`);

    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task) throw new Error(`Task not found: ${args.taskId}`);
    }
    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      if (!goal) throw new Error(`Goal not found: ${args.goalId}`);
    }
    if (args.gatewayId) {
      const gateway = await ctx.db.get(args.gatewayId);
      if (!gateway) throw new Error(`Gateway not found: ${args.gatewayId}`);
    }

    const objective = validateOptionalString(args.objective, "objective", 2000);

    const now = Date.now();
    const runId = await ctx.db.insert("runs", {
      agentId: args.agentId,
      taskId: args.taskId,
      goalId: args.goalId,
      gatewayId: args.gatewayId,
      status: "queued",
      objective,
      relatedDecisionId: args.relatedDecisionId,
      createdAt: now,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "run_created",
      agentId: args.agentId,
      taskId: args.taskId,
      goalId: args.goalId,
      runId,
      message: `Run created for agent: ${agent.name}`,
    });

    return runId;
  },
});

export const setStatus = mutation({
  args: {
    runId: v.id("runs"),
    status: v.union(
      v.literal("queued"), v.literal("running"), v.literal("waiting_decision"),
      v.literal("succeeded"), v.literal("failed"), v.literal("canceled"),
    ),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error(`Run not found: ${args.runId}`);

    const summary = args.summary ? args.summary.trim().slice(0, 2000) : undefined;
    const error = args.error ? args.error.trim().slice(0, 2000) : undefined;

    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (summary !== undefined) patch.summary = summary;
    if (error !== undefined) patch.error = error;
    if (args.status === "running") patch.startedAt = Date.now();
    if (args.status === "succeeded" || args.status === "failed" || args.status === "canceled") {
      patch.finishedAt = Date.now();
    }

    await ctx.db.patch(args.runId, patch);

    await appendActivity(ctx, {
      type: "run_status_changed",
      agentId: run.agentId,
      taskId: run.taskId,
      goalId: run.goalId,
      runId: args.runId,
      message: `Run status changed to ${args.status}`,
    });

    return args.runId;
  },
});
