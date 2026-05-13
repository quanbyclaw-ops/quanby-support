'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  deadline: Date | string
  completedAt?: Date | string | null
  label?: string
}

export default function SlaTimer({ deadline, completedAt, label = 'Resolution' }: Props) {
  const deadlineMs = new Date(deadline).getTime()
  const completedMs = completedAt ? new Date(completedAt).getTime() : null

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (completedMs) return
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [completedMs])

  const refTime = completedMs || now
  const remainingMs = deadlineMs - refTime
  const remainingMin = Math.floor(remainingMs / 60000)
  const isBreached = remainingMs <= 0

  // Estimate window from creation: assume window = 480 min for display
  // Just show percentage remaining of 8h window
  const totalEstimate = 8 * 60 * 60 * 1000 // 8h window estimate
  const elapsed = refTime - (deadlineMs - totalEstimate)
  const percentUsed = Math.min(100, Math.max(0, (elapsed / totalEstimate) * 100))

  const statusColor = isBreached
    ? 'text-red-700 bg-red-50 border-red-200'
    : percentUsed >= 75
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-green-700 bg-green-50 border-green-200'

  const barColor = isBreached ? 'bg-red-500' : percentUsed >= 75 ? 'bg-amber-500' : 'bg-green-500'

  function formatRemaining(min: number): string {
    if (min <= 0) {
      const over = -min
      if (over < 60) return `${over}m overdue`
      if (over < 1440) return `${Math.floor(over / 60)}h ${over % 60}m overdue`
      return `${Math.floor(over / 1440)}d overdue`
    }
    if (min < 60) return `${min}m`
    if (min < 1440) return `${Math.floor(min / 60)}h ${min % 60}m`
    return `${Math.floor(min / 1440)}d ${Math.floor((min % 1440) / 60)}h`
  }

  return (
    <div className={cn('rounded-lg border px-3 py-2 text-sm', statusColor)}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-xs uppercase tracking-wide opacity-70">{label} SLA</span>
        <span className="font-semibold text-xs">
          {completedMs ? '✓ Resolved' : formatRemaining(remainingMin)}
        </span>
      </div>
      <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>
    </div>
  )
}
