import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isStaff } from '@/lib/auth'
import { calculateSlaDeadlines } from '@/lib/sla'
import { Severity, TicketStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as TicketStatus | null
  const severity = searchParams.get('severity') as Severity | null
  const orgId = searchParams.get('orgId')
  const assignedToId = searchParams.get('assignedToId')
  const search = searchParams.get('search')

  const where: any = {}

  // Role-based filtering
  if (session.role === 'CLIENT') {
    where.submittedById = session.id
  } else if (session.role === 'AGENT') {
    where.assignedToId = session.id
  } else if (orgId) {
    where.organizationId = orgId
  }

  if (status) where.status = status
  if (severity) where.severity = severity
  if (assignedToId && isStaff(session)) where.assignedToId = assignedToId
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { ticketNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      organization: { select: { name: true, slug: true } },
      submittedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { replies: true } },
    },
    orderBy: [
      { slaBreached: 'desc' },
      { severity: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, severity, category, organizationId } = body

  if (!title || !description || !severity || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Determine org
  let orgId = organizationId || session.organizationId
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 })

  // Generate ticket number
  const year = new Date().getFullYear()
  const count = await prisma.ticket.count({
    where: { ticketNumber: { startsWith: `QS-${year}-` } }
  })
  const ticketNumber = `QS-${year}-${String(count + 1).padStart(4, '0')}`

  const now = new Date()
  const sla = calculateSlaDeadlines(severity as Severity, now)

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      title,
      description,
      severity: severity as Severity,
      category,
      organizationId: orgId,
      submittedById: session.id,
      slaDeadlineResponse: sla.response,
      slaDeadlineResolution: sla.resolution,
    },
    include: {
      organization: { select: { name: true } },
      submittedBy: { select: { name: true, email: true } },
    }
  })

  // Log history
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      userId: session.id,
      action: 'CREATED',
      newValue: ticketNumber,
    }
  })

  return NextResponse.json(ticket, { status: 201 })
}
