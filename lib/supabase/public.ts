import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase sem cookies — para leituras públicas (RLS `to public`)
 * que não dependem de quem está olhando (ex.: gigs ativos no feed/busca).
 * `lib/supabase/server.ts` chama `cookies()` de `next/headers`, o que por
 * si só tira a rota inteira da renderização estática (ver app/layout.tsx);
 * usar aquele cliente aqui destruiria de novo o ganho de performance da
 * home/descobrir só para uma consulta que nenhuma sessão poderia mudar.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
