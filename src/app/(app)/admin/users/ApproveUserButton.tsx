'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Action = 'approve' | 'reject' | 'deactivate'

const CONFIG: Record<Action, { label: string; className: string; isActive: boolean | null }> = {
  approve: {
    label: 'Approve',
    className: 'px-2.5 py-1 rounded text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors',
    isActive: true,
  },
  reject: {
    label: 'Reject',
    className: 'px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors',
    isActive: null, // will delete or keep inactive — we just keep isActive: false and let admin manage
  },
  deactivate: {
    label: 'Deactivate',
    className: 'px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors',
    isActive: false,
  },
}

export default function ApproveUserButton({ userId, action }: { userId: string; action: Action }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const cfg = CONFIG[action]

  async function handleClick() {
    if (action === 'reject') {
      if (!confirm('Reject and permanently delete this pending user?')) return
    }
    setLoading(true)
    try {
      if (action === 'reject') {
        // Delete the pending user
        await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: cfg.isActive }),
        })
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={cfg.className}>
      {loading ? '...' : cfg.label}
    </button>
  )
}
