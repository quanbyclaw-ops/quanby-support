import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email, role, organizationId, password } = await req.json()
  if (!name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password || 'Welcome@2026!', 10)

  const user = await prisma.user.create({
    data: { name, email, role: role as UserRole, organizationId: organizationId || null, passwordHash },
    include: { organization: { select: { name: true } } }
  })

  return NextResponse.json(user, { status: 201 })
}
