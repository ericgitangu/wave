'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope)

        registration.onupdatefound = () => {
          const installing = registration.installing
          if (!installing) return

          installing.onstatechange = () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('SW update available')
            }
          }
        }
      })
      .catch((err) => {
        console.error('SW registration failed:', err)
      })
  }, [])

  return null
}
