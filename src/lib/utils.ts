import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(ms: number): string {
  return format(new Date(ms), "yyyy/MM/dd HH:mm")
}

export function formatDateShort(ms: number): string {
  return format(new Date(ms), "MM/dd")
}

export function timeAgo(ms: number): string {
  return formatDistanceToNow(new Date(ms), { addSuffix: true })
}

export function formatAge(ms: number): string {
  if (ms < 0) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間`;
  const days = Math.floor(hours / 24);
  return `${days}日`;
}

