"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useCustomOrderServices } from "@/lib/services/useCustomOrderServices";
import { userRepository } from "@/lib/repositories/UserRepository";
import { StatusBadge } from "@/components/StatusBadge";
import type { User } from "@/lib/types";

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
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    userRepository.findAll().then(setUsers);
  }, []);

  const usersById = new Map(users.map((u) => [u.id, u]));

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
    <div className="flex flex-col gap-2">
      {requests.map((request) => {
        const proposal = proposalRepo
          .findByCustomRequest(request.id)
          .find((p) => p.status === "accepted" || p.status === "sent");
        const customServiceOrder = customServiceOrderRepo.findByCustomRequest(request.id);
        const counterpart = usersById.get(role === "creator" ? request.requesterId : request.creatorId);
        const counterpartName = counterpart?.displayName ?? "Usuário";
        const serviceLabel = proposal?.serviceType || request.description;

        return (
          <Link
            key={request.id}
            href={`${basePath}/${request.id}`}
            className="flex flex-col gap-2 rounded-lg border border-(--color-border) p-4 hover:border-(--color-accent) sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-(--color-text)">
                  {role === "creator" ? counterpartName : `Pedido para ${counterpartName}`}
                </span>
                <StatusBadge status={request.status} />
              </div>
              <p className="truncate text-sm text-(--color-text-muted)">{serviceLabel}</p>
              <p className="text-xs text-(--color-text-subtle)">
                {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                {proposal ? ` · ${formatBRLFromCents(proposal.priceCents)}` : ""}
                {customServiceOrder
                  ? ` · prazo ${new Date(customServiceOrder.deliveryDeadlineAt).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-(--color-border) px-3 py-1.5 text-sm text-(--color-text) sm:self-auto">
              <MessageSquare size={14} strokeWidth={1.5} />
              Conversar
            </span>
          </Link>
        );
      })}
    </div>
  );
}
