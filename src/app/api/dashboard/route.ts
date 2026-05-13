import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const bySeverity = await prisma.ticket.groupBy({
    by: ['severity'],
    where,
    _count: true,
  })

  const byCategory = await prisma.ticket.groupBy({
    by: ['category'],
    where,
    _count: true,
    orderBy: { _count: { category: 'desc' } },
    take: 5,
  })

  // Recent tickets
  const recent = await prisma.ticket.findMany({
    where,
    include: {
      organization: { select: { name: true } },
      submittedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Agent workload (admin/manager only)
  let agentWorkload: any[] = []
  if (session.role === 'ADMIN' || session.role === 'MANAGER') {
    const agents = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'MANAGER'] }, isActive: true },
      select: { id: true, name: true }
    })
    agentWorkload = await Promise.all(
      agents.map(async (a) => ({
        ...a,
        count: await prisma.ticket.count({
          where: { assignedToId: a.id, status: { in: ['OPEN', 'IN_PROGRESS'] } }
        })
      }))
    )
  }

  const active = open + inProgress + pendingClient
  const slaCompliance = total > 0 ? Math.round(((total - breached) / total) * 100) : 100

  return NextResponse.json({
    stats: { total, open, inProgress, pendingClient, resolved, closed, breached, active, slaCompliance },
    bySeverity,
    byCategory,
    recent,
    agentWorkload,
  })
}
