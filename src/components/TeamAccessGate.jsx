import { useState } from 'react'
import { Lock, ArrowLeft, Loader2 } from 'lucide-react'

const SESSION_UNLOCK_KEY = 'csci1380_team_unlocked_v1'

export function isTeamUnlocked() {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true'
}

export default function TeamAccessGate({ onUnlocked, onBackToPublic }) {
  const [pin, setPin] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clean = pin.trim()
    if (!clean || checking) return

    setChecking(true)
    setError('')

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: clean }),
      })

      if (res.ok) {
        sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true')
        onUnlocked()
        return
      }

      // In local Vite dev (/api/verify-pin does not run), allow fallback PIN check
      if (res.status === 404 && import.meta.env.DEV) {
        const localPin = (import.meta.env.VITE_TEAM_PIN || '1380').trim()
        if (clean === localPin) {
          sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true')
          onUnlocked()
          return
        }
      }

      const data = await res.json().catch(() => ({}))
      setError(data?.error || 'Incorrect PIN. Please try again.')
    } catch {
      // Local dev fallback when no serverless runtime is attached
      const localPin = (import.meta.env.VITE_TEAM_PIN || '1380').trim()
      if (import.meta.env.DEV && clean === localPin) {
        sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true')
        onUnlocked()
        return
      }
      setError('Could not verify PIN right now. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="neu-card rounded-2xl p-7 w-full max-w-sm space-y-5">
        <div className="space-y-2 text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl neu-inset flex items-center justify-center text-ink">
            <Lock className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-semibold text-ink">Team Project Area</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            This private section holds the Student Club Member Directory code walkthrough, parser lab, and simulator. Enter the team PIN to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter team PIN"
            autoFocus
            className="neu-inset w-full rounded-xl px-4 py-3 text-center font-mono text-base tracking-[0.35em] text-ink focus:outline-none"
          />

          {error && <div className="state-err rounded-xl px-3.5 py-2.5 text-xs text-center">{error}</div>}

          <button
            type="submit"
            disabled={checking || !pin.trim()}
            className="neu-btn-primary w-full py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock Project Views'}
          </button>
        </form>

        <div className="pt-2 border-t neu-divider text-center">
          <button
            type="button"
            onClick={onBackToPublic}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go to Public Final Exam Review
          </button>
        </div>
      </div>
    </div>
  )
}
