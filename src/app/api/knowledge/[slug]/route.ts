import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment view count
  await prisma.knowledgeArticle.update({ where: { slug }, data: { viewCount: { increment: 1 } } })

  return NextResponse.json(article)
}
