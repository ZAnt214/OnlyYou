"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useCustomOrderServices } from "@/lib/services/useCustomOrderServices";
import { StatusBadge } from "@/components/StatusBadge";

function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Lista de pedidos personalizados, reusada tanto no painel do criador
 * (/dashboard/pedidos-personalizados) quanto na área do comprador
 * (/pedidos) — só muda o papel do usuário atuando e a rota de destino do
 * botão "Conversar".
 */
export function CustomRequestsList({
  userId,
  role,
}: {
  userId: string;
  role: "creator" | "requester";
}) {
  const { customRequestService, proposalRepo, customServiceOrderRepo } = useCustomOrderServices();

  const requests =
    role === "creator"
      ? customRequestService.listForCreator(userId)
      : customRequestService.listForRequester(userId);

  const basePath = role === "creator" ? "/dashboard/pedidos-personalizados" : "/pedidos";

  if (requests.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        {role === "creator"
          ? "Nenhum pedido personalizado recebido ainda."
          : "Você ainda não fez nenhum pedido de conteúdo personalizado."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-(--color-border)">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
            <th className="px-4 py-2 font-medium">ID</th>
            <th className="px-4 py-2 font-medium">Data</th>
            <th className="px-4 py-2 font-medium">Resumo</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Valor</th>
            <th className="px-4 py-2 font-medium">Prazo</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const proposal = proposalRepo
              .findByCustomRequest(request.id)
              .find((p) => p.status === "accepted" || p.status === "sent");
            const customServiceOrder = customServiceOrderRepo.findByCustomRequest(request.id);
            return (
              <tr key={request.id} className="border-b border-(--color-border) last:border-0">
                <td className="px-4 py-3 text-(--color-text)">{request.id}</td>
                <td className="px-4 py-3 text-(--color-text-muted)">
                  {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-(--color-text-muted)">
                  {request.description}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3 text-(--color-text)">
                  {proposal ? formatBRLFromCents(proposal.priceCents) : "—"}
                </td>
                <td className="px-4 py-3 text-(--color-text-muted)">
                  {customServiceOrder
                    ? new Date(customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${basePath}/${request.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface)"
                  >
                    <MessageSquare size={14} strokeWidth={1.5} />
                    Conversar
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
