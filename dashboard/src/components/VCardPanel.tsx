'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Phone,
  Mail,
  Globe,
  FileText,
  Download,
  MessageCircle,
  Smartphone,
  Github,
  Linkedin,
  ContactRound,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Contact data                                                       */
/* ------------------------------------------------------------------ */

const CONTACT = {
  name: 'Eric Gitangu',
  title: 'Senior ML Engineer — LLM & Voice',
  org: 'Wave Application',
  phones: [
    { label: 'Mobile', value: '+254 708 078 997', href: 'tel:+254708078997' },
  ],
  email: 'developer.ericgitangu@gmail.com',
  whatsapp: 'https://wa.me/254708078997',
  links: [
    { label: 'Portfolio', href: 'https://developer.ericgitangu.com', color: 'text-blue-400', hoverBg: 'hover:bg-blue-500/15' },
    { label: 'Resume', href: 'https://resume.ericgitangu.com', color: 'text-purple-400', hoverBg: 'hover:bg-purple-500/15' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ericgitangu', color: 'text-blue-500', hoverBg: 'hover:bg-blue-500/15' },
    { label: 'GitHub', href: 'https://github.com/ericgitangu', color: 'text-white', hoverBg: 'hover:bg-white/10' },
    { label: 'Wave Showcase', href: 'https://wave-apply.ericgitangu.com', color: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/15' },
  ],
}

const LINK_ICONS: Record<string, React.ElementType> = {
  Portfolio: Globe,
  Resume: FileText,
  LinkedIn: Linkedin,
  GitHub: Github,
  'Wave Showcase': ContactRound,
}

/* ------------------------------------------------------------------ */
/*  VCF generator                                                      */
/* ------------------------------------------------------------------ */

function generateVCF(): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${CONTACT.name}`,
    `N:Gitangu;Eric;;;`,
    `TITLE:${CONTACT.title}`,
    `ORG:${CONTACT.org}`,
    `TEL;TYPE=CELL:+254708078997`,
    `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
    `URL:https://developer.ericgitangu.com`,
    `URL:https://resume.ericgitangu.com`,
    `URL:https://linkedin.com/in/ericgitangu`,
    `URL:https://github.com/ericgitangu`,
    `URL:https://wave-apply.ericgitangu.com`,
    `NOTE:Senior ML Engineer - LLM & Voice. Building Africa's voice AI future.`,
    'END:VCARD',
  ].join('\r\n')
}

function downloadVCF() {
  const vcf = generateVCF()
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Eric Gitangu.vcf'
  a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/*  QR Code — slim vCard for reliable scanning                         */
/* ------------------------------------------------------------------ */

function generateQRVCF(): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Eric Gitangu',
    'N:Gitangu;Eric',
    'TEL:+254708078997',
    `EMAIL:${CONTACT.email}`,
    'URL:https://wave-apply.ericgitangu.com',
    'END:VCARD',
  ].join('\n')
}

function VCardQR() {
  const vcf = generateQRVCF()

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl bg-white p-3 shadow-lg">
        <QRCodeSVG
          value={vcf}
          size={180}
          bgColor="#ffffff"
          fgColor="#18181b"
          level="H"
          marginSize={2}
        />
      </div>
      <p className="text-center text-[10px] text-muted-foreground/60">
        Scan to save contact to your phone
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function VCardPanel() {
  const [open, setOpen] = useState(false)

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, handleEscape])

  return (
    <>
      {/* ---- Floating trigger: Desktop (left edge, vertical) ---- */}
      <motion.button
        initial={{ x: -80 }}
        animate={{ x: 0 }}
        transition={{ delay: 1, type: 'spring' as const, stiffness: 200, damping: 20 }}
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex fixed left-0 top-1/2 z-[60] -translate-y-1/2 flex-col items-center gap-2',
          'px-2 py-4 rounded-r-xl',
          'bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30',
          'hover:from-blue-500 hover:to-indigo-600 transition-all hover:shadow-blue-500/50',
          'cursor-pointer'
        )}
      >
        <ContactRound className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-lr]">
          vCard
        </span>
        <span className="text-[8px] text-blue-200 [writing-mode:vertical-lr]">
          Tap to view
        </span>
      </motion.button>

      {/* ---- Floating trigger: Mobile (bottom-left pill) ---- */}
      <motion.button
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, type: 'spring' as const, stiffness: 200, damping: 20 }}
        onClick={() => setOpen(true)}
        className={cn(
          'md:hidden fixed bottom-6 left-4 z-[60] flex items-center gap-2',
          'pl-3 pr-4 py-2.5 rounded-full',
          'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30',
          'hover:shadow-blue-500/50 transition-all',
          'cursor-pointer'
        )}
      >
        <ContactRound className="h-4 w-4" />
        <span className="text-xs font-semibold">vCard</span>
      </motion.button>

      {/* ---- Slide-out Panel ---- */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring' as const, damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 z-[80] h-full w-[min(340px,85vw)] overflow-y-auto border-r border-border/50 bg-gradient-to-b from-card via-card to-background shadow-2xl"
            >
              {/* Header bar */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Virtual Card
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-4">
                {/* Avatar + Name */}
                <div className="space-y-1.5 text-center">
                  <Image
                    src="/eric-profile.png"
                    alt="Eric Gitangu"
                    width={64}
                    height={64}
                    className="mx-auto h-16 w-16 rounded-full object-cover shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/40"
                  />
                  <h2 className="text-lg font-bold text-foreground">{CONTACT.name}</h2>
                  <p className="text-xs font-medium text-blue-400">{CONTACT.title}</p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Quick Actions */}
                <div className="space-y-1.5">
                  <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Quick Actions
                  </p>

                  {CONTACT.phones.map((p) => (
                    <a
                      key={p.value}
                      href={p.href}
                      className="group/link flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-emerald-500/10"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 transition-colors group-hover/link:bg-emerald-500/25">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm text-foreground">{p.value}</p>
                        <p className="text-[10px] text-muted-foreground/60">{p.label}</p>
                      </div>
                    </a>
                  ))}

                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="group/link flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-blue-500/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 transition-colors group-hover/link:bg-blue-500/25">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="break-all text-sm text-foreground">{CONTACT.email}</p>
                      <p className="text-[10px] text-muted-foreground/60">Email</p>
                    </div>
                  </a>

                  <a
                    href={CONTACT.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-green-500/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15 text-green-400 transition-colors group-hover/link:bg-green-500/25">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm text-foreground">WhatsApp</p>
                      <p className="text-[10px] text-muted-foreground/60">Message me</p>
                    </div>
                  </a>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Links */}
                <div className="space-y-1.5">
                  <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Links
                  </p>
                  {CONTACT.links.map((link) => {
                    const LinkIcon = LINK_ICONS[link.label] ?? Globe
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'group/link flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                          link.hoverBg
                        )}
                      >
                        <LinkIcon className={cn('h-4 w-4 text-muted-foreground/50 transition-colors', `group-hover/link:${link.color}`)} />
                        <span className="text-sm text-foreground/80">{link.label}</span>
                      </a>
                    )
                  })}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* QR Code */}
                <div className="space-y-3">
                  <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Scan to Save Contact
                  </p>
                  <VCardQR />
                </div>

                {/* Download button */}
                <button
                  onClick={downloadVCF}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/40"
                >
                  <Download className="h-4 w-4" />
                  Save Contact Card
                </button>

                <p className="pb-4 text-center text-[9px] text-muted-foreground/40">
                  &ldquo;Building Africa&apos;s voice AI future&rdquo;
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
