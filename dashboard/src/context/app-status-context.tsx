'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

interface SubmissionAck {
  id: string
  timestamp: string
  status: 'pending' | 'acknowledged' | 'delivered'
  endpoint: string
  name?: string
  email?: string
}

interface SystemHealth {
  dashboard: 'up' | 'down' | 'degraded'
  voice_api: 'up' | 'down' | 'degraded'
  submission: 'up' | 'down' | 'degraded'
  bedrock_claude: 'up' | 'down' | 'degraded'
  bedrock_titan: 'up' | 'down' | 'degraded'
  sagemaker: 'up' | 'down' | 'degraded'
  last_check: string
}

interface AppStatusContextValue {
  health: SystemHealth
  submissions: SubmissionAck[]
  submissionCount: number
  lastAck: SubmissionAck | null
  isPolling: boolean
  refreshNow: () => void
}

const defaultHealth: SystemHealth = {
  dashboard: 'down',
  voice_api: 'down',
  submission: 'down',
  bedrock_claude: 'down',
  bedrock_titan: 'down',
  sagemaker: 'down',
  last_check: new Date().toISOString(),
}

const AppStatusContext = createContext<AppStatusContextValue | undefined>(
  undefined
)

export function AppStatusProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<SystemHealth>(defaultHealth)
  const [submissions, setSubmissions] = useState<SubmissionAck[]>([])
  const [isPolling] = useState(true)

  const pollHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setHealth({
          dashboard: data.dashboard ?? 'up',
          voice_api: data.voice_api ?? 'down',
          submission: data.submission ?? 'down',
          bedrock_claude: data.bedrock_claude ?? 'down',
          bedrock_titan: data.bedrock_titan ?? 'down',
          sagemaker: data.sagemaker ?? 'down',
          last_check: new Date().toISOString(),
        })
      } else {
        setHealth((prev) => ({
          ...prev,
          dashboard: 'degraded',
          last_check: new Date().toISOString(),
        }))
      }
    } catch {
      setHealth((prev) => ({
        ...prev,
        dashboard: 'down',
        last_check: new Date().toISOString(),
      }))
    }
  }, [])

  const pollSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions')
      if (res.ok) {
        const data = await res.json()
        const incoming: SubmissionAck[] = Array.isArray(data)
          ? data
          : data.submissions ?? []

        setSubmissions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id))
          const newEntries = incoming
            .filter((s: SubmissionAck) => !existingIds.has(s.id))
            .map((s: SubmissionAck) => ({
              ...s,
              id: s.id || crypto.randomUUID().slice(0, 8),
              timestamp: s.timestamp || new Date().toISOString(),
              status: s.status || 'pending',
            }))
          if (newEntries.length === 0) return prev
          return [...prev, ...newEntries]
        })
      }
    } catch {
      // Gracefully ignore -- don't crash if the API is unavailable
    }
  }, [])

  const refreshNow = useCallback(() => {
    pollHealth()
    pollSubmissions()
  }, [pollHealth, pollSubmissions])

  useEffect(() => {
    // Use setTimeout(fn, 0) for the initial poll to avoid synchronous
    // setState within the effect body (react-hooks/set-state-in-effect).
    const initialPoll = setTimeout(() => {
      pollHealth()
      pollSubmissions()
    }, 0)

    const healthInterval = setInterval(pollHealth, 30_000)
    const submissionInterval = setInterval(pollSubmissions, 30_000)

    return () => {
      clearTimeout(initialPoll)
      clearInterval(healthInterval)
      clearInterval(submissionInterval)
    }
  }, [pollHealth, pollSubmissions])

  const lastAck =
    submissions.length > 0 ? submissions[submissions.length - 1] : null

  return (
    <AppStatusContext.Provider
      value={{
        health,
        submissions,
        submissionCount: submissions.length,
        lastAck,
        isPolling,
        refreshNow,
      }}
    >
      {children}
    </AppStatusContext.Provider>
  )
}

export function useAppStatus(): AppStatusContextValue {
  const context = useContext(AppStatusContext)
  if (context === undefined) {
    throw new Error('useAppStatus must be used within an AppStatusProvider')
  }
  return context
}
