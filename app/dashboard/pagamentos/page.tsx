import { getCurrentUser } from "@/lib/supabase/session";
import { getCreatorMercadoPagoStatus } from "@/lib/payments/creatorMercadoPagoAccount";
import { MercadoPagoConnectionCard } from "@/components/payments/MercadoPagoConnectionCard";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mp_oauth?: string }>;
}) {
  const { mp_oauth } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--color-text)">Pagamentos</h1>
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4 text-sm text-(--color-text-muted)">
          Conectar uma conta real do Mercado Pago exige uma sessão autenticada (Supabase). Entre
          com sua conta para gerenciar o recebimento de pagamentos.
        </div>
      </div>
    );
  }

  const status = await getCreatorMercadoPagoStatus(user.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-(--color-text)">Pagamentos</h1>
      <p className="text-sm text-(--color-text-muted)">
        Conecte sua conta do Mercado Pago para receber automaticamente sua parte de cada venda.
        O OnlyYou nunca vê nem armazena sua senha — a conexão é feita pelo fluxo oficial de OAuth
        do Mercado Pago.
      </p>
      <MercadoPagoConnectionCard status={status} oauthResult={mp_oauth} />
    </div>
  );
}
