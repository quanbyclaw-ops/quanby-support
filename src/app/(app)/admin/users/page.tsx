import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RoleBadge } from '@/components/Badge'
import { formatDate } from '@/lib/utils'
import AddUserModal from './AddUserModal'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) redirect('/dashboard')

  const users = await prisma.user.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} users registered</p>
        </div>
        {session.role === 'ADMIN' && <AddUserModal orgs={orgs} />}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Organization</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="table-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white text-sm font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3 text-gray-600">{u.organization?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge border-0 ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
