import type { SupabaseClient } from "@supabase/supabase-js";

interface PaymentRow {
  id: string;
  order_id: string;
  buyer_id: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  creator_amount_cents: number;
  currency: string;
  kind: "product" | "custom_service";
  confirmed_at: string | null;
  created_at: string;
}

interface ProductOrderRow {
  id: string;
  product_id: string;
  buyer_id: string;
}

interface ProductTitleRow {
  id: string;
  title: string;
}

interface CustomServiceOrderRow {
  order_id: string;
  custom_request_id: string;
  requester_id: string;
  service_type: string;
}

interface ProfileNameRow {
  id: string;
  display_name: string | null;
  username: string | null;
}

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

/**
 * Vendas reais do criador. A fonte é payment_confirmations com status paid,
 * não o antigo SaleRepository mock. RLS limita a leitura ao comprador/criador
 * da cobrança, então o creatorId aqui funciona também como filtro defensivo.
 */
export async function listCreatorSales(
  supabase: SupabaseClient,
  creatorId: string,
  { limit = 200 }: { limit?: number } = {},
): Promise<CreatorSaleRecord[]> {
  const { data: paymentData, error: paymentError } = await supabase
    .from("payment_confirmations")
    .select(
      "id, order_id, buyer_id, gross_amount_cents, platform_fee_cents, creator_amount_cents, currency, kind, confirmed_at, created_at",
    )
    .eq("creator_id", creatorId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (paymentError) throw new Error(paymentError.message);

  const payments = (paymentData ?? []) as PaymentRow[];
  if (payments.length === 0) return [];

  const productOrderIds = payments.filter((row) => row.kind === "product").map((row) => row.order_id);
  const customOrderIds = payments.filter((row) => row.kind === "custom_service").map((row) => row.order_id);

  const productOrdersPromise =
    productOrderIds.length > 0
      ? supabase.from("product_orders").select("id, product_id, buyer_id").in("id", productOrderIds)
      : Promise.resolve({ data: [], error: null });

  const customOrdersPromise =
    customOrderIds.length > 0
      ? supabase
          .from("custom_service_orders")
          .select("order_id, custom_request_id, requester_id, service_type")
          .in("order_id", customOrderIds)
      : Promise.resolve({ data: [], error: null });

  const [productOrdersResult, customOrdersResult] = await Promise.all([
    productOrdersPromise,
    customOrdersPromise,
  ]);

  if (productOrdersResult.error) throw new Error(productOrdersResult.error.message);
  if (customOrdersResult.error) throw new Error(customOrdersResult.error.message);

  const productOrders = (productOrdersResult.data ?? []) as ProductOrderRow[];
  const customOrders = (customOrdersResult.data ?? []) as CustomServiceOrderRow[];

  const productIds = [...new Set(productOrders.map((row) => row.product_id))];
  const buyerIds = [
    ...new Set(
      [
        ...payments.map((row) => row.buyer_id),
        ...productOrders.map((row) => row.buyer_id),
        ...customOrders.map((row) => row.requester_id),
      ].filter((value): value is string => Boolean(value)),
    ),
  ];

  const productsPromise =
    productIds.length > 0
      ? supabase.from("products").select("id, title").in("id", productIds)
      : Promise.resolve({ data: [], error: null });

  const profilesPromise =
    buyerIds.length > 0
      ? supabase.from("profiles").select("id, display_name, username").in("id", buyerIds)
      : Promise.resolve({ data: [], error: null });

  const [productsResult, profilesResult] = await Promise.all([productsPromise, profilesPromise]);
  if (productsResult.error) throw new Error(productsResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);

  const productByOrder = new Map(productOrders.map((row) => [row.id, row]));
  const customByOrder = new Map(customOrders.map((row) => [row.order_id, row]));
  const productTitleById = new Map(
    ((productsResult.data ?? []) as ProductTitleRow[]).map((row) => [row.id, row.title]),
  );
  const profileById = new Map(
    ((profilesResult.data ?? []) as ProfileNameRow[]).map((row) => [
      row.id,
      row.display_name ?? row.username ?? "Cliente",
    ]),
  );

  return payments.map((payment) => {
    const productOrder = payment.kind === "product" ? productByOrder.get(payment.order_id) : undefined;
    const customOrder =
      payment.kind === "custom_service" ? customByOrder.get(payment.order_id) : undefined;
    const buyerId = payment.buyer_id ?? productOrder?.buyer_id ?? customOrder?.requester_id ?? null;

    return {
      id: payment.id,
      orderId: payment.order_id,
      kind: payment.kind,
      title:
        payment.kind === "product"
          ? productTitleById.get(productOrder?.product_id ?? "") ?? "Produto digital"
          : customOrder?.service_type ?? "Serviço personalizado",
      buyerId,
      buyerName: buyerId ? profileById.get(buyerId) ?? "Cliente" : "Cliente",
      grossAmountCents: payment.gross_amount_cents,
      platformFeeCents: payment.platform_fee_cents,
      creatorAmountCents: payment.creator_amount_cents,
      currency: payment.currency,
      confirmedAt: payment.confirmed_at ?? payment.created_at,
    };
  });
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
