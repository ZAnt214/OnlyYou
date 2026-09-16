"use client";

import { useEffect, useState } from "react";
import type { Product, User } from "@/lib/types";
import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { useSaleRepository } from "@/lib/repositories/SaleRepository";
import { walletRepository } from "@/lib/repositories/WalletRepository";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DollarSign, Package, Wallet } from "lucide-react";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardOverviewPage() {
  const saleRepo = useSaleRepository();
  const [creator, setCreator] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    (async () => {
      const c = await userRepository.findMockCurrentCreator();
      setCreator(c);
      setProducts(await productRepository.findByCreator(c.id));
      const balance = await walletRepository.findByCreator(c.id);
      setAvailable(balance?.available ?? 0);
    })();
  }, []);

  if (!creator) return null;

  const sales = saleRepo.findByCreator(creator.id);
  const totalVendas = sales.reduce((sum, s) => sum + s.grossAmount, 0);
  const produtosVendidos = new Set(sales.map((s) => s.productId)).size;

  const salesByMonth = sales.reduce<Record<string, number>>((acc, s) => {
    const key = new Date(s.createdAt).toLocaleDateString("pt-BR", { month: "short" });
    acc[key] = (acc[key] ?? 0) + s.grossAmount;
    return acc;
  }, {});
  const maxMonth = Math.max(1, ...Object.values(salesByMonth));

  const topProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Dashboard</h1>
        <p className="text-sm text-(--color-text-muted)">Você recebe pelas vendas realizadas.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Vendas totais" value={formatBRL(totalVendas)} icon={DollarSign} />
        <StatCard label="Produtos vendidos" value={String(produtosVendidos)} icon={Package} />
        <StatCard label="Saldo disponível" value={formatBRL(available)} icon={Wallet} />
      </div>

      <div className="rounded-lg border border-(--color-border) p-4">
        <h2 className="mb-3 text-sm font-medium text-(--color-text)">Vendas por mês</h2>
        {Object.keys(salesByMonth).length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Nenhuma venda foi realizada neste período.</p>
        ) : (
          <div className="flex items-end gap-3">
            {Object.entries(salesByMonth).map(([month, total]) => (
              <div key={month} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 rounded-t-sm bg-(--color-accent)"
                  style={{ height: `${Math.max(8, (total / maxMonth) * 100)}px` }}
                  title={formatBRL(total)}
                />
                <span className="text-xs text-(--color-text-subtle)">{month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-(--color-border)">
        <h2 className="border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text)">
          Últimas vendas
        </h2>
        {sales.length === 0 ? (
          <p className="px-4 py-3 text-sm text-(--color-text-muted)">
            Nenhuma venda foi realizada neste período.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {sales
                .slice()
                .reverse()
                .slice(0, 6)
                .map((s) => (
                  <tr key={s.id} className="border-b border-(--color-border) last:border-0">
                    <td className="px-4 py-2 text-(--color-text)">{s.productId}</td>
                    <td className="px-4 py-2 text-(--color-text-muted)">
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-(--color-text)">
                      {formatBRL(s.creatorAmount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-(--color-border)">
        <h2 className="border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text)">
          Produtos com melhor desempenho
        </h2>
        {topProducts.length === 0 ? (
          <p className="px-4 py-3 text-sm text-(--color-text-muted)">Nenhum produto publicado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.id} className="border-b border-(--color-border) last:border-0">
                  <td className="px-4 py-2 text-(--color-text)">{p.title}</td>
                  <td className="px-4 py-2 text-(--color-text-muted)">{p.salesCount} vendas</td>
                  <td className="px-4 py-2 text-right">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
