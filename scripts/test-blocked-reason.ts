/**
 * appendReasonNote の回帰防止テスト。
 * 実行: npx tsx scripts/test-blocked-reason.ts
 */
import { appendReasonNote } from "../convex/helpers";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${label}`);
    console.error(`  expected: ${JSON.stringify(expected)}`);
    console.error(`  actual:   ${JSON.stringify(actual)}`);
  }
}

// 固定タイムスタンプ (2026-02-23 13:20 JST = UTC+9)
const FIXED_NOW = new Date("2026-02-23T04:20:00Z").getTime();
// Date(FIXED_NOW) の getFullYear etc. はローカルTZ依存だが、
// テストは stamp 文字列を直接チェックせず構造のみ検証する

// --- 1. reason が空なら追記しない ---
assert(
  "empty reason returns original",
  appendReasonNote("existing desc", "BLOCKED理由", "", { now: FIXED_NOW }),
  "existing desc",
);
assert(
  "whitespace-only reason returns original",
  appendReasonNote("existing desc", "BLOCKED理由", "   ", { now: FIXED_NOW }),
  "existing desc",
);

// --- 2. description が空なら区切り線なし ---
const result2 = appendReasonNote(undefined, "BLOCKED理由", "API timeout", { now: FIXED_NOW });
assert("undefined desc: no separator", !result2?.startsWith("---"), true);
assert("undefined desc: starts with header", result2?.startsWith("[BLOCKED理由 "), true);
assert("undefined desc: contains reason", result2?.includes("API timeout"), true);

const result2b = appendReasonNote("", "BLOCKED理由", "API timeout", { now: FIXED_NOW });
// empty string description → treated as falsy, same as undefined
// Our function checks `if (!existingDescription)` — "" is falsy
assert("empty string desc: no separator", !result2b?.startsWith("---"), true);

// --- 3. description がある場合は区切り線付き ---
const result3 = appendReasonNote("Some task description", "BLOCKED理由", "Dep not ready", { now: FIXED_NOW });
assert("existing desc: starts with original", result3?.startsWith("Some task description"), true);
assert("existing desc: has separator", result3?.includes("\n---\n"), true);
assert("existing desc: has header", result3?.includes("[BLOCKED理由 "), true);
assert("existing desc: has reason", result3?.includes("Dep not ready"), true);

// --- 4. reason は trim される ---
const result4 = appendReasonNote(undefined, "BLOCKED理由", "  spaced reason  ", { now: FIXED_NOW });
assert("reason trimmed", result4?.includes("spaced reason"), true);
assert("reason no leading space", !result4?.includes("  spaced reason"), true);

// --- 5. refId による重複防止 ---
const first = appendReasonNote(undefined, "BLOCKED理由", "first reason", {
  now: FIXED_NOW,
  refId: "dec_abc123",
});
assert("refId included in first append", first?.includes("(ref:dec_abc123)"), true);

const second = appendReasonNote(first, "BLOCKED理由", "duplicate reason", {
  now: FIXED_NOW,
  refId: "dec_abc123",
});
assert("duplicate refId: no second append", second, first);

const different = appendReasonNote(first, "BLOCKED理由", "another reason", {
  now: FIXED_NOW,
  refId: "dec_xyz789",
});
assert("different refId: appended", different !== first, true);
assert("different refId: contains both refs", different?.includes("(ref:dec_abc123)") && different?.includes("(ref:dec_xyz789)"), true);

// --- 6. refId なしの場合は常に追記 ---
const noRef1 = appendReasonNote(undefined, "BLOCKED理由", "reason 1", { now: FIXED_NOW });
const noRef2 = appendReasonNote(noRef1, "BLOCKED理由", "reason 2", { now: FIXED_NOW });
assert("no refId: appends twice", noRef2?.includes("reason 1") && noRef2?.includes("reason 2"), true);

// --- 7. フォーマット構造確認 (header\nreason) ---
const result7 = appendReasonNote("desc", "REJECT理由", "bad approach", { now: FIXED_NOW });
const lines = result7!.split("\n");
// desc + --- + header + reason = 4 lines
assert("format: line count", lines.length, 4);
assert("format: line 0 is original", lines[0], "desc");
assert("format: line 1 is separator", lines[1], "---");
assert("format: line 2 starts with header", lines[2].startsWith("[REJECT理由 "), true);
assert("format: line 3 is reason", lines[3], "bad approach");

// --- Summary ---
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
