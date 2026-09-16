export default function SobrePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8 text-sm text-(--color-text-muted)">
      <h1 className="text-xl font-semibold text-(--color-text)">Sobre o OnlyYou</h1>
      <p>
        OnlyYou é um marketplace de conteúdo adulto. Criadores publicam produtos digitais —
        fotos, vídeos, packs e bundles — e definem o próprio preço. Compradores adquirem cada
        produto individualmente e recebem acesso na própria biblioteca.
      </p>
      <p>
        Diferente de um modelo de assinatura, aqui a compra é por produto: você paga pelo
        conteúdo que quer, não por um acesso recorrente a um perfil inteiro.
      </p>
      <p>
        Esta é a primeira versão pública do produto, com arquitetura pronta para integrações
        reais de pagamento, armazenamento de mídia e verificação — hoje operando com dados e
        fluxos simulados.
      </p>
    </div>
  );
}
