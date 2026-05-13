import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint — no auth required. Used for the registration form organization dropdown.
export async function GET() {
  const orgs = await prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(orgs)
}
