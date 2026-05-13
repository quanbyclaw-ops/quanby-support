'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketStatus, Severity } from '@prisma/client'
import { STATUS_LABELS } from '@/lib/utils'

type Props = {
  ticket: { id: string; status: TicketStatus; severity: Severity; assignedToId: string | null }
  agents: { id: string; name: string }[]
}

export default function TicketActions({ ticket, agents }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(ticket.status)
  const [severity, setSeverity] = useState(ticket.severity)
  const [assignedToId, setAssignedToId] = useState(ticket.assignedToId || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, severity, assignedToId: assignedToId || null }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'PENDING_CLIENT', 'RESOLVED', 'CLOSED']
  const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Manage Ticket</h3>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Status</label>
        <select className="input text-sm" value={status} onChange={e => setStatus(e.target.value as TicketStatus)}>
          {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Severity</label>
        <select className="input text-sm" value={severity} onChange={e => setSeverity(e.target.value as Severity)}>
          {severities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Assigned To</label>
        <select className="input text-sm" value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
          <option value="">— Unassigned —</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full justify-center text-sm">
        {saving ? 'Saving...' : 'Update Ticket'}
      </button>
    </div>
  )
}
