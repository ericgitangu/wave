import VoiceAgent from '@/components/VoiceAgent'

export const metadata = {
  title: 'Afri-Voice Demo | Wave Application',
  description: 'Multilingual voice agent demo supporting Swahili and English intent classification.',
}

export default function VoiceDemoPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Afri-Voice Demo
        </h1>
        <p className="text-muted-foreground">
          A multilingual voice agent prototype demonstrating intent classification for
          common mobile money operations. Supports both English and Swahili input via
          speech recognition or text entry.
        </p>
      </div>

      <VoiceAgent />

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Supported Commands
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">English</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>&quot;Check my balance&quot;</li>
              <li>&quot;Send money to John&quot;</li>
              <li>&quot;Show my account info&quot;</li>
              <li>&quot;Help me with my account&quot;</li>
              <li>&quot;Hello&quot; / &quot;Hi there&quot;</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Swahili</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>&quot;Angalia salio langu&quot; (Check my balance)</li>
              <li>&quot;Tuma pesa&quot; (Send money)</li>
              <li>&quot;Akaunti yangu&quot; (My account)</li>
              <li>&quot;Nisaidie&quot; (Help me)</li>
              <li>&quot;Habari&quot; (Hello)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
