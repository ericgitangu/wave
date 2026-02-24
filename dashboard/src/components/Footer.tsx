'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Github,
  Linkedin,
  Globe,
  FileText,
  Mail,
  Phone,
  MapPin,
  Heart,
  ExternalLink,
} from 'lucide-react'

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/ericgitangu',
    icon: Github,
    color: 'hover:text-white hover:bg-white/10',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/ericgitangu',
    icon: Linkedin,
    color: 'hover:text-blue-400 hover:bg-blue-400/10',
  },
  {
    label: 'Portfolio',
    href: 'https://developer.ericgitangu.com',
    icon: Globe,
    color: 'hover:text-emerald-400 hover:bg-emerald-400/10',
  },
  {
    label: 'Interactive Resume',
    href: 'https://resume.ericgitangu.com',
    icon: FileText,
    color: 'hover:text-purple-400 hover:bg-purple-400/10',
  },
]

const contact = [
  { icon: Mail, value: 'developer.ericgitangu@gmail.com', href: 'mailto:developer.ericgitangu@gmail.com' },
  { icon: Phone, value: '+254 708 078 997', href: 'tel:+254708078997' },
  { icon: MapPin, value: 'Nairobi, Kenya', href: undefined },
]

export default function Footer() {
  return (
    <>
      {/* Separator — decorative gradient divider */}
      <div className="relative mx-auto mt-16 max-w-6xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rotate-45 bg-blue-500/60" />
        </div>
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mt-0 overflow-hidden bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950/80 dark:via-slate-950/50 dark:to-slate-950/80"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-12">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/eric-profile.png"
                  alt="Eric Gitangu"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/30"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Eric Gitangu</p>
                  <p className="text-[11px] text-muted-foreground">Senior ML Engineer — LLM & Voice</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Building Africa&apos;s voice AI future. 10+ years architecting scalable systems
                across fintech, telecom, and enterprise platforms. Passionate about ML systems
                that ship into real products serving millions.
              </p>
            </div>

            {/* Contact column */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact
              </h4>
              <div className="space-y-3">
                {contact.map(({ icon: Icon, value, href }) => (
                  <div key={value} className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {href ? (
                      <a
                        href={href}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Links column */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Connect
              </h4>
              <div className="flex flex-wrap gap-2">
                {socials.map(({ label, href, icon: Icon, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground transition-all ${color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/30 pt-6 sm:flex-row">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              &copy; 2006 &ndash; {new Date().getFullYear()} Eric Gitangu. Built with
              <Heart className="inline h-3 w-3 text-red-400" />
              for Wave.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <a
                href="https://developer.ericgitangu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                developer.ericgitangu.com
              </a>
              <span className="text-border">|</span>
              <a
                href="https://resume.ericgitangu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                resume.ericgitangu.com
              </a>
            </div>
          </div>
        </div>
      </motion.footer>
    </>
  )
}
