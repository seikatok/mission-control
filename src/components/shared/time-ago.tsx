"use client";

import { timeAgo, formatDate } from "@/lib/utils";

interface TimeAgoProps {
  ms: number;
  className?: string;
}

export function TimeAgo({ ms, className }: TimeAgoProps) {
  return (
    <span title={formatDate(ms)} className={className}>
      {timeAgo(ms)}
    </span>
  );
}
