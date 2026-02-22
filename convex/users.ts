import { query } from "./_generated/server";

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users[0] ?? null;
  },
});
