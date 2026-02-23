import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// .env.local を手動ロード（追加パッケージ不要）
function loadEnv() {
  try {
    readFileSync(".env.local", "utf-8").split("\n").forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx < 0) return;
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1);
      process.env[key] = val;
    });
  } catch {}
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL が未設定です (.env.local を確認)");
  const client = new ConvexHttpClient(url);
  const data = await client.mutation(api.e2eSetup.setupE2E, {});
  mkdirSync("e2e", { recursive: true });
  writeFileSync(join("e2e", ".e2e-testdata.json"), JSON.stringify(data, null, 2));
  console.log("✅ E2E セットアップ完了:", data);
}

main().catch(err => { console.error(err); process.exit(1); });
