import AlignmentMatrix from '@/components/AlignmentMatrix'

export const metadata = {
  title: 'JD Alignment Matrix | Wave Application',
  description: 'Requirement-to-evidence mapping for the Senior ML Engineer (LLM & Voice) role at Wave.',
}

export default function AlignmentPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          JD Alignment Matrix
        </h1>
        <p className="text-muted-foreground">
          Each requirement from the job description mapped to specific evidence, projects,
          and strength level. Required, bonus, and Wave stack competencies are all covered.
        </p>
      </div>
      <AlignmentMatrix />
    </div>
  )
}
