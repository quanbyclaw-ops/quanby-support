import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Severity, TicketStatus, UserRole } from '@prisma/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila'
  })
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  PENDING_CLIENT: 'Pending Client',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-sky-100 text-sky-800 border-sky-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PENDING_CLIENT: 'bg-amber-100 text-amber-800 border-amber-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: 'Client',
  AGENT: 'Support Agent',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  CLIENT: 'bg-gray-100 text-gray-700',
  AGENT: 'bg-blue-100 text-blue-800',
  MANAGER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
}

export function generateTicketNumber(year: number, sequence: number): string {
  return `QS-${year}-${String(sequence).padStart(4, '0')}`
}
