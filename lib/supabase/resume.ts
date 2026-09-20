import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResumeEntry } from "@/lib/types";

/**
 * Currículo do criador (formação e certificações), exibido no perfil
 * público. Leitura é pública (RLS); escrita passa pelas RPCs
 * create/update/delete_resume_entry — nunca INSERT/UPDATE/DELETE direto.
 * Skills e idiomas não vivem aqui: são colunas simples em `profiles`
 * (`skills`, `languages`), atualizadas por update_creator_skills/
 * update_creator_languages — ver lib/supabase/profile.ts para a leitura.
 */

interface ResumeEntryRow {
  id: string;
  creator_id: string;
  kind: "education" | "certification";
  title: string;
  institution: string;
  start_date: string | null;
  end_date: string | null;
  in_progress: boolean;
  url: string | null;
  position: number;
  created_at: string;
}

function mapResumeEntry(r: ResumeEntryRow): ResumeEntry {
  return {
    id: r.id,
    creatorId: r.creator_id,
    kind: r.kind,
    title: r.title,
    institution: r.institution,
    startDate: r.start_date,
    endDate: r.end_date,
    inProgress: r.in_progress,
    url: r.url ?? undefined,
    position: r.position,
    createdAt: r.created_at,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export interface ResumeEntryInput {
  kind: "education" | "certification";
  title: string;
  institution: string;
  startDate: string;
  endDate: string;
  inProgress: boolean;
  url: string;
}

export async function listResumeForCreator(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<ResumeEntry[]> {
  const { data, error } = await supabase
    .from("resume_entries")
    .select("*")
    .eq("creator_id", creatorId)
    .order("kind", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapResumeEntry);
}

export async function createResumeEntry(
  supabase: SupabaseClient,
  input: ResumeEntryInput,
): Promise<ResumeEntry> {
  const { data, error } = await supabase.rpc("create_resume_entry", {
    p_kind: input.kind,
    p_title: input.title,
    p_institution: input.institution,
    p_start_date: input.startDate || null,
    p_end_date: input.endDate || null,
    p_in_progress: input.inProgress,
    p_url: input.url,
  });
  return mapResumeEntry(unwrap(data, error) as ResumeEntryRow);
}

export async function updateResumeEntry(
  supabase: SupabaseClient,
  id: string,
  input: Omit<ResumeEntryInput, "kind">,
): Promise<ResumeEntry> {
  const { data, error } = await supabase.rpc("update_resume_entry", {
    p_id: id,
    p_title: input.title,
    p_institution: input.institution,
    p_start_date: input.startDate || null,
    p_end_date: input.endDate || null,
    p_in_progress: input.inProgress,
    p_url: input.url,
  });
  return mapResumeEntry(unwrap(data, error) as ResumeEntryRow);
}

export async function deleteResumeEntry(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_resume_entry", { p_id: id });
  if (error) throw new Error(error.message);
}

export async function updateCreatorSkills(supabase: SupabaseClient, skills: string[]): Promise<void> {
  const { error } = await supabase.rpc("update_creator_skills", { p_skills: skills });
  if (error) throw new Error(error.message);
}

export async function updateCreatorLanguages(supabase: SupabaseClient, languages: string[]): Promise<void> {
  const { error } = await supabase.rpc("update_creator_languages", { p_languages: languages });
  if (error) throw new Error(error.message);
}
