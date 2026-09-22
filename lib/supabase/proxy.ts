import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type SetAllCookie = { name: string; value: string; options: CookieOptionsWithName };

/**
 * Só as rotas abaixo realmente perguntam "quem é essa pessoa" no servidor
 * (getCurrentUser/getCurrentUserId — dashboard, perfil do criador, admin,
 * upload e os endpoints do Mercado Pago). Toda a navegação pública
 * (descobrir, produto, criadores em lista, checkout, pedidos, etc.) nunca
 * lê identidade — então não precisa pagar getClaims(). /criadores/[username]
 * entra porque a página compara o visitante com o dono do perfil
 * (isOwnProfile), mas /criadores (a lista) não usa isso.
 */
function needsVerifiedIdentity(pathname: string): boolean {
  const prefixes = ["/dashboard", "/admin", "/api/mercadopago", "/api/upload", "/criadores/"];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Renova a sessão do Supabase a cada request. O Jobê é um marketplace
 * público (a maior parte das páginas não exige login), então este proxy
 * só mantém a sessão viva. As áreas privadas fazem a autorização no
 * servidor antes de renderizar qualquer conteúdo.
 */
export async function updateSession(request: NextRequest) {
  // O middleware roda em praticamente toda request (ver matcher abaixo),
  // e getClaims() abaixo é quem paga a ida à rede ao servidor de auth do
  // Supabase (JWT HS256 deste projeto não tem verificação local — cai no
  // getUser() do auth-js). O resultado é repassado às Server
  // Components/route handlers via este header, pra eles não terem que
  // pagar essa mesma ida à rede de novo (ver lib/supabase/session.ts) —
  // por isso remove primeiro qualquer valor que já venha do cliente, que
  // nunca pode ser confiável.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-verified-user-id");

  // Prefetch de <Link> não precisa (nem deve) renovar sessão: é uma
  // requisição especulativa, que o Next dispara para TODO link visível na
  // tela. Nos logs da Vercel isso aparece como dezenas de requisições por
  // segundo ao abrir uma página — cada uma passando por aqui e pagando o
  // getClaims() abaixo. Isso enfileirava o clique real do usuário atrás de
  // uma enxurrada de chamadas especulativas.
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-purpose") === "prefetch" ||
    request.headers.get("x-moz") === "prefetch";
  if (isPrefetch) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Sem credenciais do Supabase configuradas (ex.: preview/deploy sem as
  // env vars), o marketplace continua funcionando no modo mock — a
  // ausência de credenciais nunca pode derrubar todo o app via middleware.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let pendingCookies: SetAllCookie[] = [];
  let pendingHeaders: Record<string, string> = {};

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
          pendingCookies = cookiesToSet;
          pendingHeaders = headers;
        },
      },
    },
  );

  if (needsVerifiedIdentity(request.nextUrl.pathname)) {
    // getClaims() valida a assinatura do JWT a cada chamada — com HS256
    // (o caso deste projeto) isso cai no getUser() do auth-js, uma ida real
    // à rede ao servidor de auth. Só vale a pena pagar esse custo nas rotas
    // que de fato precisam saber quem está olhando.
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims?.sub) {
      requestHeaders.set("x-verified-user-id", data.claims.sub);
    }
  } else {
    // getSession() só renova o token (ida à rede) quando ele já expirou —
    // no caso comum (sessão válida) é só uma leitura local do cookie. É o
    // suficiente para manter a sessão viva sem custar uma verificação de
    // identidade que a rota nem vai usar.
    await supabase.auth.getSession();
  }

  const supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
  Object.entries(pendingHeaders).forEach(([key, value]) => supabaseResponse.headers.set(key, value));

  return supabaseResponse;
}
