'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'System Access', 'Bug Report', 'Performance', 'Account Management',
  'Infrastructure', 'Integration', 'Training', 'Feature Request', 'Other',
]

export default function NewTicketPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    category: 'Bug Report',
    organizationId: '',
  })

  useEffect(() => {
    fetch('/api/organizations').then(r => r.json()).then(setOrgs)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create ticket'); return }
      router.push(`/tickets/${data.id}`)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const severityInfo: Record<string, { label: string; desc: string; color: string }> = {
    CRITICAL: { label: 'Critical', desc: 'System down, blocking all users', color: 'border-red-300 bg-red-50' },
    HIGH: { label: 'High', desc: 'Major feature broken, significant impact', color: 'border-orange-300 bg-orange-50' },
    MEDIUM: { label: 'Medium', desc: 'Feature degraded, workaround available', color: 'border-yellow-300 bg-yellow-50' },
    LOW: { label: 'Low', desc: 'Minor issue or enhancement request', color: 'border-blue-300 bg-blue-50' },
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit New Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Provide details about your issue for faster resolution</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Severity */}
        <div className="card p-5">
          <label className="label">Severity Level <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {Object.entries(severityInfo).map(([key, info]) => (
              <label
                key={key}
                className={`relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  form.severity === key ? info.color + ' border-current' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={key}
                  checked={form.severity === key}
                  onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium text-sm text-gray-900">{info.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{info.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input
              className="input"
              placeholder="Brief description of the issue"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select
              className="input"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {orgs.length > 1 && (
            <div>
              <label className="label">Organization</label>
              <select
                className="input"
                value={form.organizationId}
                onChange={e => setForm(f => ({ ...f, organizationId: e.target.value }))}
              >
                <option value="">— Your organization —</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea
              className="input resize-none"
              rows={8}
              placeholder={`Please include:
• Steps to reproduce the issue
• Expected vs actual behavior
• Browser and operating system used
• Number of users affected
• Any error messages seen`}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* SLA Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="font-medium text-blue-900 mb-2">SLA Commitment for {severityInfo[form.severity]?.label} severity:</div>
          {form.severity === 'CRITICAL' && (
            <div className="text-blue-700">First response within <strong>1 hour (24/7)</strong> · Resolution within <strong>24–48 hours</strong></div>
          )}
          {form.severity === 'HIGH' && (
            <div className="text-blue-700">First response within <strong>4 business hours</strong> · Resolution within <strong>3–5 business days</strong></div>
          )}
          {form.severity === 'MEDIUM' && (
            <div className="text-blue-700">First response within <strong>8 business hours</strong> · Resolution in <strong>next minor release</strong></div>
          )}
          {form.severity === 'LOW' && (
            <div className="text-blue-700">First response within <strong>1 business day</strong> · Resolution in <strong>next major release</strong></div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
