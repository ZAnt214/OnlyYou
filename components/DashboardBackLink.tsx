"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
      className="flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
    >
      <ArrowLeft size={14} strokeWidth={1.5} />
      Painel
    </Link>
  );
}
