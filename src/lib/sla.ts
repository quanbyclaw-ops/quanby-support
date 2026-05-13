import { Severity, TicketStatus } from '@prisma/client'

// Business hours: 9AM-5PM Mon-Fri PHT (UTC+8)
const BUSINESS_START = 9 // 9 AM
const BUSINESS_END = 17  // 5 PM
const PHT_OFFSET = 8 * 60 // UTC+8 in minutes

export const SLA_CONFIG: Record<Severity, { responseMinutes: number; resolutionMinutes: number; is24x7: boolean }> = {
  CRITICAL: { responseMinutes: 60, resolutionMinutes: 1440, is24x7: true },
  HIGH: { responseMinutes: 240, resolutionMinutes: 14400, is24x7: false },   // 3 biz days ≈ 2400 min → use 14400 for "3-5 biz days"
  MEDIUM: { responseMinutes: 480, resolutionMinutes: 28800, is24x7: false },
  LOW: { responseMinutes: 480, resolutionMinutes: 57600, is24x7: false },
}

function toPHT(date: Date): Date {
  const utcMs = date.getTime()
  return new Date(utcMs + PHT_OFFSET * 60000)
}

function isBusinessHour(phtDate: Date): boolean {
  const day = phtDate.getDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const h = phtDate.getHours()
  return h >= BUSINESS_START && h < BUSINESS_END
}

// Add business minutes to a date (PHT-aware)
export function addBusinessMinutes(start: Date, minutes: number, is24x7: boolean): Date {
  if (is24x7) {
    return new Date(start.getTime() + minutes * 60000)
  }
  
  let remaining = minutes
  let current = new Date(start)
  
  // Snap to next business hour if outside
  const phtCurrent = toPHT(current)
  const day = phtCurrent.getDay()
  if (day === 0 || day === 6 || phtCurrent.getHours() >= BUSINESS_END) {
    // Move to next Monday (or next day) 9AM PHT
    const next = new Date(current)
    const phtNext = toPHT(next)
    phtNext.setHours(BUSINESS_START, 0, 0, 0)
    if (phtNext.getDay() === 0) phtNext.setDate(phtNext.getDate() + 1)
    else if (phtNext.getDay() === 6) phtNext.setDate(phtNext.getDate() + 2)
    else if (phtCurrent.getHours() >= BUSINESS_END) phtNext.setDate(phtNext.getDate() + 1)
    current = new Date(phtNext.getTime() - PHT_OFFSET * 60000)
  } else if (phtCurrent.getHours() < BUSINESS_START) {
    const phtNext = toPHT(current)
    phtNext.setHours(BUSINESS_START, 0, 0, 0)
    current = new Date(phtNext.getTime() - PHT_OFFSET * 60000)
  }
  
  while (remaining > 0) {
    const phtC = toPHT(current)
    const endOfBizToday = new Date(current)
    const phtEnd = toPHT(endOfBizToday)
    phtEnd.setHours(BUSINESS_END, 0, 0, 0)
    const endOfBiz = new Date(phtEnd.getTime() - PHT_OFFSET * 60000)
    
    const minutesUntilEnd = Math.floor((endOfBiz.getTime() - current.getTime()) / 60000)
    
    if (remaining <= minutesUntilEnd) {
      current = new Date(current.getTime() + remaining * 60000)
      remaining = 0
    } else {
      remaining -= minutesUntilEnd
      // Jump to next business day 9AM
      const nextDay = toPHT(endOfBiz)
      nextDay.setDate(nextDay.getDate() + 1)
      nextDay.setHours(BUSINESS_START, 0, 0, 0)
      // Skip weekends
      while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
        nextDay.setDate(nextDay.getDate() + 1)
      }
      current = new Date(nextDay.getTime() - PHT_OFFSET * 60000)
    }
  }
  
  return current
}

export function calculateSlaDeadlines(severity: Severity, createdAt: Date): { response: Date; resolution: Date } {
  const config = SLA_CONFIG[severity]
  return {
    response: addBusinessMinutes(createdAt, config.responseMinutes, config.is24x7),
    resolution: addBusinessMinutes(createdAt, config.resolutionMinutes, config.is24x7),
  }
}

export function getSlaStatus(deadline: Date, completedAt?: Date | null): {
  status: 'ok' | 'warning' | 'breached'
  percentUsed: number
  timeRemaining: number // minutes
} {
  const now = completedAt || new Date()
  const timeRemaining = Math.floor((deadline.getTime() - now.getTime()) / 60000)
  
  // We'd need start time to calculate percent - use a rough estimate
  const totalWindow = deadline.getTime() - (deadline.getTime() - 8 * 3600000) // assume 8h window for display
  const elapsed = now.getTime() - (deadline.getTime() - totalWindow)
  const percentUsed = Math.min(100, Math.max(0, (elapsed / totalWindow) * 100))
  
  if (now > deadline) return { status: 'breached', percentUsed: 100, timeRemaining }
  if (percentUsed >= 75) return { status: 'warning', percentUsed, timeRemaining }
  return { status: 'ok', percentUsed, timeRemaining }
}

export function formatDuration(minutes: number): string {
  if (minutes < 0) {
    return `${formatDuration(-minutes)} overdue`
  }
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
}

export function shouldPauseSla(status: TicketStatus): boolean {
  return status === TicketStatus.PENDING_CLIENT
}
