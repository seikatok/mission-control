import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, validateString } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    templateId: v.id("agentTemplates"),
    status: v.optional(v.union(
      v.literal("idle"), v.literal("running"), v.literal("waiting_decision"),
      v.literal("blocked"), v.literal("error"), v.literal("offline"), v.literal("paused"),
    )),
    gatewayId: v.optional(v.id("gateways")),
    avatar: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error(`AgentTemplate not found: ${args.templateId}`);

    if (args.gatewayId) {
      const gateway = await ctx.db.get(args.gatewayId);
      if (!gateway) throw new Error(`Gateway not found: ${args.gatewayId}`);
    }

    const name = validateString(args.name, "name", 200);

    if (args.tags && args.tags.length > 20) throw new Error("tags cannot exceed 20 items");

    const now = Date.now();
    const agentId = await ctx.db.insert("agents", {
      name,
      templateId: args.templateId,
      status: args.status ?? "idle",
      gatewayId: args.gatewayId,
      avatar: args.avatar,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "agent_created",
      agentId,
      message: `Agent created: ${name}`,
    });

    return agentId;
  },
});

export const setStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(
      v.literal("idle"), v.literal("running"), v.literal("waiting_decision"),
      v.literal("blocked"), v.literal("error"), v.literal("offline"), v.literal("paused"),
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error(`Agent not found: ${args.agentId}`);

    await ctx.db.patch(args.agentId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    await appendActivity(ctx, {
      type: "agent_status_changed",
      agentId: args.agentId,
      message: `Agent status changed to ${args.status}: ${agent.name}`,
    });

    return args.agentId;
  },
});
