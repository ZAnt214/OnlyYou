export default function SobrePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8 text-sm text-(--color-text-muted)">
      <h1 className="text-xl font-semibold text-(--color-text)">Sobre o Jobê</h1>
      <p>
        O Jobê é uma plataforma para encontrar quem faz. Profissionais e criadores publicam
        produtos digitais e serviços — design, fotos, vídeos, templates, e-books, música,
        consultorias e muito mais — e definem o próprio preço. Quem precisa contratar encontra,
        compra e recebe acesso direto na própria biblioteca.
      </p>
      <p>
        Além dos produtos prontos, também é possível pedir um trabalho personalizado: você
        descreve o que precisa, o profissional responde com uma proposta e o pagamento só é
        liberado depois que os dois combinam os detalhes.
      </p>
      <p>
        Esta é a primeira versão pública do produto, com arquitetura pronta para integrações
        reais de pagamento, armazenamento de mídia e verificação — hoje operando com dados e
        fluxos simulados, exceto o pagamento via Mercado Pago, já integrado.
      </p>
    </div>
  );
}
