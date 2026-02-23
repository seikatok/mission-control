"use client";

const THRESHOLDS = [
  { maxMs: 1 * 60 * 60 * 1000, label: null, color: "" },
  { maxMs: 4 * 60 * 60 * 1000, label: "1h+", color: "bg-yellow-600" },
  { maxMs: 24 * 60 * 60 * 1000, label: "4h+", color: "bg-orange-600" },
  { maxMs: Infinity, label: "24h+", color: "bg-red-600" },
];

export function StaleBadge({ createdAt }: { createdAt: number }) {
  const ageMs = Date.now() - createdAt;

  for (const t of THRESHOLDS) {
    if (ageMs < t.maxMs) {
      if (!t.label) return null;
      return (
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${t.color}`}
        >
          {t.label}
        </span>
      );
    }
  }

  return null;
}
