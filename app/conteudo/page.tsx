import { REPORT_REASON_LABELS } from "@/lib/types";

export default function ConteudoPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-(--color-text)">Política de conteúdo</h1>
      <p className="text-sm text-(--color-text-muted)">
        Todo produto e serviço publicado no Jobê precisa ser autoral ou devidamente licenciado.
        Não é permitido revender material de terceiros sem autorização nem prometer entregas que
        não serão cumpridas.
      </p>
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-(--color-text)">Conteúdo proibido</h2>
        <ul className="flex flex-col gap-1 text-sm text-(--color-text-muted)">
          {Object.values(REPORT_REASON_LABELS)
            .filter((label) => label !== "Outro")
            .map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-(--color-text-subtle)" />
                {label}
              </li>
            ))}
        </ul>
      </div>
      <p className="text-sm text-(--color-text-muted)">
        Produtos e serviços denunciados entram em fila de análise. Casos de conteúdo ilegal ou
        fraude têm prioridade máxima e podem resultar em remoção imediata e suspensão da conta.
      </p>
    </div>
  );
}
