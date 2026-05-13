import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')

  const where: any = { isPublished: true }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category) where.category = category

  const articles = await prisma.knowledgeArticle.findMany({
    where,
    orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content, category, slug } = await req.json()
  const article = await prisma.knowledgeArticle.create({
    data: { title, content, category, slug: slug || title.toLowerCase().replace(/\s+/g, '-') }
  })

  return NextResponse.json(article, { status: 201 })
}
