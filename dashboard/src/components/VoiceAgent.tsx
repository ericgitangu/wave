'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceResult {
  language: string
  intent: string
  confidence: number
  latency_ms: number
  response: string
}

const EXAMPLES = [
  'Angalia balance yangu',
  'Send money to John',
  'Help me',
]

function ConfidenceRing({ value }: { value: number }) {
  const radius = 24
  const stroke = 4
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - value * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
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
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold">
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

export default function VoiceAgent() {
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VoiceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Web Speech API not supported in this browser.')
      return
    }

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'sw-KE'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      setInput(transcript)
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  async function submit(text: string) {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    const start = performance.now()
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) throw new Error('Voice API error')
      const data: VoiceResult = await res.json()
      data.latency_ms = Math.round(performance.now() - start)
      setResult(data)
    } catch {
      setError('Could not reach the voice API. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(input)}
            placeholder="Type or speak a command..."
            className="h-10 w-full rounded-lg border border-border bg-background px-4 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={listening ? stopListening : startListening}
          className={cn(
            'shrink-0',
            listening && 'border-red-500/50 text-red-400'
          )}
        >
          {listening ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <MicOff className="h-4 w-4" />
            </motion.div>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        <Button
          onClick={() => submit(input)}
          disabled={loading || !input.trim()}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Example phrases */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((phrase) => (
          <button
            key={phrase}
            onClick={() => {
              setInput(phrase)
              submit(phrase)
            }}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-blue-500/40 hover:text-foreground"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid gap-4 sm:grid-cols-4"
          >
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="mb-1 text-xs text-muted-foreground">Language</p>
              <p className="text-sm font-semibold">{result.language}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="mb-1 text-xs text-muted-foreground">Intent</p>
              <p className="text-sm font-semibold">{result.intent}</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs text-muted-foreground">Confidence</p>
              <ConfidenceRing value={result.confidence} />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="mb-1 text-xs text-muted-foreground">Latency</p>
              <p className="text-sm font-semibold">{result.latency_ms}ms</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {result?.response && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="mb-1 text-xs text-muted-foreground">Response</p>
          <p className="text-sm">{result.response}</p>
        </motion.div>
      )}
    </div>
  )
}
