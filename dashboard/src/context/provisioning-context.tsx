'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

type ServiceState = 'up' | 'starting' | 'stopping' | 'down' | 'not_deployed'

interface ServiceStatus {
  name: string
  state: ServiceState
}

interface ProvisioningState {
  overall: 'ready' | 'provisioning' | 'partial' | 'down' | 'loading'
  services: ServiceStatus[]
  startedAt: string | null
  elapsedMinutes: number
  maxMinutes: number
  triggerStart: () => void
  triggerStop: () => void
}

const ProvisioningContext = createContext<ProvisioningState | undefined>(undefined)

const MAX_MINUTES = 59

export function ProvisioningProvider({ children }: { children: ReactNode }) {
  const [overall, setOverall] = useState<ProvisioningState['overall']>('loading')
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [elapsedMinutes, setElapsedMinutes] = useState(0)

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/provision')
      if (res.ok) {
        const data = await res.json()
        setOverall(data.overall)
        setServices(data.services ?? [])
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }, [])

  const triggerStart = useCallback(async () => {
    setOverall('provisioning')
    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })
      if (res.ok) {
        const data = await res.json()
        setStartedAt(data.started_at ?? new Date().toISOString())
        setOverall(data.overall)
        setServices(data.services ?? [])
      }
    } catch {
      setOverall('down')
    }
  }, [])

  const triggerStop = useCallback(async () => {
    try {
      await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
      setOverall('down')
      setStartedAt(null)
    } catch {
      // Best-effort stop
    }
  }, [])

  // Poll status on mount (don't auto-start — only start when user requests it)
  useEffect(() => {
    const init = setTimeout(() => {
      pollStatus()
    }, 500)
    return () => clearTimeout(init)
  }, [pollStatus])

  // Poll status every 15s
  useEffect(() => {
    const interval = setInterval(pollStatus, 15_000)
    return () => clearInterval(interval)
  }, [pollStatus])

  // Track elapsed time and auto-stop at MAX_MINUTES
  useEffect(() => {
    if (!startedAt) return

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 60_000
      )
      setElapsedMinutes(elapsed)

      if (elapsed >= MAX_MINUTES) {
        triggerStop()
      }
    }, 30_000)

    return () => clearInterval(interval)
  }, [startedAt, triggerStop])

  // Auto-stop on page unload
  useEffect(() => {
    const handleUnload = () => {
      // Use sendBeacon for reliable fire-and-forget on unload
      navigator.sendBeacon(
        '/api/provision',
        new Blob(
          [JSON.stringify({ action: 'stop' })],
          { type: 'application/json' }
        )
      )
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  return (
    <ProvisioningContext.Provider
      value={{
        overall,
        services,
        startedAt,
        elapsedMinutes,
        maxMinutes: MAX_MINUTES,
        triggerStart,
        triggerStop,
      }}
    >
      {children}
    </ProvisioningContext.Provider>
  )
}

export function useProvisioning(): ProvisioningState {
  const context = useContext(ProvisioningContext)
  if (!context) {
    throw new Error('useProvisioning must be used within a ProvisioningProvider')
  }
  return context
}
