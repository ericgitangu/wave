// Types driven from meta.json structure
export interface AppMeta {
  app: { name: string; short_name: string; description: string; url: string; theme_color: string; background_color: string };
  seo: { title: string; og_description: string; keywords: string[]; author: string; twitter: string };
  splash: { headline: string; role: string; highlights: SplashHighlight[]; cta: string };
  applicant: { name: string; email: string; phone: string; location: string; github: string; linkedin: string; portfolio: string; resume: string };
}

export interface SplashHighlight {
  icon: string;
  title: string;
  description: string;
}

export interface AlignmentRequirement {
  category: string;
  requirement: string;
  evidence: string;
  strength: 'exceptional' | 'strong' | 'moderate';
  projects: string[];
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  relevance: string[];
  tech: string[];
  url?: string;
  github?: string;
  highlights: string[];
  metrics: Record<string, string>;
}

export interface ArchitectureData {
  title: string;
  description: string;
  diagram: string;
  components: { name: string; tech: string; note: string }[];
  design_decisions: { decision: string; rationale: string }[];
}
