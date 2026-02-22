import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity, validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gateways").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal("local"), v.literal("remote")),
    endpoint: v.optional(v.string()),
    workspaceRoot: v.optional(v.string()),
    policySummary: v.optional(v.object({
      allowedCommands: v.array(v.string()),
      allowedPathPrefixes: v.array(v.string()),
      networkAllowlist: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const name = validateString(args.name, "name", 200);
    const endpoint = validateOptionalString(args.endpoint, "endpoint", 500);
    const workspaceRoot = validateOptionalString(args.workspaceRoot, "workspaceRoot", 500);

    const now = Date.now();
    return await ctx.db.insert("gateways", {
      name,
      kind: args.kind,
      endpoint,
      workspaceRoot,
      policySummary: args.policySummary,
      isOnline: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const heartbeat = mutation({
  args: { gatewayId: v.id("gateways") },
  handler: async (ctx, args) => {
    const gateway = await ctx.db.get(args.gatewayId);
    if (!gateway) throw new Error(`Gateway not found: ${args.gatewayId}`);

    const now = Date.now();
    await ctx.db.patch(args.gatewayId, {
      lastHeartbeatAt: now,
      isOnline: true,
      updatedAt: now,
    });

    await appendActivity(ctx, {
      type: "gateway_heartbeat",
      gatewayId: args.gatewayId,
      message: `Gateway heartbeat: ${gateway.name}`,
    });

    return args.gatewayId;
  },
});

export const setOnline = mutation({
  args: {
    gatewayId: v.id("gateways"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const gateway = await ctx.db.get(args.gatewayId);
    if (!gateway) throw new Error(`Gateway not found: ${args.gatewayId}`);

    await ctx.db.patch(args.gatewayId, {
      isOnline: args.isOnline,
      updatedAt: Date.now(),
    });

    return args.gatewayId;
  },
});
