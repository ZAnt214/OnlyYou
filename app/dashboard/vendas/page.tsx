"use client";

import { useEffect, useState } from "react";
import type { Product, User } from "@/lib/types";
import { userRepository } from "@/lib/repositories/UserRepository";
import { listProductsForCreator } from "@/lib/supabase/products";
import { useSaleRepository } from "@/lib/repositories/SaleRepository";
import { useOrderRepository } from "@/lib/repositories/OrderRepository";
import { createClient } from "@/lib/supabase/client";
import { getCurrentCreatorClient } from "@/lib/supabase/current-creator-client";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLoading } from "@/components/DashboardLoading";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardVendasPage() {
  const saleRepo = useSaleRepository();
  const orderRepo = useOrderRepository();
  const [creator, setCreator] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      const c = await getCurrentCreatorClient();
      setCreator(c);
      setProducts(await listProductsForCreator(createClient(), c.id));
      setBuyers(await userRepository.findAll());
    })();
  }, []);

  if (!creator) return <DashboardLoading />;

  const sales = saleRepo.findByCreator(creator.id);
  const productById = new Map(products.map((p) => [p.id, p]));
  const buyerById = new Map(buyers.map((b) => [b.id, b]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-(--color-text)">Vendas</h1>

      {sales.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">Nenhuma venda foi realizada neste período.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--color-border)">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-subtle)">
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Comprador</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales
                .slice()
                .reverse()
                .map((s) => {
                  const order = orderRepo.findById(s.orderId);
                  const buyer = order ? buyerById.get(order.buyerId) : undefined;
                  return (
                    <tr key={s.id} className="border-b border-(--color-border) last:border-0">
                      <td className="px-4 py-3 text-(--color-text)">
                        {productById.get(s.productId)?.title ?? s.productId}
                      </td>
                      <td className="px-4 py-3 text-(--color-text-muted)">
                        {buyer?.displayName ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-(--color-text)">
                        {formatBRL(s.creatorAmount)}
                      </td>
                      <td className="px-4 py-3 text-(--color-text-muted)">
                        {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status="paid" />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
