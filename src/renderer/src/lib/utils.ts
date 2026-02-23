import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function getStatusColor(statusCode: number | null): string {
  if (!statusCode) return 'text-muted-foreground'
  if (statusCode >= 500) return 'text-red-400'
  if (statusCode >= 400) return 'text-orange-400'
  if (statusCode >= 300) return 'text-blue-400'
  if (statusCode >= 200) return 'text-green-400'
  return 'text-muted-foreground'
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-blue-400',
    POST: 'text-green-400',
    PUT: 'text-yellow-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400',
    HEAD: 'text-purple-400',
    OPTIONS: 'text-cyan-400'
  }
  return colors[method.toUpperCase()] ?? 'text-muted-foreground'
}
