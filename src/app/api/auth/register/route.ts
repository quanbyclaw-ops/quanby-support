import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export async function POST(req: NextRequest) {
  const { name, email, password, confirmPassword, organizationId } = await req.json()

  // Validate required fields
  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  // Password match
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  // Password strength
  if (!PASSWORD_RE.test(password)) {
    return NextResponse.json({
      error: 'Password must be at least 8 characters, include 1 uppercase letter and 1 number',
    }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'CLIENT',
      isActive: false, // Pending admin approval
      organizationId: organizationId || null,
    },
  })

  return NextResponse.json(
    { message: 'Registration submitted. An admin will approve your account.' },
    { status: 201 }
  )
}
