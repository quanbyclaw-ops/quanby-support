import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (session.id !== id && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { currentPassword, newPassword } = await req.json()
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || !user.passwordHash) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } })

  return NextResponse.json({ success: true })
}
