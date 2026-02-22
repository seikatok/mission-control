import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {
    resolved: v.optional(v.boolean()),
    severity: v.optional(v.union(
      v.literal("info"), v.literal("warn"), v.literal("high"), v.literal("critical"),
    )),
    agentId: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const resolved = args.resolved ?? false;

    if (args.agentId) {
      const events = await ctx.db
        .query("complianceEvents")
        .withIndex("by_agent_createdAt", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(limit);
      return events.filter((e) => e.resolved === resolved);
    }

    const events = await ctx.db
      .query("complianceEvents")
      .withIndex("by_resolved_createdAt", (q) => q.eq("resolved", resolved))
      .order("desc")
      .take(limit);

    if (args.severity) return events.filter((e) => e.severity === args.severity);
    return events;
  },
});

export const create = mutation({
  args: {
    severity: v.union(v.literal("info"), v.literal("warn"), v.literal("high"), v.literal("critical")),
    message: v.string(),
    attemptedAction: v.optional(v.string()),
    policyRule: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
    gatewayId: v.optional(v.id("gateways")),
    runId: v.optional(v.id("runs")),
    taskId: v.optional(v.id("tasks")),
    goalId: v.optional(v.id("goals")),
  },
  handler: async (ctx, args) => {
    const message = validateString(args.message, "message", 1000);
    const attemptedAction = validateOptionalString(args.attemptedAction, "attemptedAction", 500);
    const policyRule = validateOptionalString(args.policyRule, "policyRule", 500);

    if (args.agentId) {
      const agent = await ctx.db.get(args.agentId);
      if (!agent) throw new Error(`Agent not found: ${args.agentId}`);
    }

    const eventId = await ctx.db.insert("complianceEvents", {
      severity: args.severity,
      message,
      goalId: args.goalId,
      taskId: args.taskId,
      runId: args.runId,
      agentId: args.agentId,
      gatewayId: args.gatewayId,
      attemptedAction,
      policyRule,
      resolved: false,
      createdAt: Date.now(),
    });

    await appendActivity(ctx, {
      type: "compliance_created",
      agentId: args.agentId,
      goalId: args.goalId,
      taskId: args.taskId,
      message: `Compliance event [${args.severity}]: ${message}`,
    });

    return eventId;
  },
});

export const resolve = mutation({
  args: {
    complianceEventId: v.id("complianceEvents"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.complianceEventId);
    if (!event) throw new Error(`ComplianceEvent not found: ${args.complianceEventId}`);
    if (event.resolved) throw new Error("ComplianceEvent is already resolved");

    const note = args.note ? args.note.trim().slice(0, 1000) : undefined;

    await ctx.db.patch(args.complianceEventId, {
      resolved: true,
      resolvedAt: Date.now(),
      resolvedNote: note,
    });

    return args.complianceEventId;
  },
});
