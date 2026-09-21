import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ServiceRequestPublisher } from "@/components/ServiceRequestPublisher";

export const metadata: Metadata = { title: "Publicar oportunidade" };

export default function NewOpportunityPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
      <Link href="/oportunidades" className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text)">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar às oportunidades
      </Link>
      <header className="mb-7 mt-5 border-b border-(--color-border) pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-(--color-text)">Conte o que você precisa</h1>
        <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
          Uma descrição clara ajuda profissionais certos a responderem com propostas melhores.
        </p>
      </header>
      <ServiceRequestPublisher />
    </div>
  );
}
