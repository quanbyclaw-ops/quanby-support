'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  ticketId: string
  canSendInternal: boolean
}

export default function ReplyForm({ ticketId, canSendInternal }: Props) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError('')
    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to send reply')
        return
      }
      setContent('')
      setIsInternal(false)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`card p-5 ${isInternal ? 'border-amber-200 bg-amber-50/20' : ''}`}>
      <h3 className="font-semibold text-sm text-gray-900 mb-3">
        {isInternal ? '🔒 Add Internal Note' : '💬 Add Reply'}
      </h3>
      {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className={`input resize-none ${isInternal ? 'border-amber-300 focus:border-amber-400' : ''}`}
          rows={5}
          placeholder={isInternal ? 'Internal note — visible to staff only...' : 'Write your reply...'}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          {canSendInternal && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={e => setIsInternal(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-amber-700 font-medium">Internal note (staff only)</span>
            </label>
          )}
          <div className="flex gap-2 ml-auto">
            <button type="submit" disabled={sending || !content.trim()} className={isInternal ? 'btn-secondary' : 'btn-primary'}>
              {sending ? 'Sending...' : isInternal ? 'Save Note' : 'Send Reply'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
