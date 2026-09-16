import { ShieldCheck, FileWarning, Fingerprint, Lock } from "lucide-react";

const TOPICS = [
  {
    icon: Fingerprint,
    title: "Verificação de idade e identidade",
    body: "O acesso à plataforma exige confirmação de maioridade no cadastro. Verificação de identidade de criadores está em análise manual nesta fase.",
  },
  {
    icon: FileWarning,
    title: "Denúncias",
    body: "Qualquer produto ou perfil pode ser denunciado pelo menu \"•••\" > Denunciar. Denúncias urgentes (conteúdo ilegal ou envolvendo menor) recebem prioridade máxima.",
  },
  {
    icon: Lock,
    title: "Proteção de mídia e controle de acesso",
    body: "Conteúdo comprado é liberado apenas após confirmação do pagamento e fica vinculado à sua conta.",
  },
  {
    icon: ShieldCheck,
    title: "Moderação de conteúdo",
    body: "Todo produto publicado passa por análise antes de ficar visível publicamente no marketplace.",
  },
];

export default function SegurancaPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-(--color-text)">Central de Segurança</h1>
        <p className="text-sm text-(--color-text-muted)">
          Como o OnlyYou trata verificação, denúncias e proteção de conteúdo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <div key={topic.title} className="flex flex-col gap-2 rounded-lg border border-(--color-border) p-4">
            <topic.icon size={18} strokeWidth={1.5} className="text-(--color-accent)" />
            <h2 className="text-sm font-medium text-(--color-text)">{topic.title}</h2>
            <p className="text-sm text-(--color-text-muted)">{topic.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4 text-sm text-(--color-text-muted)">
        Esta é uma versão inicial da plataforma. Verificação de idade/identidade, moderação
        operacional e antifraude ainda não têm implementação real — veja detalhes no README do
        projeto.
      </div>
    </div>
  );
}
