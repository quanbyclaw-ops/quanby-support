import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatRelative } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ search?: string; category?: string }>

export default async function KnowledgePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams

  const where: any = { isPublished: true }
  if (sp.search) {
    where.OR = [
      { title: { contains: sp.search, mode: 'insensitive' } },
      { content: { contains: sp.search, mode: 'insensitive' } },
    ]
  }
  if (sp.category) where.category = sp.category

  const articles = await prisma.knowledgeArticle.findMany({
    where,
    orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
  })

  const categories = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    select: { category: true },
    distinct: ['category'],
  })

  const categoryList = categories.map(c => c.category)

  const grouped = categoryList.reduce((acc: Record<string, typeof articles>, cat) => {
    if (!sp.category || sp.category === cat) {
      acc[cat] = articles.filter(a => a.category === cat)
    }
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-sm text-gray-500 mt-1">Guides, FAQs, and documentation</p>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={sp.search || ''}
            placeholder="Search articles..."
            className="input flex-1 min-w-[200px]"
          />
          <select name="category" defaultValue={sp.category || ''} className="input max-w-[200px]">
            <option value="">All Categories</option>
            {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn-primary">Search</button>
          <Link href="/knowledge" className="btn-secondary">Clear</Link>
        </form>
      </div>

      {articles.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📚</div>
          <p>No articles found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).filter(([, arts]) => arts.length > 0).map(([cat, arts]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{cat}</h2>
              <div className="space-y-2">
                {arts.map(article => (
                  <Link
                    key={article.id}
                    href={`/knowledge/${article.slug}`}
                    className="card p-4 flex items-start justify-between hover:shadow-md transition-shadow group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-[#1a3a5c] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {article.content.replace(/[#*`]/g, '').slice(0, 150)}...
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{article.viewCount} views</span>
                        <span>Updated {formatRelative(article.updatedAt)}</span>
                      </div>
                    </div>
                    <span className="text-gray-300 ml-4 group-hover:text-[#1a3a5c] text-lg">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
