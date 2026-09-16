const SECTIONS = [
  {
    title: "1. Dados coletados",
    body: "Coletamos dados de cadastro, histórico de compras e informações necessárias para verificação de idade e identidade.",
  },
  {
    title: "2. Uso dos dados",
    body: "Os dados são usados para viabilizar compras, entrega de conteúdo, prevenção a fraude e cumprimento de obrigações legais.",
  },
  {
    title: "3. Compartilhamento",
    body: "Dados de pagamento são processados por provedores especializados, nunca armazenados diretamente pela plataforma.",
  },
  {
    title: "4. Direitos da pessoa usuária",
    body: "É possível solicitar acesso, correção ou exclusão dos dados pessoais, conforme a legislação aplicável.",
  },
];

export default function PrivacidadePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-(--color-text)">Política de privacidade</h1>
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
