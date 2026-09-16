"use client";

import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import type { Product } from "@/lib/types";
import { useMockSession } from "@/lib/mock-session/MockSessionProvider";
import { useEntitlementRepository } from "@/lib/repositories/EntitlementRepository";
import { isContentReleased } from "@/lib/access/content-release";
import { PriceTag } from "@/components/PriceTag";

export function ProductPurchaseArea({ product }: { product: Product }) {
  const session = useMockSession();
  const entitlementRepo = useEntitlementRepository();
  const entitlement = entitlementRepo.findByUserAndProduct(session.currentUserId, product.id);
  const released = isContentReleased(entitlement);

  if (released) {
    return (
      <div className="flex flex-col gap-3">
        <PriceTag price={product.price} promoPrice={product.promoPrice} size="lg" />
        <div className="flex items-center gap-2 rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm text-(--color-success)">
          <CheckCircle2 size={16} strokeWidth={1.5} />
          Conteúdo liberado
        </div>
        <Link
          href="/biblioteca"
          className="rounded-md border border-(--color-border) px-4 py-2 text-center text-sm text-(--color-text) hover:bg-(--color-surface)"
        >
          Ver na biblioteca
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <PriceTag price={product.price} promoPrice={product.promoPrice} size="lg" />
      <Link
        href={`/checkout/${product.id}`}
        className="rounded-md bg-(--color-accent) px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-(--color-accent-hover)"
      >
        Comprar agora
      </Link>
      <div className="flex items-center gap-2 text-xs text-(--color-text-subtle)">
        <Lock size={12} strokeWidth={1.5} />
        Seu conteúdo ficará disponível na sua biblioteca após a confirmação do pagamento.
      </div>
    </div>
  );
}
