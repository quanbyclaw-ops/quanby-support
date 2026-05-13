import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { SeverityBadge, StatusBadge } from '@/components/Badge'
import { formatDate, formatRelative, STATUS_LABELS } from '@/lib/utils'
import SlaTimer from '@/components/SlaTimer'
import TicketActions from './TicketActions'
import ReplyForm from './ReplyForm'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      organization: true,
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      replies: {
        include: { author: { select: { id: true, name: true, role: true } } },
        where: session.role === 'CLIENT' ? { isInternal: false } : {},
        orderBy: { createdAt: 'asc' },
      },
      history: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!ticket) notFound()

  if (session.role === 'CLIENT' && ticket.submittedById !== session.id) notFound()

  const isStaff = session.role !== 'CLIENT'
  const agents = isStaff
    ? await prisma.user.findMany({
        where: { role: { in: ['AGENT', 'MANAGER', 'ADMIN'] }, isActive: true },
        select: { id: true, name: true },
      })
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ticket.ticketNumber}</span>
              <SeverityBadge severity={ticket.severity} />
              <StatusBadge status={ticket.status} />
              {ticket.slaBreached && (
                <span className="badge bg-red-100 text-red-700 border-red-200">⚠ SLA Breached</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            <div className="text-sm text-gray-500 mt-1">
              {ticket.organization.name} · Category: {ticket.category} · Submitted by {ticket.submittedBy.name} · {formatRelative(ticket.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white text-sm font-bold">
                {ticket.submittedBy.name.charAt(0)}
              </div>
              <div>
                <span className="font-medium text-sm text-gray-900">{ticket.submittedBy.name}</span>
                <span className="text-xs text-gray-400 ml-2">{formatDate(ticket.createdAt)}</span>
              </div>
              <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Original Request</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</div>
          </div>

          {/* Replies */}
          {ticket.replies.map(reply => (
            <div key={reply.id} className={`card p-5 ${reply.isInternal ? 'border-amber-200 bg-amber-50/30' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  reply.author.role === 'CLIENT' ? 'bg-gray-400' : 'bg-[#1a3a5c]'
                }`}>
                  {reply.author.name.charAt(0)}
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900">{reply.author.name}</span>
                  <span className="text-xs text-gray-500 ml-1 capitalize">({reply.author.role.toLowerCase()})</span>
                  <span className="text-xs text-gray-400 ml-2">{formatDate(reply.createdAt)}</span>
                </div>
                {reply.isInternal && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-0.5">
                    🔒 Internal Note
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{reply.content}</div>
            </div>
          ))}

          {/* Reply Form */}
          <ReplyForm ticketId={ticket.id} canSendInternal={isStaff} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* SLA */}
          {ticket.slaDeadlineResolution && (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">SLA Status</h3>
              {ticket.slaDeadlineResponse && (
                <SlaTimer
                  deadline={ticket.slaDeadlineResponse}
                  completedAt={ticket.firstResponseAt}
                  label="Response"
                />
              )}
              <SlaTimer
                deadline={ticket.slaDeadlineResolution}
                completedAt={ticket.resolvedAt}
                label="Resolution"
              />
              {ticket.slaPausedAt && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
                  ⏸ SLA paused — Pending Client response
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Ticket Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd><StatusBadge status={ticket.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Severity</dt>
                <dd><SeverityBadge severity={ticket.severity} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Assigned To</dt>
                <dd className="font-medium">{ticket.assignedTo?.name || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Organization</dt>
                <dd className="font-medium text-right max-w-[120px] truncate">{ticket.organization.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium">{ticket.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-xs text-right">{formatDate(ticket.createdAt)}</dd>
              </div>
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Resolved</dt>
                  <dd className="text-xs text-right">{formatDate(ticket.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions (staff only) */}
          {isStaff && (
            <TicketActions
              ticket={{
                id: ticket.id,
                status: ticket.status,
                severity: ticket.severity,
                assignedToId: ticket.assignedToId,
              }}
              agents={agents}
            />
          )}

          {/* Timeline */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Activity Timeline</h3>
            <div className="space-y-2">
              {ticket.history.map(h => (
                <div key={h.id} className="flex gap-2 text-xs">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <div>
                    <span className="text-gray-700">{h.user.name}</span>
                    <span className="text-gray-400 mx-1">
                      {h.action === 'STATUS_CHANGE' && `changed status to ${STATUS_LABELS[h.newValue as keyof typeof STATUS_LABELS] || h.newValue}`}
                      {h.action === 'ASSIGNED' && `assigned ticket to ${h.newValue}`}
                      {h.action === 'CREATED' && 'created ticket'}
                      {h.action === 'SEVERITY_CHANGE' && `changed severity to ${h.newValue}`}
                    </span>
                    <div className="text-gray-300">{formatRelative(h.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
