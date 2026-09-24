import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CustomRequest,
  CustomRequestStatus,
  Conversation,
  ConversationStatus,
  Message,
  MessageType,
  MessageAttachment,
  CustomProposal,
  CustomProposalStatus,
  CustomServiceOrder,
  CustomServiceOrderStatus,
  CustomOrderReview,
  CustomOrderReviewWithReviewer,
  Notification,
  NotificationType,
  Dispute,
  DisputeStatus,
} from "@/lib/types";

/**
 * Camada de acesso ao fluxo real (Supabase) de pedidos personalizados,
 * conversa, propostas e contratação — substitui os repositórios mock
 * client-side (lib/repositories/CustomRequestRepository e afins) que
 * viviam só no localStorage do navegador (ver
 * lib/mock-session/MockSessionProvider.tsx).
 *
 * Toda mutação passa pelas funções RPC do Postgres (migração
 * custom_requests_chat_rpc*), nunca por INSERT/UPDATE direto nestas
 * tabelas — a orquestração multi-tabela (criar pedido + conversa +
 * mensagem + notificação, por exemplo) e a validação de transição de
 * estado vivem no banco, não aqui. Este módulo só mapeia
 * snake_case -> camelCase e chama supabase.rpc(...)/supabase.from(...).
 *
 * Funciona tanto com o client do navegador (lib/supabase/client.ts)
 * quanto com o client de servidor (lib/supabase/server.ts) — quem chama
 * decide qual client passar.
 */

// ===== Row types (snake_case, como o Postgres devolve) =====

interface CustomRequestRow {
  id: string;
  requester_id: string;
  creator_id: string;
  description: string;
  status: CustomRequestStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  cancelled_at: string | null;
  source_gig_id: string | null;
  source_service_request_id: string | null;
}

interface ConversationRow {
  id: string;
  custom_request_id: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  proposal_id: string | null;
  custom_service_order_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

interface MessageAttachmentRow {
  id: string;
  message_id: string;
  custom_request_id: string;
  uploader_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  created_at: string;
}

interface CustomProposalRow {
  id: string;
  custom_request_id: string;
  conversation_id: string;
  creator_id: string;
  requester_id: string;
  service_type: string;
  description: string;
  price_cents: number;
  currency: "BRL";
  delivery_days: number;
  delivery_deadline_at: string | null;
  revision_count: number | null;
  included_items: string[];
  status: CustomProposalStatus;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  expires_at: string | null;
  payment_due_at: string | null;
}

interface CustomServiceOrderRow {
  id: string;
  custom_request_id: string;
  proposal_id: string;
  order_id: string;
  requester_id: string;
  creator_id: string;
  service_type: string;
  description: string;
  agreed_amount_cents: number;
  currency: "BRL";
  delivery_deadline_at: string;
  payment_due_at: string | null;
  status: CustomServiceOrderStatus;
  created_at: string;
  started_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  refunded_at: string | null;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_href: string | null;
  read: boolean;
  created_at: string;
}

interface DisputeRow {
  id: string;
  custom_service_order_id: string;
  custom_request_id: string;
  raised_by: string;
  reason: string;
  status: DisputeStatus;
  created_at: string;
  resolved_at: string | null;
}

// ===== Mappers =====

function mapRequest(r: CustomRequestRow, conversationId: string): CustomRequest {
  return {
    id: r.id,
    requesterId: r.requester_id,
    creatorId: r.creator_id,
    description: r.description,
    status: r.status,
    conversationId,
    sourceGigId: r.source_gig_id ?? undefined,
    sourceServiceRequestId: r.source_service_request_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    expiresAt: r.expires_at ?? undefined,
    acceptedAt: r.accepted_at ?? undefined,
    declinedAt: r.declined_at ?? undefined,
    cancelledAt: r.cancelled_at ?? undefined,
  };
}

function mapConversation(c: ConversationRow): Conversation {
  return {
    id: c.id,
    customRequestId: c.custom_request_id,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lastMessageAt: c.last_message_at,
  };
}

function mapMessage(m: MessageRow): Message {
  const metadata =
    m.proposal_id || m.custom_service_order_id
      ? {
          proposalId: m.proposal_id ?? undefined,
          customServiceOrderId: m.custom_service_order_id ?? undefined,
        }
      : undefined;
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    type: m.type,
    content: m.content,
    createdAt: m.created_at,
    editedAt: m.edited_at ?? undefined,
    deletedAt: m.deleted_at ?? undefined,
    metadata,
  };
}

