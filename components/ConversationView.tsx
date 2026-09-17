"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useCustomOrderServices } from "@/lib/services/useCustomOrderServices";
import { messageAttachmentRepository } from "@/lib/repositories/MessageAttachmentRepository";
import { reportService } from "@/lib/moderation/ReportService";
import { StatusBadge } from "@/components/StatusBadge";
import { MercadoPagoPixPanel } from "@/components/payments/MercadoPagoPixPanel";
import {
  REPORT_REASON_LABELS,
  type ReportReason,
  type Message,
  type CustomProposal,
  type Payment,
} from "@/lib/types";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function PendingPaymentPanel({
  customServiceOrderId,
  orderId,
  paymentService,
  onPaid,
}: {
  customServiceOrderId: string;
  orderId: string;
  paymentService: ReturnType<typeof useCustomOrderServices>["paymentService"];
  onPaid: () => void;
}) {
  const payment = paymentService.findByOrder(orderId);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-(--color-border) bg-(--color-surface) p-4 text-sm">
      <p className="text-(--color-text)">
        Pedido {customServiceOrderId} criado. Pagamento com status{" "}
        <span className="font-medium text-(--color-warning)">pendente</span>.
      </p>
      {payment ? (
        <MercadoPagoPixPanel
          payment={payment}
          paymentService={paymentService}
          onPaid={(paid: Payment) => {
            void paid;
            onPaid();
          }}
        />
      ) : null}
    </div>
  );
}

export function ConversationView({
  customRequestId,
  actingUserId,
}: {
  customRequestId: string;
  actingUserId: string;
}) {
  const services = useCustomOrderServices();
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

  let ctx;
  try {
    ctx = services.conversationService.loadContext(actingUserId, customRequestId);
  } catch (err) {
    return (
      <div className="rounded-md border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-text-muted)">
        {err instanceof Error ? err.message : "Não foi possível carregar esta conversa."}
      </div>
    );
  }

  const { request, conversation, messages } = ctx;
  const isCreator = actingUserId === request.creatorId;
  const isRequester = actingUserId === request.requesterId;
  const otherPartyLabel = isCreator ? "o comprador" : "o criador";

  const proposals = services.proposalRepo.findByCustomRequest(request.id);
  const customServiceOrder = services.customServiceOrderRepo.findByCustomRequest(request.id);

  function findProposal(id?: string): CustomProposal | undefined {
    return proposals.find((p) => p.id === id);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      services.messageService.sendText(actingUserId, conversation.id, text);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    }
  }

  function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const priceReais = Number(proposalDraft.price.replace(",", "."));
      services.proposalService.create(actingUserId, {
        customRequestId: request.id,
        serviceType: proposalDraft.serviceType,
        description: proposalDraft.description,
        priceCents: Math.round(priceReais * 100),
        deliveryDays: Number(proposalDraft.deliveryDays),
      });
      setShowProposalForm(false);
      setProposalDraft({ serviceType: "", description: "", price: "", deliveryDays: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a proposta.");
    } finally {
      setBusy(false);
    }
  }

  function handleAcceptProposal(proposalId: string) {
    setError(null);
    try {
      services.proposalService.accept(actingUserId, proposalId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aceitar a proposta.");
    }
  }

  function handleRejectProposal(proposalId: string) {
    setError(null);
    try {
      services.proposalService.reject(actingUserId, proposalId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível recusar a proposta.");
    }
  }

  async function handlePayProposal(proposalId: string) {
    setError(null);
    setBusy(true);
    try {
      await services.customOrderService.createOrderAndPayment(actingUserId, proposalId, "pix");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setBusy(false);
    }
  }

  function handlePaymentConfirmed() {
    if (!customServiceOrder) return;
    setError(null);
    try {
      services.customOrderService.confirmPaymentAndStart(actingUserId, customServiceOrder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar o pagamento.");
    }
  }

  async function handleSendDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!customServiceOrder) return;
    setError(null);
    setBusy(true);
    try {
      await services.customDeliveryService.sendDelivery(actingUserId, customServiceOrder.id, [
        { fileName: deliveryFileName || "entrega-final.zip", mimeType: "application/zip", sizeBytes: 52_428_800 },
      ]);
      setShowDeliveryForm(false);
      setDeliveryFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a entrega.");
    } finally {
      setBusy(false);
    }
  }

  function handleConfirmReceipt() {
    if (!customServiceOrder) return;
    setError(null);
    try {
      services.customDeliveryService.confirmReceipt(actingUserId, customServiceOrder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar o recebimento.");
    }
  }

  function handleReportProblem(e: React.FormEvent) {
    e.preventDefault();
    if (!customServiceOrder) return;
    setError(null);
    try {
      services.customDeliveryService.reportProblem(actingUserId, customServiceOrder.id, problemReason);
      setShowProblemForm(false);
      setProblemReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível relatar o problema.");
    }
  }

  function handleReportConversation(reason: ReportReason) {
    reportService.fileReport({
      reporterId: actingUserId,
      targetType: "conversation",
      targetId: conversation.id,
      reason,
      description: "Denúncia enviada a partir da conversa de pedido personalizado.",
      customRequestId: request.id,
      conversationId: conversation.id,
    });
    setReportSent(true);
  }

  const canCreateProposal = isCreator && ["pending", "negotiating"].includes(request.status);
  const isClosed = conversation.status === "closed";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-(--color-border) p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-(--color-text-muted)">Pedido {request.id}</span>
          <StatusBadge status={request.status} />
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
              onAccept={handleAcceptProposal}
              onReject={handleRejectProposal}
              onPay={handlePayProposal}
              busy={busy}
            />
          ))
        )}
      </div>

      {error ? <p className="text-sm text-(--color-danger)">{error}</p> : null}

      {customServiceOrder?.status === "awaiting_payment" && isRequester ? (
        <PendingPaymentPanel
          customServiceOrderId={customServiceOrder.id}
          orderId={customServiceOrder.orderId}
          paymentService={services.paymentService}
          onPaid={handlePaymentConfirmed}
        />
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
                    placeholder="Ex.: Ensaio fotográfico personalizado"
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

      {isClosed ? (
        <p className="text-center text-xs text-(--color-text-subtle)">Esta conversa está encerrada.</p>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
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
        </form>
      )}
    </div>
  );
}

