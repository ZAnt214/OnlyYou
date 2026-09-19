"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Send,
  Paperclip,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Flag,
  Ban,
  Clock,
  PlusCircle,
  Loader2,
  Star,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getCustomRequestById,
  listMessagesForConversation,
  listProposalsForRequest,
  getCustomServiceOrderByRequest,
  listAttachmentsForMessage,
  sendCustomMessage,
  softDeleteCustomMessage,
  createCustomProposal,
  acceptCustomProposal,
  rejectCustomProposal,
  cancelCustomProposal,
  expireUnpaidCustomProposal,
  createCustomServiceOrder,
  sendCustomDelivery,
  confirmCustomReceipt,
  reportCustomOrderProblem,
  listCustomOrderReviews,
  submitCustomOrderReview,
} from "@/lib/supabase/customRequests";
import { reportService } from "@/lib/moderation/ReportService";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { PixCheckoutPanel } from "@/components/payments/PixCheckoutPanel";
import { CustomOrderReviewModal } from "@/components/CustomOrderReviewModal";
import {
  REPORT_REASON_LABELS,
  type ReportReason,
  type Message,
  type MessageAttachment,
  type CustomProposal,
  type CustomRequest,
  type Conversation,
  type CustomServiceOrder,
  type CustomOrderReview,
} from "@/lib/types";

