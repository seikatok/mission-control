import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { appendActivity, appendReasonNote, validateString, validateOptionalString } from "./helpers";

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {
    goalId: v.optional(v.id("goals")),
    status: v.optional(v.union(
      v.literal("todo"), v.literal("in_progress"), v.literal("blocked"),
      v.literal("waiting_decision"), v.literal("done"), v.literal("canceled"),
    )),
    boardId: v.optional(v.id("boards")),
  },
  handler: async (ctx, args) => {
    if (args.boardId) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_board_createdAt", (q) => q.eq("boardId", args.boardId!))
        .order("desc")
        .collect();
      if (args.goalId) return tasks.filter((t) => t.goalId === args.goalId);
      if (args.status) return tasks.filter((t) => t.status === args.status);
      return tasks;
    }
    if (args.goalId && args.status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_goal_status", (q) => q.eq("goalId", args.goalId!).eq("status", args.status!))
        .collect();
    }
    if (args.goalId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_goal_updatedAt", (q) => q.eq("goalId", args.goalId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("tasks").withIndex("by_updatedAt").order("desc").collect();
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    goalId: v.optional(v.id("goals")),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    if (args.goalId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_goal_updatedAt", (q) => q.eq("goalId", args.goalId!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("tasks").withIndex("by_updatedAt").order("desc").take(limit);
  },
});

export const listUnassigned = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("tasks")
      .withIndex("by_board_createdAt", (q) => q.eq("boardId", null))
      .order("desc")
      .take(limit);
  },
});

export const listOverdue = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const now = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_dueAt")
      .order("asc")
      .collect();
    return tasks
      .filter((t) => t.dueAt !== undefined && t.dueAt < now && t.status !== "done" && t.status !== "canceled")
      .slice(0, limit);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    goalId: v.id("goals"),
    boardId: v.union(v.id("boards"), v.null()),
    status: v.union(
      v.literal("todo"), v.literal("in_progress"), v.literal("blocked"),
      v.literal("waiting_decision"), v.literal("done"), v.literal("canceled"),
    ),
    priority: v.union(v.literal("p1"), v.literal("p2"), v.literal("p3")),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    stage: v.optional(v.string()),
    assignee: v.optional(v.object({
      type: v.union(v.literal("human"), v.literal("agent")),
      userId: v.optional(v.id("users")),
      agentId: v.optional(v.id("agents")),
    })),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error(`Goal not found: ${args.goalId}`);

    if (args.boardId) {
      const board = await ctx.db.get(args.boardId);
      if (!board) throw new Error(`Board not found: ${args.boardId}`);
    }

    if (args.assignee) {
      const a = args.assignee;
      if (a.type === "human" && !a.userId) throw new Error("assignee.userId required for human type");
      if (a.type === "human" && a.agentId) throw new Error("assignee.agentId must not be set for human type");
      if (a.type === "agent" && !a.agentId) throw new Error("assignee.agentId required for agent type");
      if (a.type === "agent" && a.userId) throw new Error("assignee.userId must not be set for agent type");
    }

    const title = validateString(args.title, "title", 200);
    const description = validateOptionalString(args.description, "description", 2000);
    const stage = validateOptionalString(args.stage, "stage", 100);

    if (args.tags && args.tags.length > 20) throw new Error("tags cannot exceed 20 items");

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title,
      description,
      goalId: args.goalId,
      boardId: args.boardId,
      status: args.status,
      priority: args.priority,
      stage,
      dueAt: args.dueAt,
      assignee: args.assignee,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "task_created",
      goalId: args.goalId,
      taskId,
      message: `Task created: ${title}`,
    });

    return taskId;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    boardId: v.optional(v.union(v.id("boards"), v.null())),
    status: v.optional(v.union(
      v.literal("todo"), v.literal("in_progress"), v.literal("blocked"),
      v.literal("waiting_decision"), v.literal("done"), v.literal("canceled"),
    )),
    priority: v.optional(v.union(v.literal("p1"), v.literal("p2"), v.literal("p3"))),
    dueAt: v.optional(v.number()),
    stage: v.optional(v.string()),
    assignee: v.optional(v.object({
      type: v.union(v.literal("human"), v.literal("agent")),
      userId: v.optional(v.id("users")),
      agentId: v.optional(v.id("agents")),
    })),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error(`Task not found: ${args.id}`);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      if (!goal) throw new Error(`Goal not found: ${args.goalId}`);
    }
    if (args.boardId) {
      const board = await ctx.db.get(args.boardId);
      if (!board) throw new Error(`Board not found: ${args.boardId}`);
    }

    if (args.assignee) {
      const a = args.assignee;
      if (a.type === "human" && !a.userId) throw new Error("assignee.userId required for human type");
      if (a.type === "human" && a.agentId) throw new Error("assignee.agentId must not be set for human type");
      if (a.type === "agent" && !a.agentId) throw new Error("assignee.agentId required for agent type");
      if (a.type === "agent" && a.userId) throw new Error("assignee.userId must not be set for agent type");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = validateString(args.title, "title", 200);
    if (args.description !== undefined) patch.description = validateOptionalString(args.description, "description", 2000);
    if (args.stage !== undefined) patch.stage = validateOptionalString(args.stage, "stage", 100);
    if (args.goalId !== undefined) patch.goalId = args.goalId;
    if (args.boardId !== undefined) patch.boardId = args.boardId;
    if (args.status !== undefined) {
      patch.status = args.status;
    }
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.dueAt !== undefined) patch.dueAt = args.dueAt;
    if (args.assignee !== undefined) patch.assignee = args.assignee;
    if (args.tags !== undefined) {
      if (args.tags.length > 20) throw new Error("tags cannot exceed 20 items");
      patch.tags = args.tags;
    }

    await ctx.db.patch(args.id, patch);

    await appendActivity(ctx, {
      type: "task_updated",
      goalId: task.goalId,
      taskId: args.id,
      message: `Task updated: ${patch.title ?? task.title}`,
    });

    return args.id;
  },
});

