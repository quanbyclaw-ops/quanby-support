import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import AddOrgForm from './AddOrgForm'

export const dynamic = 'force-dynamic'

export default async function OrgsPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { users: true, tickets: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">{orgs.length} organizations</p>
        </div>
        <AddOrgForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map(org => (
          <div key={org.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <div className="text-sm text-gray-500 mt-0.5">/{org.slug}</div>
                {org.domain && <div className="text-xs text-gray-400 mt-0.5">{org.domain}</div>}
              </div>
              <span className={`badge border-0 ${org.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {org.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xl font-bold text-[#1a3a5c]">{org._count.users}</div>
                <div className="text-xs text-gray-500">Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#1a3a5c]">{org._count.tickets}</div>
                <div className="text-xs text-gray-500">Tickets</div>
              </div>
              <div className="text-xs text-gray-400 self-end ml-auto">
                Created {formatDate(org.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
