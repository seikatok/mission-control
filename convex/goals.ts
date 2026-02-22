import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {
    domain: v.optional(v.union(v.literal("work"), v.literal("personal"))),
    area: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    let goals = await ctx.db.query("goals").withIndex("by_updatedAt").order("desc").collect();
    if (args.domain) goals = goals.filter((g) => g.domain === args.domain);
    if (args.area) goals = goals.filter((g) => g.area === args.area);
    if (args.status) goals = goals.filter((g) => g.status === args.status);
    return goals;
  },
});

export const get = query({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    domain: v.union(v.literal("work"), v.literal("personal")),
    area: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived")),
    priority: v.union(v.literal("p1"), v.literal("p2"), v.literal("p3")),
    description: v.optional(v.string()),
    ownerUserId: v.optional(v.id("users")),
    timeframe: v.optional(v.object({
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
    })),
    successMetrics: v.optional(v.array(v.object({
      label: v.string(),
      target: v.optional(v.string()),
      current: v.optional(v.string()),
    }))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const title = validateString(args.title, "title", 200);
    const description = validateOptionalString(args.description, "description", 2000);
    const area = validateOptionalString(args.area, "area", 100);

    if (args.successMetrics && args.successMetrics.length > 10) {
      throw new Error("successMetrics cannot exceed 10 items");
    }
    if (args.tags && args.tags.length > 20) {
      throw new Error("tags cannot exceed 20 items");
    }

    const now = Date.now();
    const goalId = await ctx.db.insert("goals", {
      title,
      description,
      domain: args.domain,
      area,
      status: args.status,
      priority: args.priority,
      ownerUserId: args.ownerUserId,
      timeframe: args.timeframe,
      successMetrics: args.successMetrics,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    // デフォルト Board を自動生成
    await ctx.db.insert("boards", {
      name: `${title} Board`,
      goalId,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "goal_created",
      goalId,
      message: `Goal created: ${title}`,
    });

    return goalId;
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    title: v.optional(v.string()),
    domain: v.optional(v.union(v.literal("work"), v.literal("personal"))),
    area: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"))),
    priority: v.optional(v.union(v.literal("p1"), v.literal("p2"), v.literal("p3"))),
    description: v.optional(v.string()),
    ownerUserId: v.optional(v.id("users")),
    timeframe: v.optional(v.object({
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
    })),
    successMetrics: v.optional(v.array(v.object({
      label: v.string(),
      target: v.optional(v.string()),
      current: v.optional(v.string()),
    }))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error(`Goal not found: ${args.id}`);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = validateString(args.title, "title", 200);
    if (args.description !== undefined) patch.description = validateOptionalString(args.description, "description", 2000);
    if (args.area !== undefined) patch.area = validateOptionalString(args.area, "area", 100);
    if (args.domain !== undefined) patch.domain = args.domain;
    if (args.status !== undefined) patch.status = args.status;
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.ownerUserId !== undefined) patch.ownerUserId = args.ownerUserId;
    if (args.timeframe !== undefined) patch.timeframe = args.timeframe;
    if (args.successMetrics !== undefined) {
      if (args.successMetrics.length > 10) throw new Error("successMetrics cannot exceed 10 items");
      patch.successMetrics = args.successMetrics;
    }
    if (args.tags !== undefined) {
      if (args.tags.length > 20) throw new Error("tags cannot exceed 20 items");
      patch.tags = args.tags;
    }

    await ctx.db.patch(args.id, patch);

    await appendActivity(ctx, {
      type: "goal_updated",
      goalId: args.id,
      message: `Goal updated: ${patch.title ?? goal.title}`,
    });

    return args.id;
  },
});