function mapAttachment(a: MessageAttachmentRow): MessageAttachment {
  return {
    id: a.id,
    messageId: a.message_id,
    customRequestId: a.custom_request_id,
    uploaderId: a.uploader_id,
    fileName: a.file_name,
    mimeType: a.mime_type,
    size: a.size_bytes,
    storageKey: a.storage_key,
    createdAt: a.created_at,
  };
}

function mapProposal(p: CustomProposalRow): CustomProposal {
  return {
    id: p.id,
    customRequestId: p.custom_request_id,
    conversationId: p.conversation_id,
    creatorId: p.creator_id,
    requesterId: p.requester_id,
    serviceType: p.service_type,
    description: p.description,
    priceCents: p.price_cents,
    currency: p.currency,
    deliveryDays: p.delivery_days,
    deliveryDeadlineAt: p.delivery_deadline_at ?? undefined,
    revisionCount: p.revision_count ?? undefined,
    includedItems: p.included_items ?? [],
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    acceptedAt: p.accepted_at ?? undefined,
    rejectedAt: p.rejected_at ?? undefined,
    expiresAt: p.expires_at ?? undefined,
    paymentDueAt: p.payment_due_at ?? undefined,
  };
}

function mapCustomServiceOrder(o: CustomServiceOrderRow): CustomServiceOrder {
  return {
    id: o.id,
    customRequestId: o.custom_request_id,
    proposalId: o.proposal_id,
    orderId: o.order_id,
    requesterId: o.requester_id,
    creatorId: o.creator_id,
    serviceType: o.service_type,
    description: o.description,
    agreedAmountCents: o.agreed_amount_cents,
    currency: o.currency,
    deliveryDeadlineAt: o.delivery_deadline_at,
    paymentDueAt: o.payment_due_at ?? undefined,
    status: o.status,
    createdAt: o.created_at,
    startedAt: o.started_at ?? undefined,
    deliveredAt: o.delivered_at ?? undefined,
    completedAt: o.completed_at ?? undefined,
    refundedAt: o.refunded_at ?? undefined,
  };
}

function mapNotification(n: NotificationRow): Notification {
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body,
    linkHref: n.link_href ?? undefined,
    read: n.read,
    createdAt: n.created_at,
  };
}

function mapDispute(d: DisputeRow): Dispute {
  return {
    id: d.id,
    customServiceOrderId: d.custom_service_order_id,
    customRequestId: d.custom_request_id,
    raisedBy: d.raised_by,
    reason: d.reason,
    status: d.status,
    createdAt: d.created_at,
    resolvedAt: d.resolved_at ?? undefined,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Registro não encontrado.");
  return data;
}

// ===== Leituras =====

export async function listCustomRequestsForRequester(
  supabase: SupabaseClient,
  requesterId: string,
): Promise<CustomRequest[]> {
  const { data, error } = await supabase
    .from("custom_requests")
    .select("*, conversations!inner(id)")
    .eq("requester_id", requesterId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRequest(row, row.conversations[0]?.id ?? row.conversations.id));
}

export async function listCustomRequestsForCreator(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<CustomRequest[]> {
  const { data, error } = await supabase
    .from("custom_requests")
    .select("*, conversations!inner(id)")
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRequest(row, row.conversations[0]?.id ?? row.conversations.id));
}

export async function getCustomRequestById(
  supabase: SupabaseClient,
  requestId: string,
): Promise<CustomRequest | null> {
  const { data, error } = await supabase
    .from("custom_requests")
    .select("*, conversations!inner(id)")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRequest(data, data.conversations[0]?.id ?? data.conversations.id);
}

export async function listMessagesForConversation(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMessage);
}

