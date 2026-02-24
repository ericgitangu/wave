import ProjectCard from '@/components/ProjectCard'
import projectsData from '@/data/projects.json'
import type { Project } from '@/types'

export const metadata = {
  title: 'Wave-Relevant Projects | Wave Application',
  description: 'Portfolio of projects demonstrating relevant experience for Wave.',
}

const projects = projectsData.projects as unknown as Project[]

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Wave-Relevant Projects
        </h1>
        <p className="text-muted-foreground">
          A selection of projects demonstrating ML, voice AI, mobile money, and African market expertise.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
