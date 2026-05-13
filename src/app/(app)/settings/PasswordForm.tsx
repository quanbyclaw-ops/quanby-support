'use client'

import { useState } from 'react'

export default function PasswordForm({ userId }: { userId: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setStatus('error'); setMessage('Passwords do not match'); return }
    if (next.length < 8) { setStatus('error'); setMessage('Password must be at least 8 characters'); return }
    
    setStatus('saving')
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Failed'); return }
      setStatus('success')
      setMessage('Password updated successfully')
      setCurrent(''); setNext(''); setConfirm('')
    } catch {
      setStatus('error')
      setMessage('Network error')
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
      {status === 'success' && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">{message}</div>}
      {status === 'error' && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Current Password</label>
          <input type="password" className="input" value={current} onChange={e => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" value={next} onChange={e => setNext(e.target.value)} required />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" disabled={status === 'saving'}>
          {status === 'saving' ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
