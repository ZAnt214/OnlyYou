import { userRepository } from "@/lib/repositories/UserRepository";
import { productRepository } from "@/lib/repositories/ProductRepository";
import { StatCard } from "@/components/StatCard";
import { Users, UserCheck, Package, ShoppingCart, DollarSign } from "lucide-react";
import { adminStatsRepository } from "@/lib/repositories/AdminStatsRepository";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminOverviewPage() {
  const [allUsers, creators, products, orderCount, totalRevenue] = await Promise.all([
    userRepository.findAll(),
    userRepository.findCreators(),
    productRepository.findAll(),
    adminStatsRepository.countOrders(),
    adminStatsRepository.totalGrossRevenue(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Visão geral</h1>
        <p className="text-sm text-(--color-text-muted)">
          Painel administrativo simplificado — sem controle de acesso (RBAC) real nesta fase.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Usuários" value={String(allUsers.length)} icon={Users} />
        <StatCard label="Criadores" value={String(creators.length)} icon={UserCheck} />
        <StatCard label="Produtos" value={String(products.length)} icon={Package} />
        <StatCard label="Pedidos" value={String(orderCount)} icon={ShoppingCart} />
        <StatCard label="Receita (bruta)" value={formatBRL(totalRevenue)} icon={DollarSign} />
      </div>
    </div>
  );
}
