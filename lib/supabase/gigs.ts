import type { SupabaseClient } from "@supabase/supabase-js";
import type { Gig } from "@/lib/types";

/**
 * Gigs (anúncios de serviço "vou fazer X pra você") — aparecem no feed
 * inicial e na busca. Leitura pública só enxerga `status = 'active'` via
 * RLS; o dono também enxerga os próprios pausados (listGigsForCreator).
 * Toda escrita passa pelas RPCs create/update/delete_gig — nunca
 * INSERT/UPDATE/DELETE direto.
 */

interface GigRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  price_cents: number;
  delivery_days: number | null;
  cover_image_url: string | null;
  status: "active" | "paused";
  position: number;
  created_at: string;
}

function mapGig(r: GigRow): Gig {
  return {
    id: r.id,
    creatorId: r.creator_id,
    title: r.title,
    description: r.description,
    priceCents: r.price_cents,
    deliveryDays: r.delivery_days,
    coverImageUrl: r.cover_image_url ?? undefined,
    status: r.status,
    position: r.position,
    createdAt: r.created_at,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export interface GigInput {
  title: string;
  description: string;
  priceCents: number;
  deliveryDays: number | null;
  coverImageUrl: string;
}

/** Feed/busca pública — só gigs ativos, mais recentes primeiro. */
export async function listActiveGigs(
  supabase: SupabaseClient,
  { limit = 20 }: { limit?: number } = {},
): Promise<Gig[]> {
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapGig);
}

/** Busca por texto no título/descrição — usada em /descobrir. */
export async function searchActiveGigs(supabase: SupabaseClient, query: string): Promise<Gig[]> {
  const q = query.trim();
  if (!q) return listActiveGigs(supabase);
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .eq("status", "active")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapGig);
}

/** Painel do criador — inclui os pausados, só o próprio dono enxerga via RLS. */
export async function listGigsForCreator(supabase: SupabaseClient, creatorId: string): Promise<Gig[]> {
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .eq("creator_id", creatorId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapGig);
}

export async function createGig(supabase: SupabaseClient, input: GigInput): Promise<Gig> {
  const { data, error } = await supabase.rpc("create_gig", {
    p_title: input.title,
    p_description: input.description,
    p_price_cents: input.priceCents,
    p_delivery_days: input.deliveryDays,
    p_cover_image_url: input.coverImageUrl,
  });
  return mapGig(unwrap(data, error) as GigRow);
}

export async function updateGig(
  supabase: SupabaseClient,
  id: string,
  input: GigInput & { status: "active" | "paused" },
): Promise<Gig> {
  const { data, error } = await supabase.rpc("update_gig", {
    p_id: id,
    p_title: input.title,
    p_description: input.description,
    p_price_cents: input.priceCents,
    p_delivery_days: input.deliveryDays,
    p_cover_image_url: input.coverImageUrl,
    p_status: input.status,
  });
  return mapGig(unwrap(data, error) as GigRow);
}

export async function deleteGig(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_gig", { p_id: id });
  if (error) throw new Error(error.message);
}
