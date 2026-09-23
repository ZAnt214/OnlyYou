import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, UserRound, Megaphone, MessageSquare, HandCoins } from "lucide-react";

export const metadata: Metadata = {
  title: "Jobê para criadores",
  description: "Entenda como funciona vender serviços e produtos digitais no Jobê antes de começar.",
};

const STEPS = [
  {
    icon: UserRound,
    title: "Monte seu perfil",
    description: "Conte quem você é, o que faz e mostre exemplos reais do seu trabalho.",
  },
  {
    icon: Megaphone,
    title: "Publique seu trabalho",
    description: "Anuncie um serviço sob encomenda ou um produto digital já pronto para comprar.",
  },
  {
    icon: MessageSquare,
    title: "Converse com quem se interessar",
    description: "Tire dúvidas e entenda o que a pessoa precisa antes de fechar.",
  },
  {
    icon: HandCoins,
    title: "Combine e receba",
    description: "Escopo, valor e prazo combinados antes de fechar — pagamento fica protegido até a entrega.",
  },
] as const;

const PROFILE_TIPS = [
  "Foto e uma bio curta que explique o que você faz.",
  "Exemplos reais no portfólio, não só descrições.",
  "Preços e prazos realistas, que você consiga cumprir.",
  "Respostas rápidas nas conversas — isso conta muito.",
] as const;

export default function ParaCriadoresPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-(--color-accent-text)">Jobê para criadores</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl lg:text-5xl">
            Seu talento merece um lugar na vitrine.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-(--color-text-muted) sm:text-lg">
            Entenda como funciona vender serviços e produtos digitais no Jobê antes de começar.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-(--radius-pill) bg-(--color-accent) px-5 text-sm font-semibold text-(--color-on-accent) hover:bg-(--color-accent-hover)"
          >
            Quero ser criador no Jobê <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </header>
      </div>

      <section className="border-t border-(--color-border) bg-(--color-surface-2) py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Como funciona</p>
          <h2 className="mt-3 max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">Do perfil ao pagamento, em quatro passos.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent-text)">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <p className="mt-4 text-xs font-semibold text-(--color-text-subtle)">Passo {i + 1}</p>
                <h3 className="mt-1 text-sm font-semibold text-(--color-text)">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">O que você pode publicar</p>
          <h2 className="mt-3 max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">Duas formas de vender, no mesmo perfil.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
              <h3 className="text-lg font-semibold text-(--color-text)">Serviços</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
                Sob encomenda: você define o que está incluso, o preço a partir de e o prazo estimado. O
                valor final é combinado na conversa antes do pagamento — igual a um pedido personalizado.
              </p>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
              <h3 className="text-lg font-semibold text-(--color-text)">Produtos digitais</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
                Arquivos prontos — templates, e-books, presets e outros — com entrega automática na
                Biblioteca de quem compra, assim que o pagamento é confirmado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-surface-2) py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Como as pessoas te encontram</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Busca, categorias e o seu perfil público.</h2>
              <p className="mt-4 text-sm leading-relaxed text-(--color-text-muted)">
                Seus serviços e produtos aparecem na busca, nas categorias e na vitrine da home. Quem
                se interessar chega até o seu perfil público — com o que você publicou, avaliações e
                um jeito direto de pedir ou comprar.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Pedidos e conversas</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Tudo combinado antes de fechar.</h2>
              <p className="mt-4 text-sm leading-relaxed text-(--color-text-muted)">
                Uma pessoa se interessa e conversa com você — direto ou a partir de um pedido
                personalizado. Vocês alinham escopo, valor e prazo na conversa, e o pagamento fica
                protegido até você entregar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Como montar um bom perfil</p>
          <h2 className="mt-3 max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">Pequenos detalhes que fazem diferença.</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {PROFILE_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm leading-relaxed text-(--color-text-muted)">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)" aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-(--color-border) bg-(--color-accent) py-10 text-(--color-on-accent) sm:py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Pronto para começar?</h2>
            <p className="mt-1 text-sm leading-relaxed sm:text-base">Publique seu primeiro serviço ou produto hoje.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-(--radius-pill) bg-(--color-contrast) px-5 text-sm font-semibold text-(--color-on-contrast) hover:opacity-90"
          >
            Quero ser criador no Jobê <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
