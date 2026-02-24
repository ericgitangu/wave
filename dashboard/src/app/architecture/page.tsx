import ArchitectureDiagram from '@/components/ArchitectureDiagram'

export const metadata = {
  title: 'Support Automation Architecture | Wave Application',
  description: 'System design proposal for Wave multilingual customer support automation.',
}

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Support Automation Architecture
        </h1>
        <p className="text-muted-foreground">
          A system design proposal for end-to-end voice agent architecture powering
          multilingual customer support across West Africa. Covers ASR, NLU, LLM orchestration,
          and TTS with a focus on low-resource languages and low-latency requirements.
        </p>
      </div>
      <ArchitectureDiagram />
    </div>
  )
}
