"use client";

import { useEffect, useState } from "react";
import type { Coupon, User } from "@/lib/types";
import { couponRepository } from "@/lib/repositories/CouponRepository";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { DashboardLoading } from "@/components/DashboardLoading";

export default function DashboardCuponsPage() {
  const [creator, setCreator] = useState<User | null>(null);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getCurrentCreatorClient();
      setCreator(c);
      setCoupons(await couponRepository.findByCreator(c.id));
    })();
  }, []);

  if (!creator) return <DashboardLoading />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-(--color-text)">Cupons</h1>

      {coupons === null ? null : coupons.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhum cupom criado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Desconto</th>
                <th className="px-4 py-2 font-medium">Validade</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-3 font-mono text-(--color-text)">{c.code}</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">{c.discountPercent}%</td>
                  <td className="px-4 py-3 text-(--color-text-muted)">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        c.active
                          ? "bg-(--color-accent-soft) text-(--color-accent-text)"
                          : "bg-(--color-surface-2) text-(--color-text-muted)"
                      }`}
                    >
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
