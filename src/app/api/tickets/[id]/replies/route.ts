import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { content, isInternal } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Clients can't send internal notes
  const internal = isInternal && session.role !== 'CLIENT'

  // Access: client can only reply their own tickets
  if (session.role === 'CLIENT' && ticket.submittedById !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      authorId: session.id,
      content,
      isInternal: internal,
    },
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  })

  // Mark first response SLA
  if (!ticket.firstResponseAt && !internal && session.role !== 'CLIENT') {
    await prisma.ticket.update({
      where: { id },
      data: { firstResponseAt: new Date() }
    })
  }

  // Auto-update to IN_PROGRESS if still OPEN
  if (ticket.status === 'OPEN' && !internal) {
    await prisma.ticket.update({ where: { id }, data: { status: 'IN_PROGRESS' } })
    await prisma.ticketHistory.create({
      data: { ticketId: id, userId: session.id, action: 'STATUS_CHANGE', oldValue: 'OPEN', newValue: 'IN_PROGRESS' }
    })
  }

  return NextResponse.json(reply, { status: 201 })
}
