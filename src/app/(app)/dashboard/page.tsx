import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SeverityBadge, StatusBadge } from '@/components/Badge'
import { formatRelative } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getDashboardData(session: any) {
  const where: any = {}
  if (session.role === 'CLIENT') where.submittedById = session.id
  else if (session.role === 'AGENT') where.assignedToId = session.id

  const [total, open, inProgress, pendingClient, resolved, closed, breached] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
    prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { ...where, status: 'PENDING_CLIENT' } }),
    prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }),
    prisma.ticket.count({ where: { ...where, slaBreached: true } }),
  ])

  const recent = await prisma.ticket.findMany({
    where,
    include: {
      organization: { select: { name: true } },
      submittedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  let agentWorkload: any[] = []
  if (session.role === 'ADMIN' || session.role === 'MANAGER') {
    const agents = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'MANAGER'] }, isActive: true },
      select: { id: true, name: true }
    })
    agentWorkload = await Promise.all(
      agents.map(async (a) => ({
        ...a,
        open: await prisma.ticket.count({ where: { assignedToId: a.id, status: { in: ['OPEN', 'IN_PROGRESS'] } } })
      }))
    )
  }

  const slaCompliance = total > 0 ? Math.round(((total - breached) / total) * 100) : 100
  return { stats: { total, open, inProgress, pendingClient, resolved, closed, breached, slaCompliance }, recent, agentWorkload }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const { stats, recent, agentWorkload } = await getDashboardData(session)

  const statCards = [
    { label: 'Open', value: stats.open, color: 'text-sky-600', bg: 'bg-sky-50', href: '/tickets?status=OPEN' },
    { label: 'In Progress', value: stats.inProgress, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/tickets?status=IN_PROGRESS' },
    { label: 'Pending Client', value: stats.pendingClient, color: 'text-amber-600', bg: 'bg-amber-50', href: '/tickets?status=PENDING_CLIENT' },
    { label: 'Resolved', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-50', href: '/tickets?status=RESOLVED' },
    { label: 'SLA Breached', value: stats.breached, color: 'text-red-600', bg: 'bg-red-50', href: '/tickets' },
    { label: 'SLA Compliance', value: `${stats.slaCompliance}%`, color: stats.slaCompliance >= 90 ? 'text-green-600' : 'text-amber-600', bg: stats.slaCompliance >= 90 ? 'bg-green-50' : 'bg-amber-50', href: '/admin/reports' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {session.name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href} className={`card p-4 hover:shadow-md transition-shadow ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
            <Link href="/tickets" className="text-sm text-[#1a3a5c] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No tickets yet</div>
            ) : recent.map(t => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{t.ticketNumber}</span>
                    <SeverityBadge severity={t.severity} />
                    <StatusBadge status={t.status} />
                    {t.slaBreached && <span className="badge bg-red-100 text-red-700 border-red-200">⚠ SLA</span>}
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t.organization.name} · {t.assignedTo ? `Assigned: ${t.assignedTo.name}` : 'Unassigned'} · {formatRelative(t.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/tickets/new" className="btn-primary w-full justify-center text-sm">
                + New Ticket
              </Link>
              <Link href="/tickets" className="btn-secondary w-full justify-center text-sm">
                View All Tickets
              </Link>
              <Link href="/knowledge" className="btn-secondary w-full justify-center text-sm">
                Knowledge Base
              </Link>
            </div>
          </div>

          {/* Agent Workload */}
          {agentWorkload.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Agent Workload</h3>
              <div className="space-y-2">
                {agentWorkload.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{a.name}</span>
                    <span className={`text-sm font-bold ${a.open > 5 ? 'text-red-600' : a.open > 3 ? 'text-amber-600' : 'text-green-600'}`}>
                      {a.open}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLA Summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">SLA Summary</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Compliance</span>
                  <span className="font-semibold">{stats.slaCompliance}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stats.slaCompliance >= 90 ? 'bg-green-500' : stats.slaCompliance >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.slaCompliance}%` }}
                  />
                </div>
              </div>
              {stats.breached > 0 && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <span className="text-red-600 text-lg">⚠</span>
                  <div>
                    <div className="text-sm font-medium text-red-700">{stats.breached} SLA Breach{stats.breached > 1 ? 'es' : ''}</div>
                    <div className="text-xs text-red-500">Requires immediate attention</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
