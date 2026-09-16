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
    default: "OnlyYou — Marketplace de conteúdo",
    template: "%s · OnlyYou",
  },
  description:
    "Marketplace onde criadores publicam conteúdo e definem o preço, e compradores adquirem individualmente o que desejam.",
};

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
