'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'What makes Eric a fit for Wave?',
  'Tell me about the M-PESA Loyalty Engine',
  'What voice AI experience does Eric have?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return

      const userMsg: Message = { role: 'user', content: text.trim() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setStreaming(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg],
          }),
        })

        if (!res.ok) throw new Error('Chat API error')

        // Handle streaming response
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('No response body')

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

        let done = false
        while (!done) {
          const { value, done: streamDone } = await reader.read()
          done = streamDone
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last?.role === 'assistant') {
                last.content += chunk
              }
              return updated
            })
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Sorry, the chat service is unavailable right now. Please try again later.',
          },
        ])
      } finally {
        setStreaming(false)
      }
    },
    [messages, streaming]
  )

  return (
    <>
      {/* Floating action button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setOpen(true)}
              size="icon-lg"
              className="h-12 w-12 rounded-full bg-blue-600 shadow-lg shadow-blue-600/25 hover:bg-blue-500"
            >
              <MessageCircle className="h-5 w-5 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-background/80 shadow-2xl backdrop-blur-xl sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Wave Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  Ask about Eric&apos;s experience
                </p>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {messages.length === 0 && (
                <div className="space-y-2 pt-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Try one of these questions:
                  </p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-blue-500/40 hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none [&_a]:text-blue-400 [&_a]:underline [&_code]:rounded [&_code]:bg-black/20 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:pl-4 [&_p]:my-1 [&_p]:leading-relaxed [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-black/30 [&_pre]:p-2 [&_pre]:text-xs [&_strong]:text-foreground [&_ul]:my-1 [&_ul]:pl-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {streaming && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
                  disabled={streaming}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage(input)}
                  disabled={streaming || !input.trim()}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
