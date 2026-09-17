const SECTIONS = [
  {
    title: "1. Elegibilidade",
    body: "O uso do OnlyYou exige uma conta cadastrada e verificada por e-mail.",
  },
  {
    title: "2. Publicação de conteúdo",
    body: "Criadores são responsáveis por garantir que possuem todos os direitos autorais e de propriedade intelectual necessários sobre o conteúdo publicado.",
  },
  {
    title: "3. Compras",
    body: "Cada produto é vendido individualmente. O acesso ao conteúdo é liberado após a confirmação do pagamento.",
  },
  {
    title: "4. Reembolsos",
    body: "Solicitações de reembolso são avaliadas caso a caso, conforme a política de conteúdo e as regras de cada forma de pagamento.",
  },
  {
    title: "5. Conduta proibida",
    body: "É proibida a publicação de conteúdo ilegal, que viole direitos autorais de terceiros, ou obtido de forma fraudulenta.",
  },
  {
    title: "6. Moderação",
    body: "Produtos e perfis podem ser suspensos ou removidos em caso de violação destes termos.",
  },
];

export default function TermosPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-(--color-text)">Termos de uso</h1>
      <div className="flex flex-col gap-4 text-sm text-(--color-text-muted)">
        {SECTIONS.map((s) => (
          <div key={s.title} className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-(--color-text)">{s.title}</h2>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
