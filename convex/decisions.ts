import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, appendReasonNote, validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"), v.literal("approved"), v.literal("rejected"),
      v.literal("changes_requested"), v.literal("canceled"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const status = args.status ?? "pending";
    return await ctx.db
      .query("decisions")
      .withIndex("by_status_createdAt", (q) => q.eq("status", status))
      .order("desc")
      .take(limit);
  },
});

export const get = query({
  args: { id: v.id("decisions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("execution_approval"), v.literal("decision_needed"),
      v.literal("clarification"), v.literal("risk_exception"), v.literal("merge_review"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    runId: v.optional(v.id("runs")),
    agentId: v.optional(v.id("agents")),
    options: v.optional(v.array(v.object({
      key: v.string(),
      label: v.string(),
      details: v.optional(v.string()),
      risk: v.optional(v.string()),
    }))),
    recommendation: v.optional(v.string()),
    executionPreview: v.optional(v.object({
      commands: v.optional(v.array(v.string())),
      fileWrites: v.optional(v.array(v.object({
        path: v.string(),
        note: v.optional(v.string()),
      }))),
      externalActions: v.optional(v.array(v.object({
        kind: v.string(),
        note: v.optional(v.string()),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const title = validateString(args.title, "title", 200);
    const description = validateOptionalString(args.description, "description", 2000);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      if (!goal) throw new Error(`Goal not found: ${args.goalId}`);
    }
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task) throw new Error(`Task not found: ${args.taskId}`);
    }
    if (args.agentId) {
      const agent = await ctx.db.get(args.agentId);
      if (!agent) throw new Error(`Agent not found: ${args.agentId}`);
    }
    if (args.options && args.options.length > 10) {
      throw new Error("options cannot exceed 10 items");
    }

    const now = Date.now();
    const decisionId = await ctx.db.insert("decisions", {
      type: args.type,
      status: "pending",
      title,
      description,
      goalId: args.goalId,
      taskId: args.taskId,
      runId: args.runId,
      agentId: args.agentId,
      options: args.options,
      recommendation: args.recommendation,
      executionPreview: args.executionPreview,
      createdAt: now,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "decision_created",
      goalId: args.goalId,
      taskId: args.taskId,
      decisionId,
      agentId: args.agentId,
      message: `Decision created: ${title}`,
    });

    return decisionId;
  },
});

export const resolve = mutation({
  args: {
    decisionId: v.id("decisions"),
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("request_changes")),
    resolvedByUserId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) throw new Error(`Decision not found: ${args.decisionId}`);
    if (decision.status !== "pending") throw new Error("Decision is not pending");

    const user = await ctx.db.get(args.resolvedByUserId);
    if (!user) throw new Error(`User not found: ${args.resolvedByUserId}`);

    const statusMap = {
      approve: "approved" as const,
      reject: "rejected" as const,
      request_changes: "changes_requested" as const,
    };

    const note = args.note ? args.note.trim().slice(0, 1000) : undefined;

    await ctx.db.patch(args.decisionId, {
      status: statusMap[args.action],
      resolvedByUserId: args.resolvedByUserId,
      resolutionNote: note,
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ─── Task 副作用 ───
    if (decision.taskId && args.action !== "request_changes") {
      const task = await ctx.db.get(decision.taskId);
      if (task && task.status === "waiting_decision") {
        const now = Date.now();
        if (args.action === "approve") {
          await ctx.db.patch(decision.taskId, {
            status: "in_progress",
            updatedAt: now,
          });
          await appendActivity(ctx, {
            type: "task_updated",
            goalId: task.goalId,
            taskId: decision.taskId,
            decisionId: args.decisionId,
            message: `Task auto-transitioned: waiting_decision → in_progress (decision approved)`,
          });
        } else if (args.action === "reject") {
          const rejectionNote = note
            ? `判断却下: ${note}`
            : `判断却下: ${decision.title}`;
          const newDesc = appendReasonNote(
            task.description,
            "REJECTED",
            rejectionNote,
            { refId: args.decisionId, now },
          );
          await ctx.db.patch(decision.taskId, {
            status: "blocked",
            description: newDesc,
            updatedAt: now,
          });
          await appendActivity(ctx, {
            type: "task_updated",
            goalId: task.goalId,
            taskId: decision.taskId,
            decisionId: args.decisionId,
            message: `Task auto-transitioned: waiting_decision → blocked (decision rejected)`,
          });
        }
      }
    }
    // ─── END Task 副作用 ───

    await appendActivity(ctx, {
      type: "decision_resolved",
      decisionId: args.decisionId,
      goalId: decision.goalId,
      taskId: decision.taskId,
      message: `Decision ${args.action}d: ${decision.title}`,
    });

    return args.decisionId;
  },
});
