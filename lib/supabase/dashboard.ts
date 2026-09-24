import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreatorSaleRecord {
  id: string;
  orderId: string;
  kind: "product" | "custom_service";
  title: string;
  buyerId: string | null;
  buyerName: string;
  grossAmountCents: number;
  platformFeeCents: number;
  creatorAmountCents: number;
  currency: string;
  confirmedAt: string;
}

export interface CreatorSalesPage {
  items: CreatorSaleRecord[];
  totalCount: number;
}

export interface CreatorSalesSummary {
  totalSales: number;
  grossAmountCents: number;
  creatorAmountCents: number;
  productSales: number;
  productCreatorAmountCents: number;
  serviceSales: number;
  serviceCreatorAmountCents: number;
}

export interface CreatorMonthlySales {
  monthStart: string;
  creatorAmountCents: number;
  grossAmountCents: number;
  salesCount: number;
}

export interface CreatorWorkSummary {
  openRequests: number;
  inProduction: number;
  waitingForClient: number;
  awaitingPayment: number;
  nextDeadline:
    | {
        customRequestId: string;
        serviceType: string;
        deliveryDeadlineAt: string;
      }
    | null;
}

interface CreatorSaleRpcRow {
  id: string;
  order_id: string;
  buyer_id: string | null;
  gross_amount_cents: number | string;
  platform_fee_cents: number | string;
  creator_amount_cents: number | string;
  currency: string;
  kind: "product" | "custom_service";
  confirmed_at: string;
  title: string;
  buyer_name: string;
  total_count: number | string;
}

interface CreatorSummaryRpcRow {
  total_sales: number | string;
  gross_amount_cents: number | string;
  creator_amount_cents: number | string;
  product_sales: number | string;
  product_creator_amount_cents: number | string;
  service_sales: number | string;
  service_creator_amount_cents: number | string;
}

interface MonthlyRpcRow {
  month_start: string;
  creator_amount_cents: number | string;
  gross_amount_cents: number | string;
  sales_count: number | string;
}

function mapSale(row: CreatorSaleRpcRow): CreatorSaleRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    kind: row.kind,
    title: row.title,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    grossAmountCents: Number(row.gross_amount_cents),
    platformFeeCents: Number(row.platform_fee_cents),
    creatorAmountCents: Number(row.creator_amount_cents),
    currency: row.currency,
    confirmedAt: row.confirmed_at,
  };
}

export async function listCreatorSalesPage(
  supabase: SupabaseClient,
  {
    kind,
    query,
    limit = 50,
    offset = 0,
  }: {
    kind?: "product" | "custom_service";
    query?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<CreatorSalesPage> {
  const { data, error } = await supabase.rpc("list_my_creator_sales", {
    p_kind: kind ?? null,
    p_query: query?.trim() || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CreatorSaleRpcRow[];
  return {
    items: rows.map(mapSale),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}

export async function listCreatorSales(
  supabase: SupabaseClient,
  _creatorId?: string,
  { limit = 200 }: { limit?: number } = {},
): Promise<CreatorSaleRecord[]> {
  const page = await listCreatorSalesPage(supabase, { limit });
  return page.items;
}

export async function getCreatorSalesSummary(
  supabase: SupabaseClient,
): Promise<CreatorSalesSummary> {
  const { data, error } = await supabase.rpc("get_my_creator_sales_summary").single();
  if (error) throw new Error(error.message);

  const row = data as CreatorSummaryRpcRow;
  return {
    totalSales: Number(row.total_sales),
    grossAmountCents: Number(row.gross_amount_cents),
    creatorAmountCents: Number(row.creator_amount_cents),
    productSales: Number(row.product_sales),
    productCreatorAmountCents: Number(row.product_creator_amount_cents),
    serviceSales: Number(row.service_sales),
    serviceCreatorAmountCents: Number(row.service_creator_amount_cents),
  };
}

export async function getCreatorMonthlySales(
  supabase: SupabaseClient,
  months = 12,
): Promise<CreatorMonthlySales[]> {
  const { data, error } = await supabase.rpc("get_my_creator_monthly_sales", {
    p_months: months,
  });
  if (error) throw new Error(error.message);

  return ((data ?? []) as MonthlyRpcRow[]).map((row) => ({
    monthStart: row.month_start,
    creatorAmountCents: Number(row.creator_amount_cents),
    grossAmountCents: Number(row.gross_amount_cents),
    salesCount: Number(row.sales_count),
  }));
}

export async function getCreatorWorkSummary(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<CreatorWorkSummary> {
  const [requestsResult, ordersResult] = await Promise.all([
    supabase
      .from("custom_requests")
      .select("id, status")
      .eq("creator_id", creatorId)
      .in("status", ["pending", "negotiating", "proposal_sent"]),
    supabase
      .from("custom_service_orders")
      .select("custom_request_id, service_type, delivery_deadline_at, status")
      .eq("creator_id", creatorId)
      .in("status", ["awaiting_payment", "in_progress", "delivered"]),
  ]);

  if (requestsResult.error) throw new Error(requestsResult.error.message);
  if (ordersResult.error) throw new Error(ordersResult.error.message);

  const requests = requestsResult.data ?? [];
  const orders = ordersResult.data ?? [];
  const inProgress = orders.filter((order) => order.status === "in_progress");
  const next = [...inProgress].sort(
    (a, b) =>
      new Date(a.delivery_deadline_at).getTime() - new Date(b.delivery_deadline_at).getTime(),
  )[0];

  return {
    openRequests: requests.length,
    inProduction: inProgress.length,
    waitingForClient: orders.filter((order) => order.status === "delivered").length,
    awaitingPayment: orders.filter((order) => order.status === "awaiting_payment").length,
    nextDeadline: next
      ? {
          customRequestId: next.custom_request_id,
          serviceType: next.service_type,
          deliveryDeadlineAt: next.delivery_deadline_at,
        }
      : null,
  };
}
