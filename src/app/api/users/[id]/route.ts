import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const allowed = ['name', 'role', 'organizationId', 'isActive']
  const data: any = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { organization: { select: { name: true } } }
  })

  return NextResponse.json(user)
}
