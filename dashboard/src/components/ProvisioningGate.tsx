'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CheckCircle2, Loader2, AlertCircle, Server } from 'lucide-react'
import { useProvisioning } from '@/context/provisioning-context'

const STATE_ICON = {
  up: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  starting: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />,
  stopping: <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />,
  down: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
  not_deployed: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />,
}

export default function ProvisioningGate({
  children,
  require,
}: {
  children: React.ReactNode
  require?: string[]
}) {
  const { overall, services, elapsedMinutes, maxMinutes } = useProvisioning()

  // If no specific services required, gate on overall readiness
  const isReady =
    overall === 'ready' ||
    overall === 'partial' ||
    (require &&
      require.every((name) =>
        services.find((s) => s.name === name && s.state === 'up')
      ))

  // Always show content if ready, or during initial load
  if (isReady || overall === 'loading') {
    return <>{children}</>
  }

  // Show loading overlay only during active provisioning
  if (overall === 'provisioning') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex min-h-[60vh] flex-col items-center justify-center gap-6"
        >
          {/* Animated cloud icon */}
          <div className="relative">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cloud className="h-16 w-16 text-blue-500/60" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Server className="h-6 w-6 text-blue-400" />
            </motion.div>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Provisioning Resources
            </h2>
            <p className="text-sm text-muted-foreground">
              Starting AWS services on demand. This may take a moment...
            </p>
          </div>

          {/* Service status list */}
          <div className="w-full max-w-xs space-y-2">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
              >
                <span className="text-xs font-medium text-foreground">
                  {svc.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {STATE_ICON[svc.state]}
                  <span className="text-[10px] capitalize text-muted-foreground">
                    {svc.state === 'not_deployed' ? 'pending deploy' : svc.state}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Timer */}
          {elapsedMinutes > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Session: {elapsedMinutes}/{maxMinutes} min
            </p>
          )}

          {/* Progress bar */}
          <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: '5%' }}
              animate={{ width: '90%' }}
              transition={{ duration: 30, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // If down, show content anyway but with a banner
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-400">
            Some services are unavailable
          </p>
          <p className="text-xs text-muted-foreground">
            Backend services have not been deployed yet. Run{' '}
            <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-[10px]">
              make deploy
            </code>{' '}
            to provision AWS resources.
          </p>
        </div>
      </motion.div>
      {children}
    </div>
  )
}
