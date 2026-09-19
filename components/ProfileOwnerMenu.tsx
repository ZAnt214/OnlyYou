"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, LayoutDashboard } from "lucide-react";

export function ProfileOwnerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-text-muted) hover:bg-(--color-surface)"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções"
      >
        <MoreHorizontal size={16} strokeWidth={1.5} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-(--color-border) bg-(--color-bg) py-1 shadow-sm"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
          >
            <LayoutDashboard size={14} strokeWidth={1.5} />
            Painel do criador
          </Link>
          <Link
            href="/dashboard/configuracoes"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface)"
          >
            <Pencil size={14} strokeWidth={1.5} />
            Editar informações do perfil
          </Link>
        </div>
      ) : null}
    </div>
  );
}
