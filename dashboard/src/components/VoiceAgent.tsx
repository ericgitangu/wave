'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Send, Loader2, Volume2, Globe, Zap, Brain, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceResult {
  language: string
  intent: string
  confidence: number
  latency_ms: number
  response: string
}

const LANG_LABELS: Record<string, { name: string; flag: string; color: string }> = {
  fr: { name: 'French', flag: '🇫🇷', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
  sw: { name: 'Swahili', flag: '🇰🇪', color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30' },
  en: { name: 'English', flag: '🇬🇧', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30' },
}

const INTENT_ICONS: Record<string, { icon: string; label: string }> = {
  check_balance: { icon: '💰', label: 'Check Balance' },
  send_money: { icon: '💸', label: 'Send Money' },
  account_info: { icon: '👤', label: 'Account Info' },
  help: { icon: '❓', label: 'Help' },
  greeting: { icon: '👋', label: 'Greeting' },
  unknown: { icon: '❔', label: 'Unknown' },
}

const EXAMPLES = [
  { text: 'Consulter mon solde', lang: 'French', flag: '🇫🇷' },
  { text: 'Angalia salio langu', lang: 'Swahili', flag: '🇰🇪' },
  { text: 'Send money to John', lang: 'English', flag: '🇬🇧' },
  { text: 'Aidez-moi', lang: 'French', flag: '🇫🇷' },
  { text: 'Habari', lang: 'Swahili', flag: '🇰🇪' },
  { text: 'Check my balance', lang: 'English', flag: '🇬🇧' },
]

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 80 ? 'from-emerald-500 to-green-500' :
    pct >= 50 ? 'from-amber-500 to-yellow-500' :
    'from-red-500 to-orange-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Confidence</span>
        <span className="text-xs font-bold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
        />
      </div>
    </div>
  )
}

const WAVEFORM_HEIGHTS = [28, 24, 32, 20, 26]
const WAVEFORM_DURATIONS = [0.55, 0.48, 0.62, 0.42, 0.58]

function WaveformVisualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px]">
      {WAVEFORM_HEIGHTS.map((h, i) => (
        <motion.div
          key={i}
          animate={active ? {
            height: [8, h, 8],
          } : { height: 8 }}
          transition={active ? {
            duration: WAVEFORM_DURATIONS[i],
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.08,
          } : {}}
          className="w-[3px] rounded-full bg-red-400"
          style={{ height: 8 }}
        />
      ))}
    </div>
  )
}

export default function VoiceAgent() {
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VoiceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ text: string; result: VoiceResult }[]>([])
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

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

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
      setHistory((h) => [{ text: text.trim(), result: data }, ...h].slice(0, 5))
      setInput('')
    } catch {
      setError('Could not reach the voice API. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  const langInfo = result ? LANG_LABELS[result.language] ?? LANG_LABELS.en : null
  const intentInfo = result ? INTENT_ICONS[result.intent] ?? INTENT_ICONS.unknown : null

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card via-card to-card/80 p-6">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[24rem] rounded-full bg-blue-500/[0.04] blur-3xl" />

        <div className="relative space-y-4">
          {/* Mic button + input */}
          <div className="flex items-center gap-3">
            <button
              onClick={listening ? stopListening : startListening}
              className={cn(
                'group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all',
                listening
                  ? 'bg-red-500/20 ring-2 ring-red-500/50'
                  : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-blue-500/30 hover:ring-blue-500/50 hover:from-blue-500/30 hover:to-indigo-500/30'
              )}
            >
              {listening ? (
                <WaveformVisualizer active />
              ) : (
                <Mic className="h-6 w-6 text-blue-400 transition-colors group-hover:text-blue-300" />
              )}

              {/* Pulse ring when listening */}
              {listening && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full ring-2 ring-red-400/40"
                />
              )}
            </button>

            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-4 backdrop-blur-sm focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit(input)}
                placeholder={listening ? 'Listening...' : 'Type or speak a command...'}
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
              <Button
                size="sm"
                onClick={() => submit(input)}
                disabled={loading || !input.trim()}
                className="shrink-0 gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status text */}
          {listening && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-red-400"
            >
              <MicOff className="h-3 w-3" />
              Listening — speak now, tap mic to stop
            </motion.p>
          )}

          {/* Example phrases */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.text}
                onClick={() => {
                  setInput(ex.text)
                  submit(ex.text)
                }}
                className="group flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-foreground"
              >
                <span>{ex.flag}</span>
                <span>{ex.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && langInfo && intentInfo && (
          <motion.div
            key={result.response}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Classification cards */}
            <div className="grid gap-3 sm:grid-cols-4">
              {/* Language */}
              <div className={cn(
                'rounded-xl border bg-gradient-to-br p-4 text-center',
                langInfo.color
              )}>
                <Globe className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Language</p>
                <p className="mt-1 text-lg font-bold">
                  {langInfo.flag} {langInfo.name}
                </p>
              </div>

              {/* Intent */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 text-center">
                <Brain className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Intent</p>
                <p className="mt-1 text-lg font-bold">
                  {intentInfo.icon} {intentInfo.label}
                </p>
              </div>

              {/* Confidence */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-4">
                <Zap className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <ConfidenceBar value={result.confidence} />
              </div>

              {/* Latency */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-4 text-center">
                <Volume2 className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Latency</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {result.latency_ms}<span className="text-sm font-normal text-muted-foreground">ms</span>
                </p>
              </div>
            </div>

            {/* Response bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-400">Wave Agent Response</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{result.response}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Recent
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </div>
          {history.slice(1).map((h, i) => {
            const hLang = LANG_LABELS[h.result.language] ?? LANG_LABELS.en
            const hIntent = INTENT_ICONS[h.result.intent] ?? INTENT_ICONS.unknown
            return (
              <button
                key={i}
                onClick={() => {
                  setInput(h.text)
                  submit(h.text)
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-border/30 bg-card/40 px-3 py-2 text-left transition-colors hover:bg-card/80"
              >
                <span className="text-sm">{hLang.flag}</span>
                <span className="flex-1 truncate text-xs text-muted-foreground">{h.text}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground/50">
                  {hIntent.icon} {Math.round(h.result.confidence * 100)}%
                </span>
              </button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
