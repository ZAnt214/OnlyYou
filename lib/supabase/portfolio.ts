import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioItem } from "@/lib/types";

/**
 * Portfólio de trabalhos já realizados, exibido no perfil público do
 * criador. Leitura é pública (RLS); escrita passa pelas RPCs
 * create/update/delete_portfolio_item (ver migração
 * creator_portfolio_items) — nunca INSERT/UPDATE/DELETE direto.
 */

interface PortfolioItemRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  external_url: string | null;
  image_url: string | null;
  content: string;
  gallery_urls: string[];
  position: number;
  created_at: string;
}

function mapPortfolioItem(r: PortfolioItemRow): PortfolioItem {
  return {
    id: r.id,
    creatorId: r.creator_id,
    title: r.title,
    description: r.description,
    externalUrl: r.external_url ?? undefined,
    imageUrl: r.image_url ?? undefined,
    content: r.content,
    galleryUrls: r.gallery_urls ?? [],
    position: r.position,
    createdAt: r.created_at,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export interface PortfolioItemInput {
  title: string;
  description: string;
  externalUrl: string;
  imageUrl: string;
  content: string;
  galleryUrls: string[];
}

export async function listPortfolioForCreator(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("creator_id", creatorId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPortfolioItem);
}

export async function createPortfolioItem(
  supabase: SupabaseClient,
  input: PortfolioItemInput,
): Promise<PortfolioItem> {
  const { data, error } = await supabase.rpc("create_portfolio_item", {
    p_title: input.title,
    p_description: input.description,
    p_external_url: input.externalUrl,
    p_image_url: input.imageUrl,
    p_content: input.content,
    p_gallery_urls: input.galleryUrls,
  });
  return mapPortfolioItem(unwrap(data, error) as PortfolioItemRow);
}

export async function updatePortfolioItem(
  supabase: SupabaseClient,
  id: string,
  input: PortfolioItemInput,
): Promise<PortfolioItem> {
  const { data, error } = await supabase.rpc("update_portfolio_item", {
    p_id: id,
    p_title: input.title,
    p_description: input.description,
    p_external_url: input.externalUrl,
    p_image_url: input.imageUrl,
    p_content: input.content,
    p_gallery_urls: input.galleryUrls,
  });
  return mapPortfolioItem(unwrap(data, error) as PortfolioItemRow);
}

export async function deletePortfolioItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_portfolio_item", { p_id: id });
  if (error) throw new Error(error.message);
}
