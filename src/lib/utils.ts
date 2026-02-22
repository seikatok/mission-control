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

