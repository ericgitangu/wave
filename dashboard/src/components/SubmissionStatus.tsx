'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, ChevronDown, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubmissionData {
  status: 'submitted' | 'pending' | 'processing'
  progress: number
  timestamp: string
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  pending: 'Pending',
  processing: 'Processing',
}

const STATUS_DETAIL: Record<string, string> = {
  submitted:
    'JSON payload with resume and links delivered via POST to Wave\'s secure endpoint. Bearer token authorized. Payload stored for up to 30 days for review.',
  pending:
    'Application queued. The Rust submission handler is validating the JSON payload before transmission.',
  processing:
    'Transmitting the encrypted JSON payload to Wave\'s submission endpoint.',
}

const PIPELINE_STEPS = [
  { label: 'JSON payload generated (resume + links as plain text)', done: true },
  { label: 'Bearer token: wave_KE_ericgitangu', done: true },
  { label: 'POST to https://api.wave.com/submit_resume', done: true },
  { label: 'Payload stored for 30-day review window', done: true },
]

function ProgressRing({
  progress,
  active,
}: {
  progress: number
  active: boolean
}) {
  const radius = 52
  const stroke = 6
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      {active && (
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-blue-500/20"
        />
      )}
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-lg font-semibold text-foreground">
        {progress}%
      </span>
    </div>
  )
}

export default function SubmissionStatus() {
  const [data, setData] = useState<SubmissionData>({
    status: 'submitted',
    progress: 100,
    timestamp: new Date().toISOString(),
  })
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions')
      if (!res.ok) throw new Error('Failed to fetch status')
      const json = await res.json()
      const submissions = Array.isArray(json) ? json : json.submissions ?? []
      const latest = submissions[submissions.length - 1]
      if (latest) {
        setData({
          status: latest.status === 'delivered' ? 'submitted' : latest.status === 'acknowledged' ? 'submitted' : 'pending',
          progress: latest.status === 'delivered' || latest.status === 'acknowledged' ? 100 : 50,
          timestamp: latest.timestamp || json.last_checked || new Date().toISOString(),
        })
      }
      setError(null)
    } catch {
      setError('Could not reach submission API')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const active = data.status === 'processing' || data.status === 'pending'
  const steps = PIPELINE_STEPS.map((s) => ({
    ...s,
    done: data.status === 'submitted' ? s.done : false,
  }))

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
      <ProgressRing progress={data.progress} active={active} />

      <div className="text-center">
        <p
          className={cn(
            'text-sm font-semibold',
            data.status === 'submitted' && 'text-green-400',
            data.status === 'pending' && 'text-amber-400',
            data.status === 'processing' && 'text-blue-400'
          )}
        >
          {STATUS_LABELS[data.status]}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(data.timestamp).toLocaleString()}
        </p>
        {error && (
          <p className="mt-2 text-xs text-amber-500">{error}</p>
        )}
      </div>

      {/* Info toggle — tap-friendly for mobile */}
      <button
        onClick={() => setShowInfo((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-expanded={showInfo}
      >
        <Info className="h-3.5 w-3.5" />
        <span>What does this mean?</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            showInfo && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden"
          >
            <div className="space-y-3 rounded-lg border border-border/50 bg-accent/30 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {STATUS_DETAIL[data.status]}
              </p>

              {/* Pipeline steps */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Submission Pipeline
                </p>
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                    ) : active ? (
                      <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-blue-400" />
                    ) : (
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    )}
                    <span
                      className={cn(
                        'text-xs',
                        step.done ? 'text-foreground' : 'text-muted-foreground/60'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wave's exact submission instructions */}
              <div className="space-y-2 rounded-md border border-border/40 bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Wave&apos;s Submission Instructions
                </p>
                <p className="text-[11px] italic leading-relaxed text-muted-foreground/80">
                  &ldquo;Send a JSON payload with your resume and/or any links as plain text
                  via POST to this secure endpoint:&rdquo;
                </p>
                <div className="space-y-1 font-mono text-[10px] text-muted-foreground/80">
                  <p><span className="text-blue-400">Endpoint:</span> POST https://api.wave.com/submit_resume</p>
                  <p><span className="text-blue-400">Bearer token:</span> wave_ + (country code) + _ + [any characters]</p>
                  <p><span className="text-blue-400">Our token:</span> wave_KE_ericgitangu</p>
                  <p><span className="text-blue-400">Content-Type:</span> application/json</p>
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  Payload stored for up to 30 days for review, then deleted.
                  Built with a coding agent (Claude Code) as encouraged.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
