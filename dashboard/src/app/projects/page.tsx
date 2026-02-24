'use client'

import { motion } from 'framer-motion'
import ProjectCard from '@/components/ProjectCard'
import projectsData from '@/data/projects.json'
import type { Project } from '@/types'

const projects = projectsData.projects as unknown as Project[]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Wave-Relevant Projects
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          A selection of projects demonstrating ML, voice AI, mobile money, and African market expertise.
          Click any card for full details.
        </p>
      </motion.div>

      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {projects.length} Projects
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </motion.div>
    </div>
  )
}
