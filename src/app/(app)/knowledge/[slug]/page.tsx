import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug } })
  if (!article || !article.isPublished) notFound()

  // Increment view count
  await prisma.knowledgeArticle.update({ where: { slug }, data: { viewCount: { increment: 1 } } })

  // Simple markdown-like rendering
  function renderContent(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-2">{line.slice(4)}</h3>
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-gray-700">{renderInline(line.slice(2))}</li>
      if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 text-gray-700 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>
      if (line.startsWith('| ')) return <div key={i} className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1">{line}</div>
      if (line === '') return <br key={i} />
      return <p key={i} className="text-gray-700 leading-relaxed">{renderInline(line)}</p>
    })
  }

  function renderInline(text: string) {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/knowledge" className="text-sm text-[#1a3a5c] hover:underline flex items-center gap-1 mb-4">
          ← Back to Knowledge Base
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{article.category}</span>
          <span className="text-xs text-gray-400">{article.viewCount} views</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
        <p className="text-sm text-gray-400 mt-1">Last updated {formatDate(article.updatedAt)}</p>
      </div>

      <div className="card p-6 space-y-1">
        {renderContent(article.content)}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium">Still need help?</p>
        <p className="text-sm text-blue-700 mt-1">If this article did not resolve your issue, please submit a support ticket.</p>
        <Link href="/tickets/new" className="btn-primary mt-3 text-sm">Submit a Ticket</Link>
      </div>
    </div>
  )
}
