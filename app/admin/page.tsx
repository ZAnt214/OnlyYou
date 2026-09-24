import { userRepository } from "@/lib/repositories/UserRepository";
import { createServiceClient } from "@/lib/supabase/service";
import { StatCard } from "@/components/StatCard";
import { Users, UserCheck, Package, ShoppingCart, DollarSign } from "lucide-react";
import { adminStatsRepository } from "@/lib/repositories/AdminStatsRepository";
import { requireAdmin } from "@/lib/security/adminAuth";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [allUsers, creators, productCount, orderCount, totalRevenue] = await Promise.all([
    userRepository.findAll(),
    userRepository.findCreators(),
    createServiceClient()
      .from("products")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => count ?? 0),
    adminStatsRepository.countOrders(),
    adminStatsRepository.totalGrossRevenue(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-(--color-text)">Visão geral</h1>
        <p className="text-sm text-(--color-text-muted)">
          Acompanhe a operação do Jobê, pagamentos, saques e ocorrências que precisam de atenção.
          Esta área é restrita a contas com permissão administrativa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Usuários" value={String(allUsers.length)} icon={Users} />
        <StatCard label="Criadores" value={String(creators.length)} icon={UserCheck} />
        <StatCard label="Produtos" value={String(productCount)} icon={Package} />
        <StatCard label="Pedidos" value={String(orderCount)} icon={ShoppingCart} />
        <StatCard label="Receita (bruta)" value={formatBRL(totalRevenue)} icon={DollarSign} />
      </div>
    </div>
  );
}
