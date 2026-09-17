# Jobê

Jobê é um marketplace de criadores, conteúdos e serviços digitais — fotos, vídeos, packs
digitais, arte, design, música, gaming, tutoriais, educação, e-books, templates, conteúdo
exclusivo, serviços personalizados e consultorias. Criadores publicam produtos e definem o
próprio preço; compradores adquirem cada produto individualmente e recebem acesso na própria
biblioteca assim que o pagamento é confirmado.

Este repositório contém o **primeiro scaffold real** da plataforma: interface completa,
arquitetura de domínio e dados simulados (mock) cobrindo o fluxo principal
**Criador → Produto → Compra → Entrega → Biblioteca → Vendas**.

> O produto foi renomeado de OnlyYou para Jobê. O repositório GitHub (`ZAnt214/OnlyYou`) e o
> projeto Supabase (`onlyyou`) mantêm o nome técnico original — renomear esses recursos de
> infraestrutura é uma ação administrativa fora do escopo deste código.

## Stack

- [Next.js 15+](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 (tokens de design via `@theme` em `app/globals.css`)
- ESLint (`eslint-config-next`)
- [`lucide-react`](https://lucide.dev) para ícones
- Sem UI kit pesado (sem shadcn/MUI/Chakra) — componentes próprios em `components/`

## Como rodar localmente

```bash
npm install
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run start    # servir o build de produção
npm run lint      # ESLint
```

## Arquitetura: por que uma camada de domínio (`lib/`)

O objetivo do scaffold é permitir trocar cada peça "mock" por uma integração real (banco de
dados, gateway de pagamento, storage de mídia) **sem tocar em nenhuma página ou componente**.
Para isso, a aplicação segue uma regra rígida:

> **Componentes e páginas nunca importam de `lib/data/` diretamente.** Eles só chamam
> repositórios (`lib/repositories/`) ou serviços (`lib/services/`, `lib/moderation/`).

```
lib/
  types/            # entidades e enums — fonte única de verdade do domínio
  data/              # fixtures mock tipadas (produtos, criadores, pedidos...)
  repositories/      # 1 interface + 1 Mock*Repository por entidade
  services/          # regras de negócio orquestrando repositórios/providers
  payments/          # PaymentProvider (Mercado Pago) e MediaStorageProvider (mock) + TODOs de integração
  access/            # regras de liberação de conteúdo (content-release)
  moderation/        # ModerationService, ReportService
  security/          # configuração de revenue share, AuditLogRepository
  mock-session/       # MockSessionProvider — único ponto que toca localStorage
```

Quando chegar a hora de conectar um banco de dados real, o trabalho é escrever
`DatabaseProductRepository implements ProductRepository` (por exemplo) e trocar a instância
usada — nenhuma página muda. Pagamentos já seguem esse padrão: `MercadoPagoMarketplaceProvider
implements PaymentProvider` é o provider real (usado pelas API routes), com `MockPaymentProvider`
mantido como fallback de desenvolvimento. A seleção é explícita via `PAYMENT_PROVIDER=mock|
mercadopago` (`lib/payments/getServerPaymentProvider.ts`); sem a variável, usa Mercado Pago se
`MERCADOPAGO_ACCESS_TOKEN` estiver configurado, senão cai para o mock — a ausência de
credenciais nunca derruba a aplicação.

Diferente do resto do domínio (que continua 100% mock/client-side), os dados de pagamento têm
uma autoridade real no servidor: um projeto Supabase dedicado guarda os tokens OAuth de cada
criador conectado e o resultado confirmado de cada pagamento (ver "Mercado Pago: marketplace,
OAuth e split" abaixo). É a única parte do domínio com persistência real nesta fase.

### Repositórios de leitura vs. repositórios com mutação

- Repositórios só de leitura (`ProductRepository`, `UserRepository`, `CategoryRepository`,
  `ReviewRepository`, `ReportRepository`, `CouponRepository`, `WalletRepository`) são
  instâncias simples que leem de `lib/data/*`.
- Repositórios que precisam de mutação durante a sessão de uso (`OrderRepository`,
  `PaymentRepository`, `SaleRepository`, `EntitlementRepository`, `WithdrawalRepository`,
  `FavoriteRepository`) são expostos como **hooks** (`useOrderRepository()` etc.) que operam
  sobre o estado central mantido por `MockSessionProvider` — nunca acessam `localStorage`
  diretamente.

## Mercado Pago: marketplace, OAuth e split

Jobê processa pagamentos como um **marketplace** do Mercado Pago: cada criador conecta a
própria conta via OAuth, e cada venda é criada em nome dele, com a comissão da plataforma
retida automaticamente pelo Mercado Pago (`marketplace_fee`/`application_fee`) — o dinheiro do
comprador nunca passa por uma conta única do Jobê.

### Conectar a conta do criador (OAuth)

```
Painel do criador → /dashboard/pagamentos → "Conectar Mercado Pago"
→ GET /api/mercadopago/oauth/authorize (exige sessão Supabase real; assina um "state" HMAC)
→ redireciona para auth.mercadopago.com (o criador autoriza no ambiente do Mercado Pago)
→ GET /api/mercadopago/oauth/callback (valida o state, confirma que é a mesma sessão que
  iniciou o fluxo, troca o code por tokens em POST /oauth/token)
→ tokens salvos em creator_mercadopago_accounts (Supabase, só service role lê/escreve)
→ espelho público sem tokens em creator_mercadopago_status (o criador e o checkout enxergam
  "conectado: sim/não" sem nunca tocar no token)
```

`access_token`/`refresh_token` nunca chegam ao navegador — nem em `NEXT_PUBLIC_*`, nem em
localStorage, nem em nenhuma resposta de API. `getValidCreatorAccessToken()`
(`lib/payments/creatorMercadoPagoAccount.ts`) renova o token automaticamente quando está perto
de expirar, sempre a partir de código server-only.

### Checkout (Order → Payment → Sale → Entitlement)

1. **Order**: ao clicar em "Finalizar compra", `OrderService` cria um `Order` com status
   `pending`, guardando um *snapshot* do preço no momento da compra (`OrderItem`).
2. **Payment**: `PaymentService.startProductCheckout()` chama `POST /api/mercadopago/checkout`
   passando só `orderId`/`productId`/`method` — **nunca o valor**. A rota resolve o produto e o
   criador no servidor (`productRepository`), calcula o split a partir de
   `platformConfig` e busca o access token do criador conectado; se ele não tiver conectado o
   Mercado Pago, o checkout é recusado com 409 antes de qualquer chamada ao gateway. Só então
   `MercadoPagoMarketplaceProvider` (server-only) cria a cobrança em nome do criador: Pix vira
   um pagamento com QR code/copia-e-cola, cartão/boleto viram uma Preference do Checkout Pro. O
   resultado é gravado imediatamente em `payment_confirmations` (Supabase) como `pending`.
3. **Confirmação (sempre no servidor)**: para Pix, `MercadoPagoPixPanel` faz polling de
   `GET /api/mercadopago/status?orderId=...`. Para cartão/boleto, a pessoa é redirecionada ao
   Checkout Pro e volta para `/checkout/retorno` — que **nunca trata o retorno do navegador
   como prova de pagamento** (nem `payment_id` na URL, nem status "success"): sempre reconsulta
   o status real. `POST /api/mercadopago/webhook` recebe as notificações do Mercado Pago,
   ignora o corpo recebido e busca o pagamento de novo diretamente na API antes de gravar
   qualquer coisa — idempotente por `order_id` (reenviar a mesma notificação não duplica
   linha nem repete o processamento; ver `confirmPaymentFromWebhook` em
   `lib/payments/paymentConfirmations.ts`).
4. **Sale**: assim que o `Payment` local reflete `paid` (via `syncStatus`, nunca antes),
   `WalletService` registra uma `Sale` (snapshot financeiro) aplicando o split de receita
   configurado (ver abaixo).
5. **Entitlement**: `EntitlementService` só concede o `Entitlement` (o que libera o produto na
   biblioteca) **se o `Payment` associado estiver `paid`** — a criação do `Order` sozinha nunca
   libera conteúdo. Essa regra está implementada em código, não só em documentação.

### O que é real e o que ainda é mock nesse fluxo

`Order`/`Payment`/`Sale`/`Entitlement` continuam vivendo no mock-session do navegador (mesmo
padrão de sempre, `lib/mock-session/MockSessionProvider.tsx`) — é o que a UI lê para montar
biblioteca, pedidos e carteira. A **autoridade real** sobre "esse pagamento foi de fato
aprovado" é a tabela `payment_confirmations` no Supabase, escrita só pelo backend a partir de
uma resposta verificada da API do Mercado Pago; o mock local é sincronizado a partir dela
(`PaymentService.syncStatus`), nunca o contrário. Isso é o suficiente para nunca liberar
conteúdo por engano, mas **não** substitui um banco de dados real para o restante do domínio —
ver "Limitações e integrações futuras".

## Pedidos personalizados, conversa e propostas

Além da compra direta de produtos publicados, a plataforma tem um segundo fluxo de
contratação: o comprador pede um conteúdo sob encomenda, negocia com o criador numa
conversa, o criador propõe valor/prazo, o comprador aceita e paga, e o criador entrega
dentro da mesma plataforma.

### Entidades

`lib/types/custom-request.ts`, `conversation.ts`, `custom-proposal.ts`,
`custom-service-order.ts`, `notification.ts` e `dispute.ts`:

- **CustomRequest**: o pedido em si (`pending → negotiating → proposal_sent → accepted →
  in_progress → delivered → completed`, com desvios para `declined`/`cancelled`/`expired`/
  `refunded`/`disputed`). Sempre nasce com uma **Conversation** (1:1).
- **Conversation** / **Message**: histórico de mensagens de uma negociação. Mensagens têm
  `type` (`text`/`proposal`/`system`/`delivery`/`attachment`) — uma proposta ou uma entrega
  aparecem como *cards* especiais na conversa, não como texto livre. Exclusão de mensagem é
  só soft-delete (`deletedAt`): o registro continua existindo (e visível para a
  administração).
- **CustomProposal**: a proposta formal (tipo de serviço, descrição, valor em **centavos**,
  prazo em dias). Só o criador do pedido pode criar; só o solicitante pode aceitar/recusar.
- **CustomServiceOrder**: a contratação efetiva depois que uma proposta é aceita e paga —
  liga-se a um `Order`/`Payment` "genéricos" (mesma infraestrutura do checkout de produto).
- **Notification**: eventos (`CUSTOM_REQUEST_CREATED`, `CUSTOM_PROPOSAL_ACCEPTED`,
  `CUSTOM_PAYMENT_CONFIRMED`, `CUSTOM_DELIVERY_SENT`, etc.), com um sino em `Header.tsx`
  linkando para `/notificacoes`.
- **Dispute**: registro simples aberto via "Relatar problema" na entrega — não há uma tela de
  gestão de disputas completa nesta fase, apenas o registro e o status refletido no pedido.

**Valores em centavos**: diferente de `Order`/`Payment`/`Sale` (que usam reais em ponto
flutuante, herdados do checkout original), as entidades novas guardam dinheiro como inteiro
em centavos (`priceCents`, `agreedAmountCents`) — a conversão para reais só acontece na borda
(formatação/inputs). Essa inconsistência entre os dois grupos de entidades é conhecida e não
foi corrigida retroativamente nas antigas para não alterar o checkout de produto existente.

### Fluxo completo

```
Perfil do criador → "Pedir conteúdo personalizado" → CustomRequestService.createRequest()
  cria CustomRequest (pending) + Conversation + mensagem inicial + Notification pro criador
→ Criador vê em /dashboard/pedidos-personalizados, abre a conversa
→ Mensagens de texto (MessageService.sendText) — cada envio verifica que quem está enviando
  é participante do pedido (requester ou creator), senão lança erro
→ Criador clica "Criar proposta" → ProposalService.create() → CustomProposal (sent),
  CustomRequest → proposal_sent, mensagem type "proposal" na conversa
→ Requester aceita (ProposalService.accept) → proposal.status = accepted,
  request.status = accepted → card mostra "Pagar proposta"
→ CustomOrderService.createOrderAndPayment() reaproveita OrderService.createOrderForCustomProposal()
  + PaymentService.startCustomServiceCheckout() (o MESMO provider Mercado Pago do checkout de
  produto — mas aqui valor/criador vêm da CustomProposal aceita no mock-session, não são
  revalidados no servidor como no checkout de produto; ver limitação abaixo) →
  CustomServiceOrder (awaiting_payment)
→ MercadoPagoPixPanel faz polling do pagamento Pix real (mesmo padrão do CheckoutFlow.tsx) →
  CustomOrderService.confirmPaymentAndStart(): PaymentService.confirmPayment() →
  OrderService.markPaid() → WalletService.registerSaleFromPayment() (Sale via platformConfig)
  → CustomServiceOrder → in_progress, deliveryDeadlineAt calculado a partir de
  proposal.deliveryDays, CustomRequest → in_progress, notificações, AuditLog
  ("custom_order.paid"). Idempotente: se o CustomServiceOrder já saiu de "awaiting_payment",
  a chamada não repete a transição nem duplica a Sale.
→ Conversa mostra o prazo e o aviso de que a falta de entrega no prazo pode levar a
  cancelamento/reembolso pelas regras da plataforma (sem prometer reembolso automático)
→ Criador clica "Enviar entrega" (CustomDeliveryService.sendDelivery) → anexa metadado mock
  de mídia (MessageAttachment, via MockMediaStorageProvider — nenhum arquivo real) → mensagem
  type "delivery" → CustomServiceOrder/CustomRequest → delivered, Notification
→ Comprador "Confirma recebimento" (CustomDeliveryService.confirmReceipt) → completed,
  AuditLog ("custom_order.completed"), conversa é fechada — ou "Relata problema"
  (CustomDeliveryService.reportProblem) → Dispute + status "disputed" nos dois lados
```

Todo esse estado (`customRequests`, `conversations`, `messages`, `customProposals`,
`customServiceOrders`, `notifications`) foi adicionado ao `MockSessionProvider` seguindo o
mesmo padrão de `orders`/`payments`/`sales` — sobrevive a reload/navegação durante a sessão do
navegador. `MessageAttachment` e `Dispute` são repositórios mock "planos" (em memória de
processo, como `ReportRepository`), já que não precisam sobreviver a reload para a demo.

### Autorização (na ausência de autenticação real)

Como esta é uma aplicação mock sem backend, "confiar só no componente" equivaleria a não ter
proteção nenhuma contra IDOR. Por isso, **toda** leitura/mutação de conversa, mensagem,
proposta ou pedido personalizado passa pela camada de serviço, que recebe o id do usuário
atuante e verifica que ele é `requesterId` ou `creatorId` do `CustomRequest` correspondente
(`assertParticipant()` em `lib/services/CustomRequestService.ts`) — lançando erro caso
contrário. Componentes só expressam intenção (`proposalService.accept(proposalId,
actingUserId)`), nunca escrevem diretamente em um repositório com campos como `priceCents`
vindos do cliente.

A área `/admin/*` segue o mesmo princípio: `lib/security/adminAuth.ts` expõe
`requireAdmin()`, chamado tanto pelo layout (`app/admin/layout.tsx`) quanto por cada página
`/admin/*` individualmente (defesa em profundidade) — ele busca um usuário mock fixo
(`UserRepository.findMockCurrentAdmin()`) e chama `notFound()` se `roles` não incluir
`"admin"`. A checagem vive num componente de servidor, não num `if` no client.

`/admin/conversas` e `/admin/conversas/[id]` mostram o histórico completo (mensagens,
propostas, pagamento, prazo, entrega, denúncias relacionadas) de cada conversa; toda
visualização de uma conversa específica grava um `AuditLog` (`action: "view_conversation"`).

### Novos `// TODO(integração)`

- **Valor/criador do pedido personalizado não são validados no servidor.** Diferente do
  checkout de produto (onde `productRepository` resolve preço e criador no backend), a
  `CustomProposal` aceita só existe no mock-session do navegador — não há como o servidor
  conferi-la de forma independente hoje. `POST /api/mercadopago/checkout` (kind
  `custom_service`) confia no valor/criador que o cliente envia. Corrigir isso exige mover
  `CustomRequest`/`CustomProposal` para uma tabela real (mesmo padrão usado para
  `payment_confirmations`), fora do escopo desta mudança.
- **Rate limiting** na criação de pedidos, envio de mensagens e propostas — nada disso é
  limitado nesta fase (comentário em `CustomRequestService`/`MessageService`).
- **Verificação de prazo (cron)**: não há nenhuma rotina server-side que confira
  `deliveryDeadlineAt` e encerre/reembolse pedidos vencidos automaticamente
  (`CustomDeliveryService`).
- **Refund real**: "reembolsado"/"disputed" são apenas transições de status; nenhuma reversão
  financeira acontece de fato (reaproveita o mesmo `TODO(integração)` de
  `PaymentProvider.refund()`).
- **Armazenamento/streaming privado de mídia**: a entrega reaproveita
  `MockMediaStorageProvider` — mesmas limitações já documentadas para produtos.
- **Autenticação/autorização real** da área `/admin/*` — ver `lib/security/adminAuth.ts`.

## Divisão de receita (revenue share)

`lib/security/config.ts` exporta:

```ts
export const platformConfig = {
  creatorRevenueShare: 0.8,
  platformRevenueShare: 0.2,
};
```

Esse é o único lugar onde esses percentuais devem existir. Dois consumidores calculam a partir
dele, sempre em centavos (nunca ponto flutuante como autoridade): `WalletService` (o `Sale`
mock exibido na carteira/vendas) e `POST /api/mercadopago/checkout` (o `marketplace_fee`/
`application_fee` real enviado ao Mercado Pago, que efetivamente retém a comissão no momento do
pagamento). Nenhum outro módulo deve hardcodar `0.8`/`0.2`.

## Deploy no Vercel

1. No painel da Vercel, escolha **Import Git Repository** e selecione este repositório
   (`ZAnt214/OnlyYou` — o repositório mantém o nome antigo).
2. Nenhuma configuração adicional é necessária — é um projeto Next.js padrão (zero-config).
3. `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver seção
   "Autenticação (Supabase)" abaixo) precisam ser configuradas em **Project Settings →
   Environment Variables** na Vercel para o cadastro/login funcionarem no site publicado — sem
   elas o build passa, mas as páginas `/entrar` e `/cadastro` falham em runtime.
4. Para pagamentos reais, configure também `SUPABASE_SERVICE_ROLE_KEY`,
   `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`, `MERCADOPAGO_REDIRECT_URI`,
   `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` (a URL
   pública real do deploy) e `AUTH_SECRET` — ver comentários em `.env.example` para o que cada
   uma faz e onde encontrá-la no painel do Mercado Pago. Sem elas, os pagamentos caem
   automaticamente no `MockPaymentProvider` (checkout simulado, nunca cobra de verdade).

## Autenticação (Supabase)

Criação de conta e login agora usam **Supabase Auth de verdade** — não é mais mock.

- Projeto Supabase dedicado (`onlyyou`, região `sa-east-1`), criado e configurado via MCP.
- Tabela `public.profiles` (`id` referenciando `auth.users`, `username`, `display_name`, `bio`,
  `avatar_url`, `roles`, `verification_status`, `offerings`, `offerings_description`), criada
  automaticamente para cada novo usuário por um trigger (`handle_new_user`) em `auth.users`.
- RLS habilitado: perfis são públicos para leitura (`select using (true)`, é um marketplace
  público); cada usuário só atualiza a própria linha (`auth.uid() = id`, com `USING` e
  `WITH CHECK`). Além disso, `roles` e `verification_status` têm `UPDATE` revogado do papel
  `authenticated` a nível de coluna — nem o dono da linha consegue alterar esses campos pela
  API pública, só um processo com a service role (que este app não usa em nenhum lugar).
- `lib/supabase/client.ts` (Client Components), `lib/supabase/server.ts` (Server
  Components/Actions) e `proxy.ts` + `lib/supabase/proxy.ts` (renovação de sessão a cada
  request) seguem o padrão oficial `@supabase/ssr` para Next.js App Router.
- `/cadastro` chama `supabase.auth.signUp()` (com `username`/`display_name` em
  `raw_user_meta_data`, lidos pelo trigger) e `/entrar` chama
  `supabase.auth.signInWithPassword()`. O cabeçalho mostra o e-mail logado e um botão "Sair"
  quando há sessão.

**O que isso NÃO faz ainda — importante:** autenticar com Supabase cria uma conta e um
`profiles` real, mas **o resto do marketplace (dashboard, produtos, pedidos, carteira, admin)
continua rodando sobre os dados mock fixos de `lib/data/users.ts`**, não sobre quem está
logado. Ou seja: hoje dá para criar conta e entrar/sair de verdade, mas isso ainda não muda o
que aparece no dashboard do criador nem substitui `mockCurrentUser`/`findMockCurrentCreator`/
`findMockCurrentAdmin` usados no resto do app — essa integração (fazer o `UserRepository` ler
de `profiles` em vez de `lib/data/users.ts`, e decidir o que fazer com os dados mock de
produtos/pedidos que hoje referenciam IDs de usuário fixos) é o próximo passo, ainda não
feito.

// TODO(integração): trocar `UserRepository` para ler/escrever em `profiles` via Supabase em
// todo o app, e decidir a migração dos dados mock (produtos, pedidos, vendas) que hoje
// referenciam IDs de `lib/data/users.ts`.
// TODO(integração): proteger rotas que exigem login de verdade (hoje `proxy.ts` só renova a
// sessão, não bloqueia acesso) e conectar RBAC de admin a `profiles.roles` em vez do usuário
// mock fixo em `findMockCurrentAdmin()`.

## Limitações e integrações futuras

Esta é a primeira versão pública do produto — um scaffold de interface e arquitetura. Ela
**não tem**:

- **Produtos do catálogo mock não pertencem a criadores reais.** O checkout de produto já
  resolve criador/valor no servidor e recusa a venda se o criador não tiver conectado o
  Mercado Pago (ver seção acima) — mas os produtos de `lib/data/products.ts` referenciam ids
  mock (`user-c01` etc.), não perfis Supabase reais, e a criação de produto
  (`/dashboard/produtos/novo`) ainda não persiste em lugar nenhum além de um toast de sucesso.
  Ou seja: com os dados de demonstração, todo checkout de produto vai corretamente cair em "409
  — criador não conectado", por design. Para testar o fluxo ponta a ponta é preciso: uma conta
  Supabase real com papel `creator`, conectar o Mercado Pago por ela, e um produto cujo
  `creatorId` seja o `id` dessa conta (hoje isso só é possível editando `lib/data/products.ts`
  manualmente, já que a criação de produto não está ligada a `profiles`).
- **Split para criadores usa o Mercado Pago (`marketplace_fee`/`application_fee`), mas o saque
  em si não.** A comissão da plataforma já é retida automaticamente pelo Mercado Pago no
  momento do pagamento; o valor do criador fica na própria conta dele — o Jobê não
  intermedia esse saque. `WithdrawalRepository` continua só um registro mock do *pedido* de
  saque, sem nenhuma integração bancária real.
- **Banco de dados real só para pagamentos.** `payment_confirmations`,
  `creator_mercadopago_accounts` e `creator_mercadopago_status` vivem num projeto Supabase real
  (com RLS). Todo o resto (produtos, pedidos, vendas, entitlements, pedidos personalizados)
  continua em fixtures TypeScript (`lib/data/`) mais o estado de sessão em `localStorage`.
- **Autenticação real só no login/cadastro em si** (ver seção "Autenticação (Supabase)"
  acima) — criar conta e entrar/sair já usa Supabase Auth de verdade, mas essa identidade
  ainda não está conectada ao resto do app: dashboard, produtos, pedidos, carteira e admin
  continuam usando o usuário mock fixo de `lib/data/users.ts` (a única exceção é a conexão do
  Mercado Pago, que exige sessão real — ver `/dashboard/pagamentos`).
- **Verificação real de identidade de criadores.** `verificationStatus` é apenas um campo de
  dado; não há fluxo de verificação operacional.
- **Armazenamento, streaming e watermarking real de mídia.** `MockMediaStorageProvider` guarda
  só metadados simulados — nenhum arquivo real é enviado, transformado ou servido. Não há
  qualquer implementação de DRM nesta fase; o que existe é apenas "proteção de mídia e
  controle de acesso" em nível de placeholder.
- **Moderação operacional real.** `ModerationService`/fila de denúncias em `/admin/denuncias`
  são esqueletos de UI e regras de transição de status, sem operação humana real por trás.
- **Antifraude real.**
- **Saques/repasses reais para criadores.** `WithdrawalRepository` só registra o pedido de
  saque no estado mock; não há integração bancária.
- **Fluxo de pedidos personalizados sem verificação automática de prazo, rate limiting ou
  refund real.** Ver seção "Pedidos personalizados, conversa e propostas" acima para o
  detalhamento dos `TODO(integração)` desse fluxo.

## Estrutura de páginas

Ver `app/` para o roteamento completo (App Router): marketplace público (`/`, `/descobrir`,
`/categorias/[slug]`, `/criadores`, `/criadores/[username]`, `/produto/[id]`), conta
(`/entrar`, `/cadastro`, `/checkout/[productId]`, `/checkout/retorno`, `/biblioteca`,
`/favoritos`, `/pedidos`, `/pedidos/[id]`, `/notificacoes`), institucional (`/sobre`, `/termos`,
`/privacidade`, `/conteudo`, `/seguranca`), área do criador (`/dashboard/*`, incluindo
`/dashboard/pedidos-personalizados`, `/dashboard/pedidos-personalizados/[id]` e
`/dashboard/pagamentos` — conexão com o Mercado Pago) e a área de administração (`/admin/*`,
incluindo `/admin/pagamentos`, `/admin/conversas` e `/admin/conversas/[id]`), gateada por
`requireAdmin()`.
