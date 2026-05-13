'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  orgs: { id: string; name: string }[]
}

export default function AddUserModal({ orgs }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', role: 'CLIENT', organizationId: '', password: 'Welcome@2026!'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create user'); return }
      setOpen(false)
      setForm({ name: '', email: '', role: 'CLIENT', organizationId: '', password: 'Welcome@2026!' })
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ Add User</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New User</h2>
            {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="CLIENT">Client User</option>
                  <option value="AGENT">Support Agent</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Organization</label>
                <select className="input" value={form.organizationId} onChange={e => setForm(f => ({...f, organizationId: e.target.value}))}>
                  <option value="">— None —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Initial Password</label>
                <input className="input" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
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
