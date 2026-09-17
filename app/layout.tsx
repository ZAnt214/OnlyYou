import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockSessionProvider } from "@/lib/mock-session/MockSessionProvider";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";
import { userRepository } from "@/lib/repositories/UserRepository";
import { getCurrentUser } from "@/lib/supabase/session";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jobê — Marketplace de conteúdo",
    template: "%s · Jobê",
  },
  description:
    "Marketplace onde criadores publicam conteúdo e definem o preço, e compradores adquirem individualmente o que desejam.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Com uma sessão Supabase real, o link "Área do criador" aponta para o
  // próprio perfil da pessoa (mesmo que ainda não seja criadora — a página
  // de perfil mostra um convite para se tornar uma). Sem sessão, mantém o
  // comportamento de demo de sempre (aponta para a criadora mock).
  const realUser = await getCurrentUser();
  const creatorUsername = realUser?.username ?? (await userRepository.findMockCurrentCreator()).username;

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-(--color-bg) text-(--color-text)">
        <MockSessionProvider>
          <Header creatorUsername={creatorUsername} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileNav creatorUsername={creatorUsername} />
        </MockSessionProvider>
      </body>
    </html>
  );
}
