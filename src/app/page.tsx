'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const demoUsers = [
    { label: 'Admin', email: 'michael@quanbyai.com', password: 'Admin@2026!' },
    { label: 'Manager', email: 'maria.santos@quanbyit.com', password: 'Agent@2026!' },
    { label: 'Agent', email: 'anna.reyes@quanbyit.com', password: 'Agent@2026!' },
    { label: 'Client (DAP)', email: 'jose.ramos@dap.edu.ph', password: 'Client@2026!' },
    { label: 'Client (PCO)', email: 'lisa.mendoza@pco.gov.ph', password: 'Client@2026!' },
  ]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2440] via-[#1a3a5c] to-[#2a5a8c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4">
            <span className="text-3xl font-black text-[#1a3a5c]">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Quanby Support</h1>
          <p className="text-white/60 text-sm mt-1">IT Solutions Support Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign In</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Demo Accounts</p>
            <div className="space-y-2">
              {demoUsers.map(u => (
                <button
                  key={u.email}
                  onClick={() => { setEmail(u.email); setPassword(u.password) }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                >
                  <span className="font-medium text-gray-900">{u.label}</span>
                  <span className="text-gray-500 ml-2 text-xs">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2026 Quanby IT Solutions · Government Platform Division
        </p>
      </div>
    </div>
  )
}
