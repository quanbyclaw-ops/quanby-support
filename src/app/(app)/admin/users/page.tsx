import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RoleBadge } from '@/components/Badge'
import { formatDate } from '@/lib/utils'
import AddUserModal from './AddUserModal'
import ApproveUserButton from './ApproveUserButton'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await getSession()
  if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) redirect('/dashboard')

  const users = await prisma.user.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: [{ isActive: 'asc' }, { role: 'asc' }, { name: 'asc' }],
  })

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })

  const pendingCount = users.filter(u => !u.isActive).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">{users.length} users registered</p>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {pendingCount} pending approval
              </span>
            )}
          </div>
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
              {session.role === 'ADMIN' && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className={`table-row ${!u.isActive ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${u.isActive ? 'bg-[#1a3a5c]' : 'bg-amber-400'}`}>
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
                  {u.isActive ? (
                    <span className="badge border-0 bg-green-100 text-green-700">Active</span>
                  ) : (
                    <span className="badge border-0 bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pending Approval
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                {session.role === 'ADMIN' && (
                  <td className="px-4 py-3">
                    {!u.isActive ? (
                      <div className="flex items-center gap-2">
                        <ApproveUserButton userId={u.id} action="approve" />
                        <ApproveUserButton userId={u.id} action="reject" />
                      </div>
                    ) : (
                      <ApproveUserButton userId={u.id} action="deactivate" />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