export const moveStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    newStatus: v.union(
      v.literal("todo"), v.literal("in_progress"), v.literal("blocked"),
      v.literal("waiting_decision"), v.literal("done"), v.literal("canceled"),
    ),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error(`Task not found: ${args.taskId}`);
    if (!task.boardId) throw new Error("未割当タスクは列移動不可");

    const board = await ctx.db.get(task.boardId);
    if (!board) throw new Error(`Board not found: ${task.boardId}`);

    await ctx.db.patch(args.taskId, {
      status: args.newStatus,
      updatedAt: Date.now(),
    });

    await appendActivity(ctx, {
      type: "task_moved",
      goalId: task.goalId,
      taskId: args.taskId,
      message: `Task moved to ${args.newStatus}: ${task.title}`,
    });

    return args.taskId;
  },
});

/**
 * 状態遷移の不変条件を守る唯一のエントリポイント。
 *
 * 許可される遷移:
 *   todo             → in_progress | blocked | canceled
 *   in_progress      → todo | blocked | waiting_decision | done | canceled
 *   blocked          → todo | in_progress | canceled
 *   waiting_decision → in_progress | blocked | done | canceled
 *   done / canceled  → todo  (再オープンのみ許可)
 *
 * 副作用:
 *   → waiting_decision 遷移時: Decision レコード（decision_needed）を自動生成し
 *     task.latestDecisionId に紐付ける
 *   → blocked 遷移時: reason が指定されていれば task.description に追記する
 *
 * @returns { taskId, decisionId? }
 */
export const transitionTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    newStatus: v.union(
      v.literal("todo"), v.literal("in_progress"), v.literal("blocked"),
      v.literal("waiting_decision"), v.literal("done"), v.literal("canceled"),
    ),
    // blocked 遷移時に理由を記録（description に追記）
    blockedReason: v.optional(v.string()),
    // waiting_decision 遷移時の Decision タイトル（省略時は自動生成）
    decisionTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error(`Task not found: ${args.taskId}`);

    // --- 遷移可否チェック ---
    const ALLOWED: Record<string, string[]> = {
      todo:             ["in_progress", "blocked", "canceled"],
      in_progress:      ["todo", "blocked", "waiting_decision", "done", "canceled"],
      blocked:          ["todo", "in_progress", "canceled"],
      waiting_decision: ["in_progress", "blocked", "done", "canceled"],
      done:             ["todo"],
      canceled:         ["todo"],
    };
    const allowed = ALLOWED[task.status] ?? [];
    if (!allowed.includes(args.newStatus)) {
      throw new Error(
        `遷移不可: ${task.status} → ${args.newStatus}。` +
        `許可されている遷移: [${allowed.join(", ")}]`
      );
    }

    const now = Date.now();
    const patch: Record<string, unknown> = { status: args.newStatus, updatedAt: now };

    // --- blocked 副作用: reason を description に追記 ---
    if (args.newStatus === "blocked" && args.blockedReason) {
      const newDesc = appendReasonNote(
        task.description,
        "BLOCKED理由",
        args.blockedReason,
        { now },
      );
      if (newDesc !== task.description) {
        patch.description = newDesc;
      }
    }

    let decisionId: Id<"decisions"> | undefined;

    // --- waiting_decision 副作用: Decision を自動生成 ---
    if (args.newStatus === "waiting_decision") {
      const title =
        args.decisionTitle ??
        `判断が必要: ${task.title}`;

      decisionId = await ctx.db.insert("decisions", {
        type: "decision_needed",
        status: "pending",
        title,
        taskId: args.taskId,
        goalId: task.goalId,
        createdAt: now,
        updatedAt: now,
      });
      patch.latestDecisionId = decisionId;

      await appendActivity(ctx, {
        type: "decision_created",
        goalId: task.goalId,
        taskId: args.taskId,
        decisionId,
        message: `Decision created: ${title}`,
      });
    }

    await ctx.db.patch(args.taskId, patch);

    await appendActivity(ctx, {
      type: "task_updated",
      goalId: task.goalId,
      taskId: args.taskId,
      message: `Task status: ${task.status} → ${args.newStatus} (${task.title})`,
    });

    return { taskId: args.taskId, decisionId };
  },
});
