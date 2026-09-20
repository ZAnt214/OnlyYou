import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, ProductStatus, ProductType, ProductOrder, ProductOrderStatus } from "@/lib/types";

/**
 * Catálogo real de produtos digitais — substitui o mock de
 * lib/data/products.ts (ver lib/repositories/ProductRepository.ts, agora
 * removido). Leitura pública só enxerga `status = 'approved'` via RLS; o
 * dono também enxerga os próprios rascunhos (listProductsForCreator). Toda
 * escrita passa pelas RPCs create/update/delete_product — nunca
 * INSERT/UPDATE/DELETE direto.
 *
 * `file_url` (o link real do arquivo entregue) nunca entra nas consultas
 * públicas (busca, categoria, perfil, detalhe) — só em
 * listProductsForCreator (o dono precisa editar) e listOwnedProductsForUser
 * (quem comprou precisa baixar). Ver o comentário em lib/types/product.ts.
 */

const PUBLIC_COLUMNS =
  "id, creator_id, title, description, category, tags, type, price_cents, promo_price_cents, cover_image_url, preview_images, status, rating, rating_count, sales_count, created_at";
const FULL_COLUMNS = `${PUBLIC_COLUMNS}, file_url`;

interface ProductRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  type: ProductType;
  price_cents: number;
  promo_price_cents: number | null;
  cover_image_url: string;
  preview_images: string[];
  file_url?: string;
  status: ProductStatus;
  rating: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
}

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    creatorId: r.creator_id,
    title: r.title,
    description: r.description,
    category: r.category,
    tags: r.tags ?? [],
    type: r.type,
    price: r.price_cents / 100,
    promoPrice: r.promo_price_cents !== null ? r.promo_price_cents / 100 : undefined,
    coverImage: r.cover_image_url,
    previewImages: r.preview_images ?? [],
    fileUrl: r.file_url ?? "",
    status: r.status,
    rating: r.rating,
    ratingCount: r.rating_count,
    salesCount: r.sales_count,
    createdAt: r.created_at,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function listApprovedProducts(
  supabase: SupabaseClient,
  { limit = 60 }: { limit?: number } = {},
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

export async function listApprovedProductsByCategory(
  supabase: SupabaseClient,
  categorySlug: string,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("category", categorySlug)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

export async function searchApprovedProducts(supabase: SupabaseClient, query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return listApprovedProducts(supabase);
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

/** Detalhe público de um produto — nunca inclui file_url. */
export async function getPublicProductById(supabase: SupabaseClient, id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select(PUBLIC_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data) : null;
}

/**
 * Produtos de um criador — usados tanto no painel (dono, todos os status,
 * com file_url) quanto no perfil público (RLS restringe quem não é o dono
 * aos aprovados; o componente que consome filtra por status mesmo assim).
 * O dono sempre vê o próprio file_url porque ele mesmo chama isso com o
 * client autenticado; um visitante nunca teria RLS pra ver a linha em
 * primeiro lugar se ela não estiver aprovada.
 */
export async function listProductsForCreator(supabase: SupabaseClient, creatorId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(FULL_COLUMNS)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

export interface ProductInput {
  title: string;
  description: string;
  category: string;
  tags: string[];
  type: ProductType;
  priceCents: number;
  promoPriceCents: number | null;
  coverImageUrl: string;
  previewImages: string[];
  fileUrl: string;
  status: "draft" | "approved";
}

export async function createProduct(supabase: SupabaseClient, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.rpc("create_product", {
    p_title: input.title,
    p_description: input.description,
    p_category: input.category,
    p_tags: input.tags,
    p_type: input.type,
    p_price_cents: input.priceCents,
    p_promo_price_cents: input.promoPriceCents,
    p_cover_image_url: input.coverImageUrl,
    p_preview_images: input.previewImages,
    p_file_url: input.fileUrl,
    p_status: input.status,
  });
  return mapProduct(unwrap(data, error) as ProductRow);
}

export async function updateProduct(supabase: SupabaseClient, id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.rpc("update_product", {
    p_id: id,
    p_title: input.title,
    p_description: input.description,
    p_category: input.category,
    p_tags: input.tags,
    p_type: input.type,
    p_price_cents: input.priceCents,
    p_promo_price_cents: input.promoPriceCents,
    p_cover_image_url: input.coverImageUrl,
    p_preview_images: input.previewImages,
    p_file_url: input.fileUrl,
    p_status: input.status,
  });
  return mapProduct(unwrap(data, error) as ProductRow);
}

export async function deleteProduct(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_product", { p_id: id });
  if (error) throw new Error(error.message);
}

interface ProductOrderRow {
  id: string;
  product_id: string;
  buyer_id: string;
  creator_id: string;
  unit_price_cents: number;
  status: ProductOrderStatus;
  created_at: string;
  paid_at: string | null;
}

function mapProductOrder(o: ProductOrderRow): ProductOrder {
  return {
    id: o.id,
    productId: o.product_id,
    buyerId: o.buyer_id,
    creatorId: o.creator_id,
    unitPriceCents: o.unit_price_cents,
    status: o.status,
    createdAt: o.created_at,
    paidAt: o.paid_at ?? undefined,
  };
}

/** Cria o pedido de compra com o preço já travado — ver create_product_order. */
export async function createProductOrder(supabase: SupabaseClient, productId: string): Promise<ProductOrder> {
  const { data, error } = await supabase.rpc("create_product_order", { p_product_id: productId });
  return mapProductOrder(unwrap(data, error) as ProductOrderRow);
}

export async function getProductOrderById(supabase: SupabaseClient, id: string): Promise<ProductOrder | null> {
  const { data, error } = await supabase.from("product_orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProductOrder(data) : null;
}

/** Se o usuário já tem acesso ativo a este produto (comprou e foi confirmado). */
export async function hasActiveEntitlement(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("product_entitlements")
    .select("id")
    .eq("buyer_id", userId)
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Biblioteca do comprador — produtos com `product_entitlements` ativo,
 * já com file_url de verdade (é a única leitura, além do painel do
 * criador, que inclui essa coluna).
 */
export async function listOwnedProductsForUser(supabase: SupabaseClient, userId: string): Promise<Product[]> {
  const { data: entitlements, error: entitlementsError } = await supabase
    .from("product_entitlements")
    .select("product_id")
    .eq("buyer_id", userId)
    .eq("status", "active");
  if (entitlementsError) throw new Error(entitlementsError.message);

  const productIds = (entitlements ?? []).map((e) => e.product_id);
  if (productIds.length === 0) return [];

  const { data, error } = await supabase.from("products").select(FULL_COLUMNS).in("id", productIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}
