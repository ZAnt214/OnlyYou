import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockSessionProvider } from "@/lib/mock-session/MockSessionProvider";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jobê — Encontre quem faz",
    template: "%s · Jobê",
  },
  description:
    "Plataforma onde profissionais e criadores publicam serviços e produtos digitais, e quem precisa contratar encontra, conversa e paga direto pela plataforma.",
  openGraph: {
    title: "Jobê — Encontre quem faz",
    description:
      "Serviços, produtos digitais e pedidos personalizados de profissionais e criadores brasileiros.",
    locale: "pt_BR",
    type: "website",
  },
  // Reforça via <meta> o que app/globals.css já declara em `color-scheme:
  // only light` — alguns navegadores móveis checam a tag na hora de decidir
  // se aplicam o tema escuro automático, não só a propriedade CSS.
  other: {
    "color-scheme": "only light",
  },
};

/**
 * Sem `interactiveWidget: "resizes-content"`, o navegador mobile mantém o
 * viewport do tamanho da tela cheia quando o teclado abre — em vez de
 * encolher o layout, o teclado só se sobrepõe por cima. Isso não afeta
 * páginas com scroll normal (o navegador rola até o campo focado), mas
 * telas em `position: fixed` cobrindo 100% da altura (ex.: a conversa, ver
 * ConversationView) ficam com o campo de digitar escondido embaixo do
 * teclado, sem nenhum jeito de ver o que está sendo digitado. Com
 * "resizes-content", `100dvh`/`h-full` passam a refletir a altura real
 * disponível (já descontando o teclado), e o campo sobe junto.
 */
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

/**
 * NÃO ler cookies (getCurrentUser/next/headers) aqui. O layout raiz
 * envolve todas as rotas do app: qualquer leitura de cookie neste ponto
 * força TODA rota a ser renderizada dinamicamente a cada request — nem
 * `/sobre`, `/termos` ou a home conseguem ser estáticas, e cada prefetch
 * de `<Link>` vira uma invocação serverless completa em vez de um hit de
 * CDN. O link de "Área do criador" que dependia disso agora é resolvido no
 * cliente (useCreatorUsername), onde o custo é uma busca só, memoizada.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-(--color-bg) text-(--color-text)">
        <MockSessionProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
        </MockSessionProvider>
      </body>
    </html>
  );
}
