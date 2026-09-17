import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service role key: ignora RLS. Só pode ser usado em
 * código server-only (API routes, Server Components confiáveis) e nunca deve
 * ser importado por um módulo "use client" — a service role key nunca pode
 * chegar ao navegador.
 *
 * Usado para: ler/escrever tokens OAuth do Mercado Pago
 * (creator_mercadopago_accounts) e escrever confirmações de pagamento
 * (payment_confirmations) a partir do webhook — as únicas rotas que têm
 * autoridade para alterar essas tabelas.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para usar o cliente Supabase de service role.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