function MessageItem({
  message,
  actingUserId,
  isRequester,
  proposal,
  onAccept,
  onReject,
  onPay,
  busy,
}: {
  message: Message;
  actingUserId: string;
  isRequester: boolean;
  proposal?: CustomProposal;
  onAccept: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
  onPay: (proposalId: string) => void;
  busy: boolean;
}) {
  if (message.type === "system") {
    return (
      <p className="text-center text-xs text-(--color-text-subtle)">{message.content}</p>
    );
  }

  if (message.type === "proposal" && proposal) {
    return (
      <div className="flex flex-col gap-2 self-center rounded-md border border-(--color-accent) bg-(--color-surface) p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-(--color-text)">{proposal.serviceType}</span>
          <StatusBadge status={proposal.status} />
        </div>
        <p className="text-(--color-text-muted)">{proposal.description}</p>
        <div className="flex items-center gap-4 text-(--color-text)">
          <span className="font-medium">{formatBRLFromCents(proposal.priceCents)}</span>
          <span className="text-(--color-text-muted)">Prazo: {proposal.deliveryDays} dias</span>
        </div>
        {isRequester && proposal.status === "sent" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAccept(proposal.id)}
              className="flex items-center gap-1.5 rounded-md bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              <CheckCircle2 size={14} strokeWidth={1.5} />
              Aceitar
            </button>
            <button
              type="button"
              onClick={() => onReject(proposal.id)}
              className="flex items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) hover:bg-(--color-bg)"
            >
              <XCircle size={14} strokeWidth={1.5} />
              Recusar
            </button>
          </div>
        ) : null}
        {isRequester && proposal.status === "accepted" ? (
          <div className="flex flex-col gap-2 border-t border-(--color-border) pt-2">
            <p className="text-(--color-text-muted)">
              Proposta aceita. Para iniciar o serviço, conclua o pagamento.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => onPay(proposal.id)}
              className="w-fit rounded-md bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover) disabled:opacity-60"
            >
              Pagar proposta
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (message.type === "delivery") {
    const attachments = messageAttachmentRepository.findByMessage(message.id);
    return (
      <div className="flex flex-col gap-2 self-center rounded-md border border-(--color-success) bg-(--color-surface) p-4 text-sm">
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
      className={`flex max-w-md flex-col gap-0.5 rounded-md px-3 py-2 text-sm ${
        isOwn
          ? "self-end bg-(--color-accent) text-white"
          : "self-start bg-(--color-surface) text-(--color-text)"
      }`}
    >
      <span>{message.content}</span>
      <span className={`text-[10px] ${isOwn ? "text-white/70" : "text-(--color-text-subtle)"}`}>
        {formatDateTime(message.createdAt)}
      </span>
    </div>
  );
}
