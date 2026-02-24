'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY < 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-2"
        >
          {/* Mouse outline */}
          <div className="relative h-9 w-6 rounded-full border-2 border-muted-foreground/40">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-muted-foreground/60"
            />
          </div>
          <span className="text-xs text-muted-foreground/60">
            Scroll to explore
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
