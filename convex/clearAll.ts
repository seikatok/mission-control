import { mutation } from "./_generated/server";
import { v } from "convex/values";

const TABLES = [
  "activityEvents",
  "complianceEvents",
  "outputs",
  "decisions",
  "runs",
  "tasks",
  "boards",
  "goals",
  "agents",
  "agentTemplates",
  "gateways",
  "skills",
  "users",
] as const;

/** 開発環境かつ confirm トークン一致時のみ全データ削除を許可する */
export default mutation({
  args: {
    confirm: v.string(),
  },
  handler: async (ctx, args) => {
    // 環境変数ガード: Convex Dashboard の dev deployment 環境変数に
    //   ALLOW_CLEAR_ALL = true  を設定した場合のみ実行可能
    // 本番 deployment では絶対に設定しないこと。
    if (process.env.ALLOW_CLEAR_ALL !== "true") {
      throw new Error(
        "clearAll は無効です。dev deployment の環境変数に ALLOW_CLEAR_ALL=true を設定してください。"
      );
    }
    // 二重確認トークン
    if (args.confirm !== "DELETE_ALL") {
      throw new Error(
        "実行には confirm: \"DELETE_ALL\" の指定が必要です。"
      );
    }

    for (const table of TABLES) {
      const rows = await ctx.db.query(table).collect();
      await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
      console.log(`Deleted ${rows.length} rows from ${table}`);
    }
    console.log("clearAll completed.");
  },
});
