import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId: string | null
  organizationName?: string | null
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: { organization: true },
    })
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name,
    }
  } catch {
    return null
  }
}

export function hasRole(user: SessionUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

export function isStaff(user: SessionUser): boolean {
  return hasRole(user, UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN)
}
