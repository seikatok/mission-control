/**
 * Feature flags (client-side).
 * L2 flags: default ON (can be turned OFF in settings).
 * Naming: FF_ + SCREAMING_SNAKE_CASE
 * Policy: fail-closed (unknown key → false)
 */
const FLAGS = {
  FF_NOTIFICATION_BADGE: true,
} as const;

type FlagKey = keyof typeof FLAGS;

export function isEnabled(flag: FlagKey): boolean {
  return FLAGS[flag] ?? false;
}
