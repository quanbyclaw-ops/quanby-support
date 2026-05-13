import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SEVERITY_LABELS, STATUS_LABELS } from '@/lib/utils'
import { Severity, TicketStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) redirect('/dashboard')

  const [
    totalTickets,
    breachedCount,
    resolvedCount,
    byStatus,
    bySeverity,
    byCategory,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { slaBreached: true } }),
    prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.groupBy({ by: ['status'], _count: true }),
    prisma.ticket.groupBy({ by: ['severity'], _count: true }),
    prisma.ticket.groupBy({ by: ['category'], _count: true, orderBy: { _count: { category: 'desc' } } }),
  ])

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } })
  const byOrgRaw = await prisma.ticket.groupBy({ by: ['organizationId'], _count: true })
  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]))
  const byOrg = byOrgRaw.map(r => ({ name: orgMap[r.organizationId] || 'Unknown', count: r._count }))
    .sort((a, b) => b.count - a.count)

  const slaCompliance = totalTickets > 0
    ? Math.round(((totalTickets - breachedCount) / totalTickets) * 100)
    : 100

  const resolvedWithTime = await prisma.ticket.findMany({
    where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true, severity: true }
  })
  const avgHours = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 3600000, 0) / resolvedWithTime.length)
    : 0

  // Last 30 days ticket trend (by week)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000)
  const recentTickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true, severity: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SLA Compliance Reports</h1>
        <p className="text-sm text-gray-500 mt-1">System-wide ticket and SLA performance metrics</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-[#1a3a5c]">{totalTickets}</div>
          <div className="text-sm text-gray-500 mt-1">Total Tickets</div>
        </div>
        <div className={`card p-5 text-center ${slaCompliance >= 90 ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className={`text-3xl font-bold ${slaCompliance >= 90 ? 'text-green-600' : 'text-amber-600'}`}>{slaCompliance}%</div>
          <div className="text-sm text-gray-500 mt-1">SLA Compliance</div>
        </div>
        <div className={`card p-5 text-center ${breachedCount > 0 ? 'bg-red-50' : ''}`}>
          <div className={`text-3xl font-bold ${breachedCount > 0 ? 'text-red-600' : 'text-gray-700'}`}>{breachedCount}</div>
          <div className="text-sm text-gray-500 mt-1">SLA Breaches</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-[#1a3a5c]">{avgHours}h</div>
          <div className="text-sm text-gray-500 mt-1">Avg Resolution Time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* By Status */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tickets by Status</h2>
          <div className="space-y-3">
            {byStatus.map(s => {
              const pct = totalTickets > 0 ? Math.round((s._count / totalTickets) * 100) : 0
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{STATUS_LABELS[s.status as TicketStatus]}</span>
                    <span className="font-semibold">{s._count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1a3a5c] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Severity */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tickets by Severity</h2>
          <div className="space-y-3">
            {bySeverity.map(s => {
              const pct = totalTickets > 0 ? Math.round((s._count / totalTickets) * 100) : 0
              const colors: Record<string, string> = { CRITICAL: 'bg-red-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-yellow-500', LOW: 'bg-blue-500' }
              return (
                <div key={s.severity}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{SEVERITY_LABELS[s.severity as Severity]}</span>
                    <span className="font-semibold">{s._count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[s.severity]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Organization */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tickets by Organization</h2>
          <div className="space-y-3">
            {byOrg.map(o => {
              const pct = totalTickets > 0 ? Math.round((o.count / totalTickets) * 100) : 0
              return (
                <div key={o.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate max-w-[200px]">{o.name}</span>
                    <span className="font-semibold">{o.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2a5a8c] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Category */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Issue Categories</h2>
          <div className="space-y-2">
            {byCategory.slice(0, 8).map((c, i) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate">{c.category}</span>
                    <span className="font-semibold ml-2">{c._count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SLA Compliance by Severity */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">SLA Compliance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(sev => {
            const total = bySeverity.find(s => s.severity === sev)?._count || 0
            const breached = 0 // Would need per-severity breach count
            const compliance = total > 0 ? 100 : 100 // Simplified
            return (
              <div key={sev} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">{SEVERITY_LABELS[sev]}</div>
                <div className="text-2xl font-bold text-[#1a3a5c]">{total}</div>
                <div className="text-xs text-gray-400">tickets</div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <strong>Overall SLA compliance: {slaCompliance}%</strong> — 
          {resolvedCount} of {totalTickets} tickets resolved, {breachedCount} SLA breach{breachedCount !== 1 ? 'es' : ''} recorded.
        </div>
      </div>
    </div>
  )
}
