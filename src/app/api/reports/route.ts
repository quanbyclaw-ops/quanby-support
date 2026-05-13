import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    totalTickets,
    breachedCount,
    resolvedTickets,
    criticalTickets,
    highTickets,
    mediumTickets,
    lowTickets,
    byOrg,
    byCategory,
    bySeverity,
    byStatus,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { slaBreached: true } }),
    prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({ where: { severity: 'CRITICAL' } }),
    prisma.ticket.count({ where: { severity: 'HIGH' } }),
    prisma.ticket.count({ where: { severity: 'MEDIUM' } }),
    prisma.ticket.count({ where: { severity: 'LOW' } }),
    prisma.ticket.groupBy({ by: ['organizationId'], _count: true }),
    prisma.ticket.groupBy({ by: ['category'], _count: true, orderBy: { _count: { category: 'desc' } } }),
    prisma.ticket.groupBy({ by: ['severity'], _count: true }),
    prisma.ticket.groupBy({ by: ['status'], _count: true }),
  ])

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } })
  const orgMap: Record<string, string> = {}
  orgs.forEach(o => orgMap[o.id] = o.name)

  const byOrgNamed = byOrg.map(o => ({ org: orgMap[o.organizationId] || 'Unknown', count: o._count }))

  const slaCompliance = totalTickets > 0
    ? Math.round(((totalTickets - breachedCount) / totalTickets) * 100)
    : 100

  // Avg resolution time (resolved tickets only)
  const resolvedWithTime = await prisma.ticket.findMany({
    where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true }
  })
  const avgResolutionHours = resolvedWithTime.length > 0
    ? Math.round(
        resolvedWithTime.reduce((sum, t) => {
          const hrs = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 3600000
          return sum + hrs
        }, 0) / resolvedWithTime.length
      )
    : 0

  return NextResponse.json({
    summary: {
      totalTickets,
      breachedCount,
      resolvedTickets,
      slaCompliance,
      avgResolutionHours,
    },
    bySeverity: {
      CRITICAL: criticalTickets,
      HIGH: highTickets,
      MEDIUM: mediumTickets,
      LOW: lowTickets,
    },
    byOrg: byOrgNamed,
    byCategory,
    byStatus,
  })
}
