# Página inicial — direção e continuidade

Data: 2026-09-21. Base: main em 896c46f.

## Referências consultadas

- https://www.vintepila.com.br/: descoberta por categorias, preços visíveis,
  distinção entre ofertas, novidades e mais vendidos.
- https://www.workana.com/pt: caminhos separados para contratar e trabalhar,
  explicação do processo e descoberta por especialidade.
- https://www.packzin.com.br/: convivência entre criadores, feed, catálogo e
  experiências como jogar junto. A leitura pública não expôs o feed autenticado;
  não inferir funcionalidades internas a partir dessa referência.
- https://www.workana.com/: a versão internacional apresentou contratação de
  talentos para equipes; a versão em português foi mais pertinente ao Jobê.

As referências orientam a arquitetura de informação, não a cópia de aparência,
textos, marcas, estatísticas ou garantias. Não afirmar superioridade comercial
ou de desempenho sem medição comparável.

## Aplicado nesta etapa

- Home editorial com busca nativa GET para /descobrir?q=, sugestões e três
  entradas: profissional, catálogo e área do criador.
- Categorias compactas em duas colunas no celular e quatro em telas maiores.
- Vitrine real de serviços, novidades e ofertas condicionais ao catálogo.
- Profissionais reais vinculados às publicações; removido o ranking alimentado
  por perfis de demonstração apenas desta home.
- Feed preservado em coluna única, com três publicações iniciais e expansão
  nativa até doze; acesso ao catálogo completo permanece disponível.
- Como funciona, acesso à segurança, chamada para oferecer trabalho e FAQ.
- Identidade atual usa Marfim + Violeta Jobê. Cabeçalho, navegação, pagamentos,
  solicitações e componentes compartilhados não foram reescritos.

## Ajuste comercial posterior

- A vitrine real passou para imediatamente depois do primeiro bloco da home;
  categorias e explicações vêm depois das ofertas.
- Hero ganhou texto orientado a contratação, CTA de exploração e acesso para
  quem quer vender. A lateral explica serviço, produto digital e Jogue comigo.
- O Violeta Jobê virou a assinatura principal da plataforma em ações, estados
  ativos e no hero. Coral fechado permanece como highlight comercial para
  ofertas e pontos de energia, sem competir com a cor de marca.
- O hero passou a funcionar como um plano de marca vivo, com contraste alto,
  CTA branco e uma única superfície interna para explicar as formas de compra.
- Vitrine e comunidade usam a mesma leitura memoizada no servidor, com Suspense
  separado. Isso antecipa os cards sem duplicar consultas nem JavaScript.

## Performance e dados

- Server Component, ISR de 60 segundos e Suspense com skeleton.
- Produtos e serviços consultados em paralelo; autores buscados em lote.
- Limites: 24 produtos e 12 serviços. Ofertas são uma seleção dessa amostra,
  não um ranking global. O atalho Mais vendidos leva à ordenação existente.
- Zero dependências novas no projeto; FAQ e expansão usam details/summary.
- Falha parcial não derruba a home nem vira um falso estado de catálogo vazio.
- Nenhuma nova tabela, política, RPC ou escrita no banco.
- Na verificação, o banco tinha zero produtos aprovados e três serviços ativos;
  não preencher as seções vazias com exemplos que pareçam anúncios reais.

## Validação e limites

- ESLint e TypeScript aprovados.
- Build completo aprovado com credenciais fictícias de teste, incluindo a
  variável de service role exigida pela área administrativa existente.
- HTML gerado conferido: busca, seções, FAQ e aviso de indisponibilidade.
- Leituras públicas reais verificadas com chave publicável: produtos, serviços
  e autores acessíveis sem credencial privilegiada.
- Build adicional com chave publicável real aprovado. Asserções no HTML da home
  confirmaram serviços, feed e busca, sem aviso de indisponibilidade. A chave
  de service role usada nesse build permaneceu fictícia; não se validou admin.
- Tentativa de teste HTTP local falhou na conexão ao servidor; nenhuma navegação
  ponta a ponta ou submissão de formulário foi declarada aprovada.
- Inspeção visual em navegador pendente: agent-browser não iniciou; instalação
  do Chrome falhou por certificado e a alternativa Playwright por timeout.
  Não tratar lint/build como validação visual ou teste de cliques.
- Antes de considerar a experiência visual homologada, conferir 360, 390, 768
  e 1440 px: ausência de overflow, foco por teclado, busca por Enter, links de
  categoria, FAQ, expansão do feed e solicitação de serviço com conta de teste.
- Não foram medidas métricas Lighthouse/Core Web Vitals nem feitos pagamentos.

## Próximas etapas possíveis (não implementadas)

- Melhorar descoberta por orçamento/prazo e relevância na página Explorar.
- Criar briefing orientado e comparar propostas usando os pedidos existentes.
- Evoluir portfólio e avaliações verificadas, sem números de demonstração.
- Medir busca → perfil → solicitação antes de decidir novos filtros ou seções.

Atualizar este documento e AI_CHANGELOG.md quando esta direção for alterada.
