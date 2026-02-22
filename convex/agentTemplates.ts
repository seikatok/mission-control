import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentTemplates").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    policy: v.object({
      allowExternalSend: v.boolean(),
      allowFileWriteOutsideWorkspace: v.boolean(),
      allowDangerousCommands: v.boolean(),
      requireApprovalFor: v.array(v.string()),
    }),
    allowedSkillIds: v.array(v.id("skills")),
  },
  handler: async (ctx, args) => {
    const name = validateString(args.name, "name", 200);
    const description = validateOptionalString(args.description, "description", 2000);

    const now = Date.now();
    return await ctx.db.insert("agentTemplates", {
      name,
      description,
      policy: args.policy,
      allowedSkillIds: args.allowedSkillIds,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("agentTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    policy: v.optional(v.object({
      allowExternalSend: v.boolean(),
      allowFileWriteOutsideWorkspace: v.boolean(),
      allowDangerousCommands: v.boolean(),
      requireApprovalFor: v.array(v.string()),
    })),
    allowedSkillIds: v.optional(v.array(v.id("skills"))),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) throw new Error(`AgentTemplate not found: ${args.id}`);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = validateString(args.name, "name", 200);
    if (args.description !== undefined) patch.description = validateOptionalString(args.description, "description", 2000);
    if (args.policy !== undefined) patch.policy = args.policy;
    if (args.allowedSkillIds !== undefined) patch.allowedSkillIds = args.allowedSkillIds;

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("agentTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) throw new Error(`AgentTemplate not found: ${args.id}`);

    const agents = await ctx.db
      .query("agents")
      .withIndex("by_template", (q) => q.eq("templateId", args.id))
      .collect();

    if (agents.length > 0) {
      throw new Error(`Cannot delete template: ${agents.length} agent(s) still reference it`);
    }

    await ctx.db.delete(args.id);
  },
});
