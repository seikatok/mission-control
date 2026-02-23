import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { writeFileSync } from "fs";
import { join } from "path";

export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL 未設定（playwright.config.ts で .env.local をロード済みのはず）");
  const client = new ConvexHttpClient(url);
  const data = await client.mutation(api.e2eSetup.setupE2E, {});
  writeFileSync(join(__dirname, ".e2e-testdata.json"), JSON.stringify(data, null, 2));
  console.log("✅ E2E global setup done:", data);
}
