import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RoleBadge } from '@/components/Badge'
import { formatDate } from '@/lib/utils'
import PasswordForm from './PasswordForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { organization: true },
  })

  if (!user) return null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">Organization</dt>
            <dd className="font-medium">{user.organization?.name || '—'}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">Member Since</dt>
            <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-500">Account Status</dt>
            <dd>
              <span className={`badge border-0 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Password */}
      <PasswordForm userId={user.id} />

      {/* Demo note */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <strong>Demo Mode:</strong> This is a demonstration environment. Profile editing and notification settings are available in production.
      </div>
    </div>
  )
}
