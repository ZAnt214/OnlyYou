import type { Metadata } from "next";
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
