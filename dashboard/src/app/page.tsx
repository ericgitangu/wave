'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Award, GitBranch, Globe, Timer, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SplashBanner from '@/components/SplashBanner'
import ScrollIndicator from '@/components/ScrollIndicator'
import SubmissionStatus from '@/components/SubmissionStatus'
import meta from '@/data/meta.json'

const stats = [
  { label: 'Years Experience', value: '10+', icon: Timer, color: '#1a56db' },
  { label: 'Certifications', value: '80+', icon: Award, color: '#7c3aed' },
  { label: 'Repositories', value: '92', icon: GitBranch, color: '#059669' },
  { label: 'Years in Africa \u{1F1F0}\u{1F1EA}', value: '7', icon: Globe, color: '#d97706' },
  { label: 'Years in the US \u{1F1FA}\u{1F1F8}', value: '13', icon: MapPin, color: '#dc2626' },
]

function CircularStat({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${44 * 2 * Math.PI}`}
            initial={{ strokeDashoffset: 44 * 2 * Math.PI }}
            animate={{ strokeDashoffset: 44 * 2 * Math.PI * 0.15 }}
            transition={{ duration: 1.2, delay: delay + 0.3, ease: 'easeOut' }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <Icon className="mb-1 h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold text-foreground">{value}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground text-center">{label}</span>
    </motion.div>
  )
}

export default function HomePage() {
  return (
    <>
      <SplashBanner />

      <div className="mx-auto max-w-5xl space-y-12">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 pt-4"
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative shrink-0"
            >
              <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-blue-500/30 shadow-lg shadow-blue-500/10 sm:h-36 sm:w-36">
                <Image
                  src="/eric-gitangu.jpg"
                  alt="Eric Gitangu"
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </motion.div>
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {meta.applicant.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {meta.splash.role}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Why Eric for Wave
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              10+ years of full-stack engineering with deep Python, Rust, and TypeScript expertise.
              3 years of focused AI/ML work spanning LLMs, RAG systems, and voice agents.
              7 years building products for African markets including M-PESA integrations,
              solar PAYG platforms, and multilingual applications. 13 years in the US with
              exposure to Silicon Valley engineering culture and best practices.
              Native Swahili speaker with hands-on experience in low-resource language
              environments — the exact challenges Wave faces daily.
            </p>
          </div>
        </motion.section>

        <ScrollIndicator />

        {/* Submission Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SubmissionStatus />
        </motion.section>

        {/* Quick Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="mb-6 text-2xl font-semibold text-foreground">At a Glance</h2>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat, i) => (
              <CircularStat key={stat.label} {...stat} delay={0.5 + i * 0.15} />
            ))}
          </div>
        </motion.section>

        {/* CTAs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap gap-4 pb-8"
        >
          <Button asChild size="lg" className="gap-2">
            <Link href="/alignment">
              View JD Alignment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/projects">
              Explore Projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.section>
      </div>
    </>
  )
}