export async function listProposalsForRequest(
  supabase: SupabaseClient,
  customRequestId: string,
): Promise<CustomProposal[]> {
  const { data, error } = await supabase
    .from("custom_proposals")
    .select("*")
    .eq("custom_request_id", customRequestId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProposal);
}

/**
 * Um pedido pode acumular mais de um `custom_service_order` ao longo do
 * tempo: cada proposta cancelada e re-enviada gera uma nova order (ver
 * cancel_custom_proposal). A mais recente é sempre a relevante pra tela —
 * daí o order+limit(1) em vez de .maybeSingle(), que quebraria com
 * "multiple (or no) rows returned" assim que existisse uma segunda linha.
 */
export async function getCustomServiceOrderByRequest(
  supabase: SupabaseClient,
  customRequestId: string,
): Promise<CustomServiceOrder | null> {
  const { data, error } = await supabase
    .from("custom_service_orders")
    .select("*")
    .eq("custom_request_id", customRequestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCustomServiceOrder(data) : null;
}

export async function getCustomServiceOrderById(
  supabase: SupabaseClient,
  id: string,
): Promise<CustomServiceOrder | null> {
  const { data, error } = await supabase
    .from("custom_service_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCustomServiceOrder(data) : null;
}

export async function listAttachmentsForMessage(
  supabase: SupabaseClient,
  messageId: string,
): Promise<MessageAttachment[]> {
  const { data, error } = await supabase
    .from("message_attachments")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAttachment);
}

export async function listNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapNotification);
}

export async function markNotificationRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Lista todas as conversas para a área de administração — só retorna
 * linhas para quem tem "admin" em profiles.roles (policy is_admin()); para
 * qualquer outro usuário autenticado, RLS restringe às próprias conversas
 * mesmo que este código seja chamado por engano.
 */
export async function listAllConversationsForAdmin(supabase: SupabaseClient): Promise<
  Array<{ conversation: Conversation; request: CustomRequest }>
> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, custom_requests!inner(*)")
    .order("last_message_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    conversation: mapConversation(row),
    request: mapRequest(row.custom_requests, row.id),
  }));
}

export async function listDisputesForOrder(
  supabase: SupabaseClient,
  customServiceOrderId: string,
): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from("disputes")
    .select("*")
    .eq("custom_service_order_id", customServiceOrderId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDispute);
}

// ===== Escritas (sempre via função RPC — ver migração custom_requests_chat_rpc*) =====

export async function createCustomRequest(
  supabase: SupabaseClient,
  params: { creatorId: string; description: string; sourceGigId?: string },
): Promise<CustomRequest> {
  const { data, error } = await supabase.rpc("create_custom_request", {
    p_creator_id: params.creatorId,
    p_description: params.description,
    p_source_gig_id: params.sourceGigId ?? null,
  });
  const row = unwrap(data, error) as CustomRequestRow;
  const conversation = await getConversationRowByRequest(supabase, row.id);
  return mapRequest(row, conversation.id);
}

async function getConversationRowByRequest(supabase: SupabaseClient, customRequestId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("custom_request_id", customRequestId)
    .single();
  return unwrap(data, error) as ConversationRow;
}

export async function sendCustomMessage(
  supabase: SupabaseClient,
  params: { conversationId: string; content: string },
): Promise<Message> {
  const { data, error } = await supabase.rpc("send_custom_message", {
    p_conversation_id: params.conversationId,
    p_content: params.content,
  });
  return mapMessage(unwrap(data, error) as MessageRow);
}

export async function softDeleteCustomMessage(supabase: SupabaseClient, messageId: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_custom_message", { p_message_id: messageId });
  if (error) throw new Error(error.message);
}

