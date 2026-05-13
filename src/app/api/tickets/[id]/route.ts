import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isStaff } from '@/lib/auth'
import { TicketStatus } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      attachments: true,
      history: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Access control
  if (session.role === 'CLIENT' && ticket.submittedById !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(ticket)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Clients can only reply, not change status/assignment
  if (session.role === 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: any = {}
  const historyEntries: any[] = []

  if (body.status && body.status !== ticket.status) {
    const oldStatus = ticket.status
    updates.status = body.status as TicketStatus

    // SLA pause/resume
    if (body.status === 'PENDING_CLIENT' && !ticket.slaPausedAt) {
      updates.slaPausedAt = new Date()
    } else if (body.status !== 'PENDING_CLIENT' && ticket.slaPausedAt) {
      const pausedMs = Date.now() - ticket.slaPausedAt.getTime()
      const pausedMin = Math.floor(pausedMs / 60000)
      updates.slaAccumulatedPause = (ticket.slaAccumulatedPause || 0) + pausedMin
      updates.slaPausedAt = null

      // Extend SLA deadlines
      if (ticket.slaDeadlineResponse) {
        updates.slaDeadlineResponse = new Date(ticket.slaDeadlineResponse.getTime() + pausedMs)
      }
      if (ticket.slaDeadlineResolution) {
        updates.slaDeadlineResolution = new Date(ticket.slaDeadlineResolution.getTime() + pausedMs)
      }
    }

    if (body.status === 'RESOLVED' && !ticket.resolvedAt) {
      updates.resolvedAt = new Date()
    }
    if (body.status === 'CLOSED') {
      updates.closedAt = new Date()
    }

    historyEntries.push({ ticketId: id, userId: session.id, action: 'STATUS_CHANGE', oldValue: oldStatus, newValue: body.status })
  }

  if (body.assignedToId !== undefined && body.assignedToId !== ticket.assignedToId) {
    updates.assignedToId = body.assignedToId || null
    historyEntries.push({ ticketId: id, userId: session.id, action: 'ASSIGNED', oldValue: ticket.assignedToId, newValue: body.assignedToId })
  }

  if (body.severity && body.severity !== ticket.severity) {
    historyEntries.push({ ticketId: id, userId: session.id, action: 'SEVERITY_CHANGE', oldValue: ticket.severity, newValue: body.severity })
    updates.severity = body.severity
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: updates,
    include: {
      organization: true,
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true } },
    }
  })

  if (historyEntries.length > 0) {
    await prisma.ticketHistory.createMany({ data: historyEntries })
  }

  return NextResponse.json(updated)
}
