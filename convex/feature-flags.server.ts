/**
 * Feature flags (Convex server-side).
 * L3 flags: default OFF (requires env + flag both set to activate).
 * Naming: FF_ + SCREAMING_SNAKE_CASE
 * Policy: fail-closed (unknown key → false, env missing → false)
 */
const SERVER_FLAGS = {
  FF_SLACK_NOTIFY: false,
  FF_STALE_AUTO_ESCALATE: false,
} as const;

type ServerFlagKey = keyof typeof SERVER_FLAGS;

export function isServerEnabled(flag: ServerFlagKey): boolean {
  return SERVER_FLAGS[flag] ?? false;
}