/** Reverte softDeleteCustomMessage — só quem enviou pode mostrar de novo. */
export async function unhideCustomMessage(supabase: SupabaseClient, messageId: string): Promise<void> {
  const { error } = await supabase.rpc("unhide_custom_message", { p_message_id: messageId });
  if (error) throw new Error(error.message);
}

export async function createCustomProposal(
  supabase: SupabaseClient,
  params: {
    customRequestId: string;
    serviceType: string;
    description: string;
    priceCents: number;
    deliveryDays: number;
    revisionCount?: number | null;
    includedItems?: string[];
  },
): Promise<CustomProposal> {
  const { data, error } = await supabase.rpc("create_custom_proposal", {
    p_custom_request_id: params.customRequestId,
    p_service_type: params.serviceType,
    p_description: params.description,
    p_price_cents: params.priceCents,
    p_delivery_days: params.deliveryDays,
    p_revision_count: params.revisionCount ?? null,
    p_included_items: params.includedItems ?? [],
  });
  return mapProposal(unwrap(data, error) as CustomProposalRow);
}

export async function acceptCustomProposal(supabase: SupabaseClient, proposalId: string): Promise<CustomProposal> {
  const { data, error } = await supabase.rpc("accept_custom_proposal", { p_proposal_id: proposalId });
  return mapProposal(unwrap(data, error) as CustomProposalRow);
}

export async function rejectCustomProposal(supabase: SupabaseClient, proposalId: string): Promise<CustomProposal> {
  const { data, error } = await supabase.rpc("reject_custom_proposal", { p_proposal_id: proposalId });
  return mapProposal(unwrap(data, error) as CustomProposalRow);
}

/**
 * Criador retira uma proposta que ainda não foi paga. Diferente das outras
 * mutações desta tabela, isso NÃO chama a RPC direto do navegador: passa
 * por /api/mercadopago/cancel-proposal (server-only) porque, se já existe um
 * Pix pendente, ele é uma cobrança de verdade no Mercado Pago — cancelar só
 * no nosso banco deixaria o código ainda pagável. A rota confere o status
 * real antes de cancelar (cobre o comprador pagar no instante do
 * cancelamento) e só então chama esta mesma RPC no servidor.
 */
export async function cancelCustomProposal(proposalId: string): Promise<CustomProposal> {
  const res = await fetch("/api/mercadopago/cancel-proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível cancelar a proposta.");
  return mapProposal(data.proposal as CustomProposalRow);
}

/**
 * Materializa a expiração de uma proposta aceita e não paga no prazo. Não há
 * cron: quem abre a conversa depois do prazo é quem dispara isso. Idempotente
 * — chamar antes do prazo (ou de novo depois) não muda nada.
 */
export async function expireUnpaidCustomProposal(
  supabase: SupabaseClient,
  proposalId: string,
): Promise<CustomProposal> {
  const { data, error } = await supabase.rpc("expire_unpaid_custom_proposal", {
    p_proposal_id: proposalId,
  });
  return mapProposal(unwrap(data, error) as CustomProposalRow);
}

export async function createCustomServiceOrder(
  supabase: SupabaseClient,
  proposalId: string,
): Promise<CustomServiceOrder> {
  const { data, error } = await supabase.rpc("create_custom_service_order", { p_proposal_id: proposalId });
  return mapCustomServiceOrder(unwrap(data, error) as CustomServiceOrderRow);
}

export interface CustomAttachmentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

export async function sendCustomAttachment(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    customServiceOrderId: string;
    content: string;
    attachments: CustomAttachmentInput[];
  },
): Promise<Message> {
  const { data, error } = await supabase.rpc("send_custom_attachment", {
    p_conversation_id: params.conversationId,
    p_custom_service_order_id: params.customServiceOrderId,
    p_content: params.content,
    p_attachments: params.attachments.map((a) => ({
      file_name: a.fileName,
      mime_type: a.mimeType,
      size_bytes: a.sizeBytes,
      storage_key: a.storageKey,
    })),
  });
  return mapMessage(unwrap(data, error) as MessageRow);
}

