'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddOrgForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', domain: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setOpen(false)
      setForm({ name: '', slug: '', domain: '' })
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ Add Organization</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Organization</h2>
            {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Organization Name</label>
                <input className="input" placeholder="e.g. Department of Finance" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}))} required />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input" placeholder="e.g. dof" value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Domain (optional)</label>
                <input className="input" placeholder="e.g. dof.gov.ph" value={form.domain} onChange={e => setForm(f => ({...f, domain: e.target.value}))} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
