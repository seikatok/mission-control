import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateString, validateOptionalString } from "./helpers";

export const list = query({
  args: {
    goalId: v.optional(v.id("goals")),
  },
  handler: async (ctx, args) => {
    if (args.goalId) {
      return await ctx.db
        .query("boards")
        .withIndex("by_goal_createdAt", (q) => q.eq("goalId", args.goalId))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("boards").withIndex("by_createdAt").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    goalId: v.optional(v.id("goals")),
    kind: v.optional(v.union(
      v.literal("generic"),
      v.literal("content_pipeline"),
      v.literal("software_pipeline"),
      v.literal("custom"),
    )),
    columns: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = validateString(args.name, "name", 200);
    const description = validateOptionalString(args.description, "description", 2000);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      if (!goal) throw new Error(`Goal not found: ${args.goalId}`);
    }

    let columns = args.columns;
    if (columns !== undefined && columns.length === 0) {
      columns = undefined;
    }
    if (columns) {
      if (columns.length > 20) throw new Error("columns cannot exceed 20 items");
      const seen = new Set<string>();
      for (const col of columns) {
        const trimmed = col.trim();
        if (!trimmed) throw new Error("column name cannot be empty");
        if (trimmed.length > 50) throw new Error("column name exceeds 50 chars");
        if (seen.has(trimmed)) throw new Error(`duplicate column name: ${trimmed}`);
        seen.add(trimmed);
      }
    }

    const now = Date.now();
    return await ctx.db.insert("boards", {
      name,
      description,
      goalId: args.goalId,
      kind: args.kind,
      columns,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("boards"),
    name: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    kind: v.optional(v.union(
      v.literal("generic"),
      v.literal("content_pipeline"),
      v.literal("software_pipeline"),
      v.literal("custom"),
    )),
    columns: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.id);
    if (!board) throw new Error(`Board not found: ${args.id}`);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = validateString(args.name, "name", 200);
    if (args.description !== undefined) patch.description = validateOptionalString(args.description, "description", 2000);
    if (args.goalId !== undefined) {
      const goal = await ctx.db.get(args.goalId);
      if (!goal) throw new Error(`Goal not found: ${args.goalId}`);
      patch.goalId = args.goalId;
    }
    if (args.kind !== undefined) patch.kind = args.kind;
    if (args.columns !== undefined) {
      let columns: string[] | undefined = args.columns;
      if (columns && columns.length === 0) columns = undefined;
      patch.columns = columns;
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});
