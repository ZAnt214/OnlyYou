"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

/**
 * Sem nav/dropdown persistente no painel (ver histórico: existia um menu
 * "Painel" que ficava se sobrepondo ao conteúdo de cada seção) — a
 * navegação agora é hub-style: /dashboard lista as seções, cada seção só
 * precisa de um jeito de voltar pro hub. Não renderiza nada na própria
 * /dashboard, pra não virar um "voltar" que aponta pra página atual.
 */
export function DashboardBackLink() {
  const pathname = usePathname();
  if (pathname === "/dashboard") return null;

  return (
    <Link
      href="/dashboard"
      className="flex w-fit items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-(--color-text-muted) transition-transform hover:text-(--color-text) active:scale-95"
    >
      <BackIcon />
      Painel
    </Link>
  );
}

/** useLinkStatus só funciona num filho do Link — dá o spinner enquanto essa navegação específica está pendente. */
function BackIcon() {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />;
  return <ArrowLeft size={14} strokeWidth={1.5} />;
}
