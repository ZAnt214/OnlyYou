"use client";

import { useEffect, useState } from "react";
import type { Product, User } from "@/lib/types";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { useSaleRepository } from "@/lib/repositories/SaleRepository";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, Star, Eye } from "lucide-react";

export default function DashboardEstatisticasPage() {
  const saleRepo = useSaleRepository();
  const [creator, setCreator] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const c = await userRepository.findMockCurrentCreator();
      setCreator(c);
      setProducts(await productRepository.findByCreator(c.id));
    })();
  }, []);

  if (!creator) return null;

  const sales = saleRepo.findByCreator(creator.id);
  const avgTicket = sales.length ? sales.reduce((s, v) => s + v.grossAmount, 0) / sales.length : 0;
  const avgRating =
    products.length > 0
      ? products.reduce((s, p) => s + p.rating, 0) / products.filter((p) => p.ratingCount > 0).length || 0
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-(--color-text)">Estatísticas</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Ticket médio"
          value={avgTicket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={TrendingUp}
        />
        <StatCard label="Avaliação média" value={avgRating ? avgRating.toFixed(1) : "—"} icon={Star} />
        <StatCard label="Produtos publicados" value={String(products.length)} icon={Eye} />
      </div>

      <div className="rounded-lg border border-(--color-border) p-4">
        <h2 className="mb-3 text-sm font-medium text-(--color-text)">Vendas por produto</h2>
        {products.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {products.map((p) => {
              const max = Math.max(1, ...products.map((x) => x.salesCount));
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm text-(--color-text-muted)">{p.title}</span>
                  <div className="h-2 flex-1 rounded-sm bg-(--color-surface-2)">
                    <div
                      className="h-2 rounded-sm bg-(--color-accent)"
                      style={{ width: `${(p.salesCount / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs text-(--color-text-subtle)">
                    {p.salesCount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
