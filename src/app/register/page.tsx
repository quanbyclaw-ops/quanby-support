'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Org = { id: string; name: string }

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationId: '',
  })
  const [orgs, setOrgs] = useState<Org[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/organizations/public')
      .then(r => r.json())
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]))
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validatePassword(pw: string) {
    if (pw.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pw)) return 'Password must include at least 1 uppercase letter'
    if (!/\d/.test(pw)) return 'Password must include at least 1 number'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const pwError = validatePassword(form.password)
    if (pwError) { setError(pwError); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setSuccess(true)
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

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted</h2>
              <p className="text-gray-600 text-sm mb-6">
                Registration submitted. An admin will approve your account.
              </p>
              <Link href="/" className="btn-primary justify-center py-2.5 inline-flex w-full">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Create Account</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Juan dela Cruz"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@agency.gov.ph"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="label">Organization</label>
                  <select
                    className="input"
                    value={form.organizationId}
                    onChange={e => set('organizationId', e.target.value)}
                  >
                    <option value="">— Select organization —</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Min. 8 characters, 1 uppercase letter, 1 number
                  </p>
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full justify-center py-2.5"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/" className="text-[#1a3a5c] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2026 Quanby IT Solutions · Government Platform Division
        </p>
      </div>
    </div>
  )
}
