import Link from "next/link";
import { ArrowRight, MessageCircleHeart } from "lucide-react";

/** Faixa de chamada para virar criador, exibida no topo do feed. */
export function BecomeCreatorBanner({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-accent) text-white">
        <MessageCircleHeart size={26} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1 text-base font-semibold leading-snug text-(--color-text)">
        Torne-se creator<span className="text-(--color-accent)">.</span>
        <br />
        <span className="text-(--color-accent)">Comece a faturar hoje</span>.
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-white">
        <ArrowRight size={20} strokeWidth={2} />
      </span>
    </Link>
  );
}
