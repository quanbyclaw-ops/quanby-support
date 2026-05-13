import { cn } from '@/lib/utils'
import { Severity, TicketStatus, UserRole } from '@prisma/client'
import { SEVERITY_COLORS, SEVERITY_LABELS, STATUS_COLORS, STATUS_LABELS, ROLE_COLORS, ROLE_LABELS } from '@/lib/utils'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn('badge', SEVERITY_COLORS[severity])}>
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn('badge border border-transparent', ROLE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </span>
  )
}