/** Pedido já passou pela entrega — ponto em que a avaliação mútua faz sentido. */
function isReviewable(status: CustomServiceOrder["status"]): boolean {
  return status === "delivered" || status === "completed";
}

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ConversationView({
  customRequestId,
  actingUserId,
  backHref,
}: {
  customRequestId: string;
  actingUserId: string | null;
  /** Para onde o botão de voltar do cabeçalho leva — a tela abre em tela cheia. */
  backHref: string;
}) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<CustomProposal[]>([]);
  const [customServiceOrder, setCustomServiceOrder] = useState<CustomServiceOrder | null>(null);
  const [counterpartName, setCounterpartName] = useState("Usuário");
  const [counterpartUsername, setCounterpartUsername] = useState<string | null>(null);
  const [counterpartRating, setCounterpartRating] = useState(0);
  const [counterpartRatingCount, setCounterpartRatingCount] = useState(0);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<Record<string, MessageAttachment[]>>({});

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalDraft, setProposalDraft] = useState({
    serviceType: "",
    description: "",
    price: "",
    deliveryDays: "",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [problemReason, setProblemReason] = useState("");
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [deliveryFileName, setDeliveryFileName] = useState("");
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  // O painel de Pix só aparece depois de um clique explícito — senão ele
  // reabriria sozinho a cada visita à conversa enquanto o pedido estiver
  // aguardando pagamento.
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const [myReview, setMyReview] = useState<CustomOrderReview | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  // O modal de avaliação abre sozinho uma vez quando o pedido vira
  // entregue — não a cada load() (disparado por toda mensagem nova via
  // realtime), senão reabriria repetidamente enquanto a pessoa conversa.
  const autoReviewPromptShownRef = useRef(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!actingUserId) return;
    try {
      const req = await getCustomRequestById(supabase, customRequestId);
      if (!req) throw new Error("Pedido não encontrado.");
      if (req.requesterId !== actingUserId && req.creatorId !== actingUserId) {
        throw new Error("Usuário não tem permissão para acessar este pedido.");
      }

      const { data: convoRow } = await supabase
        .from("conversations")
        .select("*")
        .eq("custom_request_id", req.id)
        .single();
      if (!convoRow) throw new Error("Conversa não encontrada.");
      const convo: Conversation = {
        id: convoRow.id,
        customRequestId: convoRow.custom_request_id,
        status: convoRow.status,
        createdAt: convoRow.created_at,
        updatedAt: convoRow.updated_at,
        lastMessageAt: convoRow.last_message_at,
      };

      let [msgs, props, cso] = await Promise.all([
        listMessagesForConversation(supabase, convo.id),
        listProposalsForRequest(supabase, req.id),
        getCustomServiceOrderByRequest(supabase, req.id),
      ]);

      // Não há cron: quem abre a conversa depois do prazo é quem materializa
      // a expiração de uma proposta aceita e nunca paga. A RPC é idempotente
      // e valida o prazo de novo no banco.
      const overdue = props.find(
        (p) =>
          p.status === "accepted" &&
          p.paymentDueAt &&
          new Date(p.paymentDueAt).getTime() < Date.now() &&
          (!cso || cso.status === "awaiting_payment"),
      );
      if (overdue) {
        await expireUnpaidCustomProposal(supabase, overdue.id);
        [msgs, props, cso] = await Promise.all([
          listMessagesForConversation(supabase, convo.id),
          listProposalsForRequest(supabase, req.id),
          getCustomServiceOrderByRequest(supabase, req.id),
        ]);
      }

      const counterpartId = actingUserId === req.creatorId ? req.requesterId : req.creatorId;
      const { data: counterpart } = await supabase
        .from("profiles")
        .select("display_name, username, rating, rating_count")
        .eq("id", counterpartId)
        .maybeSingle();

      const deliveryMessages = msgs.filter((m) => m.type === "delivery");
      const attachmentEntries = await Promise.all(
        deliveryMessages.map(async (m) => [m.id, await listAttachmentsForMessage(supabase, m.id)] as const),
      );

      const myReviewRow =
        cso && isReviewable(cso.status)
          ? (await listCustomOrderReviews(supabase, cso.id)).find((r) => r.reviewerId === actingUserId) ?? null
          : null;

      setRequest(req);
      setConversation(convo);
      setMessages(msgs.filter((m) => !m.deletedAt));
      setProposals(props);
      setCustomServiceOrder(cso);
      setCounterpartName(counterpart?.display_name ?? counterpart?.username ?? "Usuário");
      setCounterpartUsername(counterpart?.username ?? null);
      setCounterpartRating(counterpart?.rating ?? 0);
      setCounterpartRatingCount(counterpart?.rating_count ?? 0);
      setAttachmentsByMessage(Object.fromEntries(attachmentEntries));
      setMyReview(myReviewRow);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Não foi possível carregar esta conversa.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actingUserId, customRequestId]);

  useEffect(() => {
    // load() é assíncrona e só atualiza estado depois do primeiro await —
    // padrão de busca de dados ao montar/trocar de pedido, recomendado pelos
    // próprios docs do React (react.dev/learn/you-might-not-need-an-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // A região central da conversa rola dentro de si mesma (ver o
  // overflow-y-auto logo abaixo do cabeçalho) — sem isso, mensagem nova
  // nasceria fora da área visível sem nenhum indício de que chegou.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (autoReviewPromptShownRef.current) return;
    if (!customServiceOrder || !isReviewable(customServiceOrder.status) || myReview) return;
    autoReviewPromptShownRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowReviewModal(true);
  }, [customServiceOrder, myReview]);

  // Novas mensagens (e qualquer transição de estado do pedido, já que toda
  // transição relevante — proposta, aceite, recusa, entrega, confirmação —
  // grava uma linha em `messages`, ver migração custom_requests_chat_rpc*)
  // chegam via Postgres Changes, escopado à conversa atual e filtrado pelas
  // mesmas policies de RLS de `participants_select_messages`. O mesmo canal
  // carrega o indicador de "digitando…" via broadcast (efêmero, não grava
  // nada no banco).
  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
        () => {
          void load();
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.userId === actingUserId) return;
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, actingUserId]);

  function handleTextChange(value: string) {
    setText(value);
    const now = Date.now();
    if (channelRef.current && now - lastTypingSentAtRef.current > 2000) {
      lastTypingSentAtRef.current = now;
      void channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: actingUserId } });
    }
  }

  if (!actingUserId) {
    return (
      <div className="rounded-md border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-text-muted)">
        Entre na sua conta para ver esta conversa.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-text-muted)">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Carregando conversa…
      </div>
    );
  }

  if (loadError || !request || !conversation) {
    return (
      <div className="rounded-md border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-text-muted)">
        {loadError ?? "Não foi possível carregar esta conversa."}
      </div>
    );
  }

  const isCreator = actingUserId === request.creatorId;
  const isRequester = actingUserId === request.requesterId;
  const counterpartId = isCreator ? request.requesterId : request.creatorId;
  const otherPartyLabel = isCreator ? "o comprador" : "o criador";
  // Só criador tem perfil público (/criadores/[username]) — comprador não
  // tem essa página. Então o avatar só vira link quando EU sou o comprador
  // (isRequester): aí o outro lado da conversa é o criador, que tem perfil.
  const counterpartProfileHref = isRequester && counterpartUsername ? `/criadores/${counterpartUsername}` : null;
  const activeProposal = proposals.find((p) => p.status === "accepted" || p.status === "sent");
  const serviceLabel = activeProposal?.serviceType || request.description;

  function findProposal(id?: string): CustomProposal | undefined {
    return proposals.find((p) => p.id === id);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendCustomMessage(supabase, { conversationId: conversation!.id, content: text });
      setText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    }
  }

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const priceReais = Number(proposalDraft.price.replace(",", "."));
      await createCustomProposal(supabase, {
        customRequestId: request!.id,
        serviceType: proposalDraft.serviceType,
        description: proposalDraft.description,
        priceCents: Math.round(priceReais * 100),
        deliveryDays: Number(proposalDraft.deliveryDays),
      });
      setShowProposalForm(false);
      setProposalDraft({ serviceType: "", description: "", price: "", deliveryDays: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a proposta.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptProposal(proposalId: string) {
    setError(null);
    try {
      await acceptCustomProposal(supabase, proposalId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aceitar a proposta.");
    }
  }

  async function handleRejectProposal(proposalId: string) {
    setError(null);
    try {
      await rejectCustomProposal(supabase, proposalId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível recusar a proposta.");
    }
  }

  async function handleCancelProposal(proposalId: string) {
    setError(null);
    setBusy(true);
    try {
      await cancelCustomProposal(proposalId);
      setShowPaymentForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cancelar a proposta.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Só cria a contratação (custom_service_orders, status awaiting_payment).
   * O pagamento em si acontece no Payment Brick que aparece logo abaixo na
   * conversa — é ele que coleta os dados do pagador e gera o Pix.
   */
  async function handlePayProposal(proposalId: string) {
    setError(null);
    setBusy(true);
    try {
      await createCustomServiceOrder(supabase, proposalId);
      setShowPaymentForm(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!customServiceOrder) return;
    setError(null);
    setBusy(true);
    try {
      await sendCustomDelivery(supabase, customServiceOrder.id, [
        {
          fileName: deliveryFileName || "entrega-final.zip",
          mimeType: "application/zip",
          sizeBytes: 52_428_800,
          storageKey: `mock://media-storage/${customServiceOrder.id}-${Date.now()}`,
        },
      ]);
      setShowDeliveryForm(false);
      setDeliveryFileName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a entrega.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReceipt() {
    if (!customServiceOrder) return;
    setError(null);
    try {
      await confirmCustomReceipt(supabase, customServiceOrder.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar o recebimento.");
    }
  }

  async function handleSubmitReview(rating: number, comment: string) {
    if (!customServiceOrder) return;
    setReviewBusy(true);
    setReviewError(null);
    try {
      const review = await submitCustomOrderReview(supabase, customServiceOrder.id, rating, comment);
      setMyReview(review);
      setShowReviewModal(false);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Não foi possível enviar a avaliação.");
    } finally {
      setReviewBusy(false);
    }
  }

  async function handleReportProblem(e: React.FormEvent) {
    e.preventDefault();
    if (!customServiceOrder) return;
    setError(null);
    try {
      await reportCustomOrderProblem(supabase, customServiceOrder.id, problemReason);
      setShowProblemForm(false);
      setProblemReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível relatar o problema.");
    }
  }

  async function handleDeleteMessage(messageId: string) {
    setError(null);
    try {
      await softDeleteCustomMessage(supabase, messageId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ocultar a mensagem.");
    }
  }

  function handleReportConversation(reason: ReportReason) {
    reportService.fileReport({
      reporterId: actingUserId!,
      targetType: "conversation",
      targetId: conversation!.id,
      reason,
      description: "Denúncia enviada a partir da conversa de pedido personalizado.",
      customRequestId: request!.id,
      conversationId: conversation!.id,
    });
    setReportSent(true);
  }

  const canCreateProposal = isCreator && ["pending", "negotiating"].includes(request.status);
  const isClosed = conversation.status === "closed";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-(--color-border) p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={backHref}
            aria-label="Voltar"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-(--color-text-muted) hover:bg-(--color-surface-2)"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </Link>
          {counterpartProfileHref ? (
            <Link href={counterpartProfileHref} className="flex-shrink-0" aria-label={`Perfil de ${counterpartName}`}>
              <MediaPlaceholder seed={counterpartId} kind="avatar" className="h-9 w-9" label={counterpartName} />
            </Link>
          ) : (
            <MediaPlaceholder
              seed={counterpartId}
              kind="avatar"
              className="h-9 w-9 flex-shrink-0"
              label={counterpartName}
            />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-(--color-text)">{counterpartName}</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="truncate text-xs text-(--color-text-muted)">{serviceLabel}</span>
              <RatingStars rating={counterpartRating} ratingCount={counterpartRatingCount} size={12} />
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Mais opções"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-text-muted) hover:bg-(--color-surface)"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-1 w-64 rounded-md border border-(--color-border) bg-(--color-bg) py-1 shadow-sm"
            >
              {reportSent ? (
                <p className="px-3 py-2 text-sm text-(--color-text-muted)">
                  Denúncia enviada. Nossa equipe vai analisar.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 border-b border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-subtle)">
                    <Flag size={12} strokeWidth={1.5} />
                    Denunciar conversa
                  </div>
                  {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((reason) => (
                    <button
                      key={reason}
                      role="menuitem"
                      type="button"
                      onClick={() => handleReportConversation(reason)}
                      className="block w-full px-3 py-2 text-left text-sm text-(--color-text) hover:bg-(--color-surface)"
                    >
                      {REPORT_REASON_LABELS[reason]}
                    </button>
                  ))}
                </>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => setBlocked(true)}
                className="flex w-full items-center gap-2 border-t border-(--color-border) px-3 py-2 text-left text-sm text-(--color-danger) hover:bg-(--color-surface)"
              >
                <Ban size={14} strokeWidth={1.5} />
                {blocked ? "Usuário bloqueado" : `Bloquear ${otherPartyLabel}`}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Header e o campo de digitar (mais abaixo) ficam fixos — só esta
          região central rola, com a conversa ocupando a tela inteira como
          uma página própria (ver app/pedidos/[id] e
          app/dashboard/pedidos-personalizados/[id], que envolvem este
          componente num container fixed inset-0). */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="rounded-md border border-(--color-border) bg-(--color-surface) p-3 text-xs text-(--color-text-muted)">
        Mantenha toda a conversa, os combinados e o pagamento dentro do Jobê. É isso que garante
        a proteção da plataforma em caso de problema com a entrega ou o pagamento.
      </div>

      {customServiceOrder && ["in_progress", "delivered"].includes(customServiceOrder.status) ? (
        <div className="flex items-start gap-2 rounded-md border border-(--color-warning) bg-(--color-surface) p-3 text-sm">
          <Clock size={16} className="mt-0.5 flex-shrink-0 text-(--color-warning)" strokeWidth={1.5} />
          <div>
            <p className="text-(--color-text)">
              Prazo de entrega: <strong>{formatDateTime(customServiceOrder.deliveryDeadlineAt)}</strong>
            </p>
            <p className="mt-1 text-(--color-text-muted)">
              Se o conteúdo não for entregue dentro do prazo definido, o pedido poderá ser encerrado
              e o valor reembolsado conforme as regras da plataforma.
            </p>
          </div>
        </div>
      ) : null}

      {customServiceOrder?.status === "disputed" ? (
        <div className="flex items-center gap-2 rounded-md border border-(--color-danger) bg-(--color-surface) p-3 text-sm text-(--color-danger)">
          <AlertTriangle size={16} strokeWidth={1.5} />
          Um problema foi relatado neste pedido. Nossa equipe de moderação vai analisar.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-md border border-(--color-border) p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhuma mensagem ainda.</p>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              actingUserId={actingUserId}
              isRequester={isRequester}
              proposal={findProposal(message.metadata?.proposalId)}
              attachments={attachmentsByMessage[message.id] ?? []}
              onAccept={handleAcceptProposal}
              onReject={handleRejectProposal}
              onPay={handlePayProposal}
              onCancel={handleCancelProposal}
              onDelete={handleDeleteMessage}
              busy={busy}
              hasServiceOrder={customServiceOrder?.proposalId === message.metadata?.proposalId}
              canCancel={!customServiceOrder || customServiceOrder.status === "awaiting_payment"}
            />
          ))
        )}
        {otherTyping ? <TypingBubble /> : null}
        <div ref={messagesEndRef} />
      </div>

      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

      {customServiceOrder?.status === "awaiting_payment" && isRequester ? (
        showPaymentForm ? (
          <PixCheckoutPanel
            orderId={customServiceOrder.orderId}
            onPaid={() => void load()}
          />
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 text-sm shadow-sm">
            <p className="text-(--color-text-muted)">
              Pagamento pendente. Conclua para o criador iniciar o serviço.
            </p>
            {customServiceOrder.paymentDueAt ? (
              <p className="flex items-center gap-1.5 text-xs text-(--color-warning)">
                <Clock size={12} strokeWidth={1.5} />
                Prazo para pagar: {formatDateTime(customServiceOrder.paymentDueAt)}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setShowPaymentForm(true)}
              className="w-fit rounded-full bg-(--color-accent) px-5 py-2 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
            >
              Pagar agora
            </button>
          </div>
        )
      ) : null}

      {customServiceOrder?.status === "delivered" && isRequester ? (
        <div className="flex flex-col gap-2 rounded-md border border-(--color-border) bg-(--color-surface) p-4 text-sm">
          <p className="font-medium text-(--color-text)">Conteúdo entregue</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirmReceipt}
              className="flex items-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              <CheckCircle2 size={14} strokeWidth={1.5} />
              Confirmar recebimento
            </button>
            <button
              type="button"
              onClick={() => setShowProblemForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-(--color-border) px-4 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface)"
            >
              <AlertTriangle size={14} strokeWidth={1.5} />
              Relatar problema
            </button>
          </div>
          {showProblemForm ? (
            <form onSubmit={handleReportProblem} className="flex flex-col gap-2">
              <textarea
                value={problemReason}
                onChange={(e) => setProblemReason(e.target.value)}
                required
                rows={2}
                placeholder="Descreva o problema com a entrega."
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
              <button
                type="submit"
                className="self-start rounded-md border border-(--color-danger) px-4 py-1.5 text-sm font-medium text-(--color-danger) hover:bg-(--color-surface)"
              >
                Enviar relato
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {customServiceOrder?.status === "in_progress" && isCreator ? (
        <div className="flex flex-col gap-2 rounded-md border border-(--color-border) bg-(--color-surface) p-4 text-sm">
          {showDeliveryForm ? (
            <form onSubmit={handleSendDelivery} className="flex flex-col gap-2">
              <label htmlFor="delivery-file" className="text-sm font-medium text-(--color-text)">
                Arquivo da entrega (simulado — nenhum upload real nesta fase)
              </label>
              <input
                id="delivery-file"
                value={deliveryFileName}
                onChange={(e) => setDeliveryFileName(e.target.value)}
                placeholder="entrega-final.zip"
                className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex w-fit items-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
              >
                <Paperclip size={14} strokeWidth={1.5} />
                Confirmar envio da entrega
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeliveryForm(true)}
              className="flex w-fit items-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              <Paperclip size={14} strokeWidth={1.5} />
              Enviar entrega
            </button>
          )}
        </div>
      ) : null}

      {canCreateProposal ? (
        <div className="flex flex-col gap-2 rounded-md border border-(--color-border) p-4">
          {showProposalForm ? (
            <form onSubmit={handleCreateProposal} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-(--color-text)">Tipo de serviço</label>
                  <input
                    required
                    value={proposalDraft.serviceType}
                    onChange={(e) => setProposalDraft((d) => ({ ...d, serviceType: e.target.value }))}
                    placeholder="Ex.: Identidade visual personalizada"
                    className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-(--color-text)">Prazo (dias)</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={proposalDraft.deliveryDays}
                    onChange={(e) => setProposalDraft((d) => ({ ...d, deliveryDays: e.target.value }))}
                    className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-(--color-text)">Descrição da proposta</label>
                <textarea
                  required
                  rows={2}
                  value={proposalDraft.description}
                  onChange={(e) => setProposalDraft((d) => ({ ...d, description: e.target.value }))}
                  className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-(--color-text)">Valor (R$)</label>
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={proposalDraft.price}
                  onChange={(e) => setProposalDraft((d) => ({ ...d, price: e.target.value }))}
                  className="w-40 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
                >
                  Enviar proposta
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="rounded-md px-3 py-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowProposalForm(true)}
              className="flex w-fit items-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              <PlusCircle size={14} strokeWidth={1.5} />
              Criar proposta
            </button>
          )}
        </div>
      ) : null}

      {customServiceOrder && isReviewable(customServiceOrder.status) && !myReview && !showReviewModal ? (
        <button
          type="button"
          onClick={() => setShowReviewModal(true)}
          className="flex w-fit items-center gap-1.5 self-center rounded-full border border-(--color-accent) px-4 py-1.5 text-sm font-medium text-(--color-accent) hover:bg-(--color-accent-soft)"
        >
          <Star size={14} strokeWidth={1.5} />
          Avaliar pedido
        </button>
      ) : null}
      </div>

      {isClosed ? (
        <p className="text-center text-xs text-(--color-text-subtle)">Esta conversa está encerrada.</p>
      ) : (
        <form onSubmit={handleSend}>
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Escreva uma mensagem"
              className="flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:border-(--color-accent) focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex items-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
            >
              <Send size={14} strokeWidth={1.5} />
              Enviar
            </button>
          </div>
        </form>
      )}

      {showReviewModal ? (
        <CustomOrderReviewModal
          counterpartName={counterpartName}
          busy={reviewBusy}
          error={reviewError}
          onDismiss={() => {
            setShowReviewModal(false);
            setReviewError(null);
          }}
          onSubmit={handleSubmitReview}
        />
      ) : null}
    </div>
  );
}

const PAYMENT_CONFIRMED_CONTENT = "Pagamento confirmado. Pedido em produção.";
const DELIVERY_CONFIRMED_CONTENT = "Entrega confirmada pelo comprador. Pedido concluído.";

/**
 * Marcos de pedido (pagamento confirmado, entrega confirmada) são gravados
 * como UMA linha na conversa compartilhada — mas o texto certo depende de
 * quem está lendo: "seu pagamento foi confirmado" só faz sentido pra quem
 * pagou, não pra quem recebeu. Toda mensagem nova desse tipo (identificada
 * por metadata.customServiceOrderId, ver mapMessage) precisa de um par de
 * textos aqui, um por papel — nunca reaproveitar o texto genérico do banco
 * pros dois lados.
 */
function orderMilestoneText(content: string, isRequester: boolean): string {
  if (content === PAYMENT_CONFIRMED_CONTENT) {
    return isRequester ? content : "Pagamento recebido. Você já pode iniciar a produção deste pedido.";
  }
  if (content === DELIVERY_CONFIRMED_CONTENT) {
    return isRequester ? content : "O comprador confirmou o recebimento. Pedido concluído.";
  }
  return content;
}

function TypingBubble() {
  return (
    <div className="flex items-center gap-1 self-start rounded-md bg-(--color-surface) px-3 py-2.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-text-subtle) [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-text-subtle) [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-text-subtle)" />
    </div>
  );
}

function MessageItem({
  message,
  actingUserId,
  isRequester,
  proposal,
  attachments,
  onAccept,
  onReject,
  onPay,
  onCancel,
  onDelete,
  busy,
  hasServiceOrder,
  canCancel,
}: {
  message: Message;
  actingUserId: string;
  isRequester: boolean;
  proposal?: CustomProposal;
  attachments: MessageAttachment[];
  onAccept: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
  onPay: (proposalId: string) => void;
  onCancel: (proposalId: string) => void;
  onDelete: (messageId: string) => void;
  busy: boolean;
  /** Já existe contratação para esta proposta (pagamento em andamento). */
  hasServiceOrder: boolean;
  /** O criador ainda pode retirar esta proposta (nada foi pago). */
  canCancel: boolean;
}) {
  if (message.type === "system") {
    // Eventos de negociação (proposta enviada/aceita/recusada/cancelada)
    // seguem discretos — só marcos que fecham uma etapa do pedido
    // (pagamento confirmado, entrega confirmada) ganham destaque, porque
    // são a confirmação de que algo real aconteceu (dinheiro, produto).
    // Mesmo card usado pra "Entrega enviada" (border-success + bg-surface) —
    // não um selo verde saturado, que fugiria da paleta discreta do app.
    if (message.metadata?.customServiceOrderId) {
      return (
        <div className="flex items-center gap-2 self-center rounded-2xl border border-(--color-accent) bg-(--color-surface) px-4 py-3 text-sm text-(--color-text)">
          <CheckCircle2 size={16} className="shrink-0 text-(--color-accent)" strokeWidth={1.5} />
          {orderMilestoneText(message.content, isRequester)}
        </div>
      );
    }
    return <p className="text-center text-xs text-(--color-text-subtle)">{message.content}</p>;
  }

  if (message.type === "proposal" && proposal) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 self-center rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-(--color-text-subtle)">
            Proposta
          </span>
          <StatusBadge status={proposal.status} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-(--color-text)">{proposal.serviceType}</span>
          <p className="text-sm text-(--color-text-muted)">{proposal.description}</p>
        </div>
        <div className="flex items-end justify-between rounded-xl bg-(--color-surface-2) px-3 py-2">
          <span className="text-lg font-bold text-(--color-accent)">
            {formatBRLFromCents(proposal.priceCents)}
          </span>
          <span className="text-xs text-(--color-text-muted)">Prazo: {proposal.deliveryDays} dias</span>
        </div>
        {isRequester && proposal.status === "sent" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAccept(proposal.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              <CheckCircle2 size={14} strokeWidth={1.5} />
              Aceitar
            </button>
            <button
              type="button"
              onClick={() => onReject(proposal.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-(--color-border) px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-2)"
            >
              <XCircle size={14} strokeWidth={1.5} />
              Recusar
            </button>
          </div>
        ) : null}
        {proposal.status === "accepted" && proposal.paymentDueAt ? (
          <p className="text-xs text-(--color-text-subtle)">
            Pagamento até {formatDateTime(proposal.paymentDueAt)}
          </p>
        ) : null}
        {/* O botão de pagar some assim que a contratação existe: daí em diante
            quem conduz o pagamento é o painel de Pix, no rodapé da conversa. */}
        {isRequester && proposal.status === "accepted" && !hasServiceOrder ? (
          <div className="flex flex-col gap-2 border-t border-(--color-border) pt-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onPay(proposal.id)}
              className="w-full rounded-full bg-(--color-accent) px-3 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
            >
              Pagar proposta
            </button>
          </div>
        ) : null}
        {!isRequester && canCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(proposal.id)}
            className="flex items-center justify-center gap-1.5 rounded-full border border-(--color-border) px-3 py-2 text-sm text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text) disabled:opacity-60"
          >
            <XCircle size={14} strokeWidth={1.5} />
            Cancelar proposta
          </button>
        ) : null}
      </div>
    );
  }

  if (message.type === "delivery") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2 self-center rounded-2xl border border-(--color-accent) bg-(--color-surface) p-4 text-sm shadow-sm">
        <span className="font-medium text-(--color-text)">Entrega enviada</span>
        {attachments.map((att) => (
          <span key={att.id} className="flex items-center gap-1.5 text-(--color-text-muted)">
            <Paperclip size={12} strokeWidth={1.5} />
            {att.fileName} · {(att.size / 1024 / 1024).toFixed(1)} MB
          </span>
        ))}
      </div>
    );
  }

  const isOwn = message.senderId === actingUserId;
  return (
    <div
      className={`group flex max-w-md flex-col gap-0.5 rounded-md px-3 py-2 text-sm ${
        isOwn
          ? "self-end bg-(--color-accent) text-white"
          : "self-start bg-(--color-surface) text-(--color-text)"
      }`}
    >
      <span>{message.content}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] ${isOwn ? "text-white/70" : "text-(--color-text-subtle)"}`}>
          {formatDateTime(message.createdAt)}
        </span>
        {isOwn ? (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="text-[10px] text-white/70 opacity-0 hover:underline group-hover:opacity-100"
          >
            Ocultar
          </button>
        ) : null}
      </div>
    </div>
  );
}
