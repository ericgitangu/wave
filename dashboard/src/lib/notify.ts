import { toast } from 'sonner'

// Haptic vibration patterns for different severity levels
const HAPTIC_PATTERNS: Record<string, number[]> = {
  success: [50],             // gentle tap
  info: [30, 30, 30],       // light triple pulse
  warning: [80, 50, 80],    // medium double pulse
  error: [120, 80, 120, 80, 200], // strong escalating pattern
}

function vibrate(pattern: number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

export function notifySuccess(message: string, description?: string) {
  vibrate(HAPTIC_PATTERNS.success)
  toast.success(message, { description })
}

export function notifyInfo(message: string, description?: string) {
  vibrate(HAPTIC_PATTERNS.info)
  toast.info(message, { description })
}

export function notifyWarning(message: string, description?: string) {
  vibrate(HAPTIC_PATTERNS.warning)
  toast.warning(message, { description })
}

export function notifyError(message: string, description?: string) {
  vibrate(HAPTIC_PATTERNS.error)
  toast.error(message, { description })
}

// Map service status to human-readable toast
export function notifyServiceStatus(service: string, status: string) {
  const label = service.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  switch (status) {
    case 'up':
      notifySuccess(`${label} is operational`)
      break
    case 'degraded':
      notifyWarning(`${label} is degraded`, 'Service is reachable but may have limited functionality')
      break
    case 'down':
      notifyError(`${label} is down`, 'Service is unreachable — check AWS console')
      break
  }
}
