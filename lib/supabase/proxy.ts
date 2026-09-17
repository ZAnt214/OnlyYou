import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão do Supabase a cada request. O Jobê é um marketplace
 * público (a maior parte das páginas não exige login), então este proxy
 * só mantém a sessão viva — não redireciona ninguém. Proteção de rota
 * específica (ex.: dashboard exigir login de verdade) é uma decisão
 * separada, ainda não aplicada nesta etapa.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Sem credenciais do Supabase configuradas (ex.: preview/deploy sem as
  // env vars), o marketplace continua funcionando no modo mock — a
  // ausência de credenciais nunca pode derrubar todo o app via middleware.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
        },
      },
    },
  );

  // Não rodar código entre createServerClient e getClaims() — getClaims()
  // valida a assinatura do JWT a cada chamada e é o que efetivamente
  // renova o token; pular isso pode deslogar usuários aleatoriamente.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