export async function finalizeCustomDelivery(
  supabase: SupabaseClient,
  customServiceOrderId: string,
): Promise<CustomServiceOrder> {
  const { data, error } = await supabase.rpc("finalize_custom_delivery", {
    p_custom_service_order_id: customServiceOrderId,
  });
  return mapCustomServiceOrder(unwrap(data, error) as CustomServiceOrderRow);
}

export async function sendCustomDelivery(
  supabase: SupabaseClient,
  customServiceOrderId: string,
  attachments: CustomAttachmentInput[],
): Promise<CustomServiceOrder> {
  const { data, error } = await supabase.rpc("send_custom_delivery", {
    p_custom_service_order_id: customServiceOrderId,
    p_attachments: attachments.map((a) => ({
      file_name: a.fileName,
      mime_type: a.mimeType,
      size_bytes: a.sizeBytes,
      storage_key: a.storageKey,
    })),
  });
  return mapCustomServiceOrder(unwrap(data, error) as CustomServiceOrderRow);
}

export async function confirmCustomReceipt(
  supabase: SupabaseClient,
  customServiceOrderId: string,
): Promise<CustomServiceOrder> {
  const { data, error } = await supabase.rpc("confirm_custom_receipt", {
    p_custom_service_order_id: customServiceOrderId,
  });
  return mapCustomServiceOrder(unwrap(data, error) as CustomServiceOrderRow);
}

export async function reportCustomOrderProblem(
  supabase: SupabaseClient,
  customServiceOrderId: string,
  reason: string,
): Promise<CustomServiceOrder> {
  const { data, error } = await supabase.rpc("report_custom_order_problem", {
    p_custom_service_order_id: customServiceOrderId,
    p_reason: reason,
  });
  return mapCustomServiceOrder(unwrap(data, error) as CustomServiceOrderRow);
}

interface CustomOrderReviewRow {
  id: string;
  custom_service_order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

function mapCustomOrderReview(r: CustomOrderReviewRow): CustomOrderReview {
  return {
    id: r.id,
    customServiceOrderId: r.custom_service_order_id,
    reviewerId: r.reviewer_id,
    revieweeId: r.reviewee_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  };
}

/** As duas avaliações (se existirem) de um pedido — a própria e a do outro lado. */
export async function listCustomOrderReviews(
  supabase: SupabaseClient,
  customServiceOrderId: string,
): Promise<CustomOrderReview[]> {
  const { data, error } = await supabase
    .from("custom_order_reviews")
    .select("*")
    .eq("custom_service_order_id", customServiceOrderId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCustomOrderReview);
}

interface CustomOrderReviewWithReviewerRow extends CustomOrderReviewRow {
  reviewer: { display_name: string | null; username: string | null } | null;
}

/**
 * Avaliações recebidas por um usuário (criador ou comprador), com nome de
 * quem avaliou — é o que aparece publicamente no perfil (RLS de
 * custom_order_reviews é pública para leitura, ver migração
 * custom_order_reviews_public_and_profile_rating).
 */
export async function listCustomOrderReviewsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<CustomOrderReviewWithReviewer[]> {
  const { data, error } = await supabase
    .from("custom_order_reviews")
    .select(
      "id, custom_service_order_id, reviewer_id, reviewee_id, rating, comment, created_at, reviewer:profiles!custom_order_reviews_reviewer_id_fkey(display_name, username)",
    )
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as CustomOrderReviewWithReviewerRow[]).map((r) => ({
    ...mapCustomOrderReview(r),
    reviewerName: r.reviewer?.display_name ?? r.reviewer?.username ?? "Usuário",
  }));
}

export async function submitCustomOrderReview(
  supabase: SupabaseClient,
  customServiceOrderId: string,
  rating: number,
  comment: string,
): Promise<CustomOrderReview> {
  const { data, error } = await supabase.rpc("submit_custom_order_review", {
    p_custom_service_order_id: customServiceOrderId,
    p_rating: rating,
    p_comment: comment,
  });
  return mapCustomOrderReview(unwrap(data, error) as CustomOrderReviewRow);
}
