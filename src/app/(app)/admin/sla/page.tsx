import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SlaConfigForm from './SlaConfigForm'

export const dynamic = 'force-dynamic'

export default async function SlaConfigPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const configs = await prisma.slaConfig.findMany({
    where: { organizationId: null },
    orderBy: { severity: 'asc' },
  })

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const orgConfigs = await prisma.slaConfig.findMany({
    where: { organizationId: { not: null } },
    include: { organization: { select: { name: true } } },
    orderBy: [{ organizationId: 'asc' }, { severity: 'asc' }],
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SLA Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Configure response and resolution time commitments per severity level</p>
      </div>

      {/* Default SLA */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Default SLA (All Organizations)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Severity</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Response Time</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Resolution Time</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">24/7 Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.severity}</td>
                  <td className="px-4 py-3">
                    {c.responseMinutes < 60 ? `${c.responseMinutes}m` : `${Math.floor(c.responseMinutes/60)}h`}
                  </td>
                  <td className="px-4 py-3">
                    {c.resolutionMinutes < 1440 ? `${Math.floor(c.resolutionMinutes/60)}h` : `${Math.floor(c.resolutionMinutes/1440)}d`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge border-0 ${c.is24x7 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.is24x7 ? '24/7' : 'Business Hours'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          Business hours: 9:00 AM – 5:00 PM, Monday–Friday, PHT (UTC+8)
        </div>
      </div>

      {/* SLA Policy Summary */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">SLA Policy (per DAP TOR-02/03)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { severity: 'Critical', response: '1 hour (24/7)', resolution: '24–48 hours', color: 'bg-red-50 border-red-200' },
            { severity: 'High', response: '4 business hours', resolution: '3–5 business days', color: 'bg-orange-50 border-orange-200' },
            { severity: 'Medium', response: '8 business hours', resolution: 'Next minor release', color: 'bg-yellow-50 border-yellow-200' },
            { severity: 'Low', response: '1 business day', resolution: 'Next major release', color: 'bg-blue-50 border-blue-200' },
          ].map(s => (
            <div key={s.severity} className={`rounded-lg border p-4 ${s.color}`}>
              <div className="font-semibold text-gray-900">{s.severity}</div>
              <div className="text-sm text-gray-600 mt-1">First response: <strong>{s.response}</strong></div>
              <div className="text-sm text-gray-600">Resolution: <strong>{s.resolution}</strong></div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Pause Logic */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">SLA Pause & Escalation Rules</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⏸</span>
            <span><strong>SLA Timer Pauses</strong> when ticket status is set to "Pending Client" — timer resumes automatically on status change</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⚠</span>
            <span><strong>Warning at 75%</strong> of SLA window elapsed — ticket highlighted in amber</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">🔴</span>
            <span><strong>SLA Breach at 100%</strong> — ticket flagged, manager notified, escalation triggered</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><strong>First Response SLA</strong> tracked separately — marks when first non-internal staff reply is sent</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
