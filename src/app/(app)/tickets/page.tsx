import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SeverityBadge, StatusBadge } from '@/components/Badge'
import { formatRelative } from '@/lib/utils'
import { TicketStatus, Severity } from '@prisma/client'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  status?: string
  severity?: string
  search?: string
  orgId?: string
}>

export default async function TicketsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession()
  if (!session) return null

  const sp = await searchParams
  const where: any = {}

  if (session.role === 'CLIENT') where.submittedById = session.id
  else if (session.role === 'AGENT') where.assignedToId = session.id

  if (sp.status) where.status = sp.status as TicketStatus
  if (sp.severity) where.severity = sp.severity as Severity
  if (sp.orgId) where.organizationId = sp.orgId
  if (sp.search) {
    where.OR = [
      { title: { contains: sp.search, mode: 'insensitive' } },
      { ticketNumber: { contains: sp.search, mode: 'insensitive' } },
    ]
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      organization: { select: { name: true } },
      submittedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { replies: true } },
    },
    orderBy: [{ slaBreached: 'desc' }, { severity: 'asc' }, { createdAt: 'desc' }],
  })

  const orgs = session.role !== 'CLIENT' 
    ? await prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    : []

  const isStaff = session.role !== 'CLIENT'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/tickets/new" className="btn-primary">+ New Ticket</Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form className="flex flex-wrap gap-3">
          <input
            name="search"
            defaultValue={sp.search || ''}
            placeholder="Search tickets..."
            className="input max-w-xs"
          />
          <select name="status" defaultValue={sp.status || ''} className="input max-w-[160px]">
            <option value="">All Statuses</option>
            {(['OPEN','IN_PROGRESS','PENDING_CLIENT','RESOLVED','CLOSED'] as TicketStatus[]).map(s => (
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </select>
          <select name="severity" defaultValue={sp.severity || ''} className="input max-w-[140px]">
            <option value="">All Severities</option>
            {(['CRITICAL','HIGH','MEDIUM','LOW'] as Severity[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {isStaff && orgs.length > 0 && (
            <select name="orgId" defaultValue={sp.orgId || ''} className="input max-w-[180px]">
              <option value="">All Organizations</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <button type="submit" className="btn-primary">Filter</button>
          <Link href="/tickets" className="btn-secondary">Clear</Link>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {isStaff && <th className="text-left px-4 py-3 font-medium text-gray-600">Organization</th>}
              {isStaff && <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned To</th>}
              <th className="text-left px-4 py-3 font-medium text-gray-600">Replies</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No tickets found</td></tr>
            ) : tickets.map(t => (
              <tr key={t.id} className="table-row">
                <td className="px-4 py-3">
                  <Link href={`/tickets/${t.id}`} className="block hover:text-[#1a3a5c]">
                    <div className="flex items-center gap-2">
                      {t.slaBreached && <span className="text-red-500 text-xs" title="SLA Breached">⚠</span>}
                      <div>
                        <div className="font-mono text-xs text-gray-400">{t.ticketNumber}</div>
                        <div className="font-medium text-gray-900 line-clamp-1">{t.title}</div>
                        <div className="text-xs text-gray-400">{t.category}</div>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3"><SeverityBadge severity={t.severity} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                {isStaff && <td className="px-4 py-3 text-gray-600 text-xs">{t.organization.name}</td>}
                {isStaff && (
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {t.assignedTo?.name || <span className="text-amber-600">Unassigned</span>}
                  </td>
                )}
                <td className="px-4 py-3 text-center text-gray-600">{t._count.replies}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
