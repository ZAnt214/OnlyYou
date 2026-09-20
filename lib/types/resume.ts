/**
 * Item de currículo do criador — formação acadêmica ou certificação.
 * Duas naturezas (`kind`) na mesma tabela porque têm exatamente a mesma
 * forma (título, instituição, período, link opcional). Ver
 * lib/supabase/resume.ts.
 */
export interface ResumeEntry {
  id: string;
  creatorId: string;
  kind: "education" | "certification";
  title: string;
  institution: string;
  /** ISO (YYYY-MM-DD) ou vazio se não informado. */
  startDate: string | null;
  /** Vazio quando `inProgress` é true (ainda cursando/sem data de conclusão). */
  endDate: string | null;
  inProgress: boolean;
  url?: string;
  position: number;
  createdAt: string;
}
