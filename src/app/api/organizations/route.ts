import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgs = await prisma.organization.findMany({
    include: {
      _count: { select: { users: true, tickets: true } }
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(orgs)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, slug, domain } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })

  const org = await prisma.organization.create({ data: { name, slug, domain } })
  return NextResponse.json(org, { status: 201 })
}
