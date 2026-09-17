# Progresso do projeto Jobê

Este arquivo registra o andamento do desenvolvimento para permitir retomar o trabalho sem
perder contexto. Atualizar sempre que houver uma mudança relevante de etapa.

## Nota sobre concorrência de sessões

Durante esta sessão, outra sessão trabalhou em paralelo no mesmo repositório e já havia feito
push de uma implementação real e completa de Mercado Pago como marketplace (OAuth por
profissional, split via `marketplace_fee`, tabelas Supabase como autoridade de pagamento,
webhook com verificação de assinatura) — commit "Marketplace Mercado Pago (OAuth + split) e
reposicionamento sem conteúdo adulto (#12)". Essa implementação é mais completa e mais correta
do que a estrutura de Mercado Pago que esta sessão havia montado antes de perceber isso, então
o trabalho de pagamento desta sessão foi descartado (`git reset --hard origin/main`) em favor
do já existente, e esta sessão passou a focar em cima dessa base: rebrand para Jobê e ampliação
de categorias profissionais.

## Concluído (base herdada da sessão paralela, já em `main`)

- Remoção de `AgeGate`, textos "+18"/conteúdo adulto e `ReportReason` específico
  (`minor_content`/`non_consensual_content` removidos).
- Categorias e catálogo generalizados para criadores/produtos/serviços digitais (fotos, vídeos,
  packs digitais, arte, design, música, gaming, tutoriais, educação, e-books, templates,
  conteúdo exclusivo, serviços personalizados, consultorias).
- Integração real de Mercado Pago como marketplace: OAuth por profissional
  (`lib/payments/mercadoPagoOAuth.ts`, `creatorMercadoPagoAccount.ts`), split via
  `marketplace_fee`/`application_fee` (`MercadoPagoMarketplaceProvider.ts`), tabelas Supabase
  `creator_mercadopago_accounts` (tokens, só service role), `creator_mercadopago_status`
  (espelho público sem tokens) e `payment_confirmations` (autoridade real de pagamento, RLS por
  comprador/criador). Rotas `app/api/mercadopago/{checkout,status,webhook,refund,oauth/*}`.
  `app/api/mercadopago/checkout` resolve produto/valor/criador sempre no servidor para compra
  de produto do catálogo (nunca confia no cliente); documentado que o fluxo de proposta
  personalizada aceita ainda envia amount/creatorId do cliente, por não haver backend real para
  `CustomProposal` nesta fase (limitação preexistente, não introduzida por essa mudança).
  Webhook valida assinatura HMAC (`x-signature`) quando `MERCADOPAGO_WEBHOOK_SECRET` está
  configurado e sempre rebusca o pagamento na API do Mercado Pago antes de confirmar — nunca
  confia no payload da notificação.
- `getServerPaymentProvider`/`getServerPaymentProvider` com fallback para `MockPaymentProvider`
  quando `MERCADOPAGO_ACCESS_TOKEN` não está configurado (dev local sem credenciais).
- `app/dashboard/pagamentos` (profissional conecta/desconecta Mercado Pago) e
  `app/checkout/retorno` (reconsulta status real antes de liberar conteúdo).

## Concluído nesta sessão (em cima dessa base)

- **Rebrand completo OnlyYou → Jobê**: Header, Footer, metadata (`app/layout.tsx`, com Open
  Graph), README, `package.json`/`package-lock.json` (`name: "jobe"`), chave de `localStorage`
  (`jobe:mock-session:v1`), username do admin mock (`admin.jobe`), textos institucionais
  (`/sobre`, `/termos`, `/privacidade`, `/seguranca`, `/conteudo`), componentes
  (`ConversationView`, `CustomOrderForm`, `produto/[id]`, páginas de pagamento do dashboard/
  admin), `lib/supabase/proxy.ts`, `lib/payments/PaymentProvider.ts` e
  `MercadoPagoMarketplaceProvider.ts`. O repositório GitHub (`ZAnt214/OnlyYou`) e o projeto
  Supabase (`onlyyou`) mantêm o nome técnico original — isso é uma decisão explícita, registrada
  no README, já que renomear esses recursos de infraestrutura é uma ação administrativa fora do
  escopo deste código.
- Restos de linguagem "+18"/conteúdo adulto que sobraram no `Footer` e em `/conteudo` (a base
  herdada já tinha removido a maior parte, mas esses dois pontos ainda citavam "maiores de 18
  anos" e "conteúdo... menor") foram reescritos.
- **Categorias ampliadas para serviços profissionais**, complementando a lista genérica de
  criadores já existente: Marketing, Social Media, Programação, Desenvolvimento web, UI/UX,
  Redação e copywriting, Tradução (`lib/data/categories.ts`, `ProductType`/
  `PRODUCT_TYPE_LABELS` em `lib/types/product.ts`). O formulário `/dashboard/produtos/novo`
  passou a gerar a lista de categorias a partir de `lib/data/categories.ts` (fonte única) em vez
  de repetir `<option>`s hardcoded. Adicionados 4 produtos mock novos (`prod-016`..`prod-019`)
  para popular essas categorias sem remover nenhum produto/id existente.
- Copy da home (`/`) e de `/criadores` ajustada para o posicionamento "Encontre quem faz" —
  evitando repetir literalmente a frase, como pedido.
- Revisão de segurança pontual: sem `dangerouslySetInnerHTML`, sem CORS custom, sem secret
  hardcoded, `NEXT_PUBLIC_*` só para a publishable key do Supabase. Webhook do Mercado Pago e
  checkout de produto já revisados como parte da base herdada (ver acima).

## Migração do fluxo de pedido personalizado (chat/proposta/entrega) para Supabase

O fluxo de "pedido personalizado" (pedir um serviço sob medida a um criador, negociar por chat,
enviar proposta, pagar, entregar e confirmar recebimento) era inteiramente mock — vivia só no
`localStorage` do navegador via `MockSessionProvider`, sem persistência real nem suporte
multiusuário (duas pessoas jamais viam a mesma conversa), e o checkout do serviço personalizado
confiava em `amount`/`creatorId` enviados pelo cliente (falha de segurança documentada acima).
Esse fluxo foi migrado por completo para Supabase:

- **Tabelas novas** (todas com RLS habilitada, migração `custom_requests_chat_schema`):
  `custom_requests`, `conversations`, `custom_proposals`, `custom_service_orders`, `messages`,
  `message_attachments`, `notifications`, `disputes`.
- **RLS** (`custom_requests_chat_rls`): política de participante (`requester_id`/`creator_id`
  igual a `auth.uid()`) em todas as tabelas, mais `public.is_admin()` (SQL, SECURITY INVOKER)
  para acesso administrativo — sem `SECURITY DEFINER` em nenhum ponto.
- **Regras de negócio como RPC** (`custom_requests_chat_rpc`/`_2`, SECURITY INVOKER,
  `search_path = ''`): `create_custom_request`, `send_custom_message`,
  `soft_delete_custom_message`, `create_custom_proposal`, `accept_custom_proposal`,
  `reject_custom_proposal`, `create_custom_service_order`, `send_custom_delivery`,
  `confirm_custom_receipt`, `report_custom_order_problem` — cada uma faz a orquestração
  multi-tabela (insert/update + notificação) de forma atômica, replicando exatamente a lógica
  que antes vivia nos services mock. Grants restritos a `authenticated`
  (`custom_requests_chat_rpc_grants`).
- **`lib/supabase/customRequests.ts`**: módulo único com os mappers Row→domínio e as funções de
  leitura/escrita usadas por toda a UI (recebe `SupabaseClient`, funciona tanto no browser
  quanto no servidor).
- **Correção de segurança**: `app/api/mercadopago/checkout` para `kind: "custom_service"` não
  aceita mais `amount`/`creatorId`/`description` do cliente — resolve tudo no servidor a partir
  de `custom_service_orders` pelo `orderId`, validando que quem está pagando é o
  `requester_id` da linha.
- **Ativação pós-pagamento**: `lib/payments/activateCustomServiceOrder.ts` (idempotente) chamado
  pelo webhook e pelo polling de status do Mercado Pago quando um pedido personalizado é pago.
- Todos os componentes do fluxo (`ConversationView`, `CustomRequestsList`, `CustomOrderForm`,
  `NotificationBell`, `/notificacoes`, `/pedidos`, `/dashboard/pedidos-personalizados`,
  `AdminConversationsTable`/`Detail`) foram reescritos para ler/escrever no Supabase via
  `useCurrentUserId()` em vez do usuário mock — quando não há sessão real, mostram estado de
  "entre na sua conta" em vez de dado mock.
- **Removido como código morto**: services (`ConversationService`, `MessageService`,
  `ProposalService`, `CustomOrderService`, `CustomDeliveryService`, `NotificationService`,
  `useCustomOrderServices`), repositórios (`CustomRequestRepository`, `ConversationRepository`,
  `MessageRepository`, `CustomProposalRepository`, `CustomServiceOrderRepository`,
  `NotificationRepository`, `MessageAttachmentRepository`, `DisputeRepository`) e os dados
  seed correspondentes (`lib/data/{custom-requests,conversations,custom-proposals,
  custom-service-orders,notifications}.ts`). `MockSessionProvider` só guarda hoje o que ainda é
  legitimamente mock: `orders`/`payments`/`sales`/`entitlements`/`withdrawals`/`favorites`
  (fluxo de compra de produto do catálogo).
- **Ainda mock, fora do escopo desta migração**: `AuditLogRepository` (log de auditoria do
  admin) e `ReportRepository` (denúncias) — não fazem parte do fluxo de pedido personalizado em
  si; migrar para Supabase fica como próximo passo natural.
- Achados do `get_advisors` (segurança) após a migração: nenhum novo — só os pré-existentes
  (`creator_mercadopago_accounts` sem policy por desenho, `become_creator()` SECURITY DEFINER de
  trabalho anterior, proteção de senha vazada desabilitada no projeto).

## Observação de segurança para acompanhar (não corrigida nesta sessão)

- `app/api/mercadopago/webhook/route.ts`: a verificação de assinatura só roda `if (secret)` —
  ou seja, se `MERCADOPAGO_WEBHOOK_SECRET` não estiver configurado no ambiente, o endpoint
  aceita qualquer POST sem autenticação (mitigado parcialmente porque o handler sempre rebusca
  o pagamento pela API do Mercado Pago usando o `id` recebido, então um payload forjado só
  teria efeito se referenciar um `mpPaymentId` real da própria conta). Antes de operar em
  produção, `MERCADOPAGO_WEBHOOK_SECRET` deve estar sempre configurado — não é uma falha de
  código, é uma configuração de ambiente a garantir no deploy.

## Pendências que dependem de configuração/infra externa (não bloqueiam o resto)

- **Credenciais reais do Mercado Pago** (`MERCADOPAGO_CLIENT_ID/SECRET/REDIRECT_URI`,
  `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`) e `SUPABASE_SERVICE_ROLE_KEY` — sem
  elas, o app cai automaticamente no `MockPaymentProvider` (comportamento esperado).
- **`UserRepository` ainda não lê de `profiles` (Supabase) para todo o app** — dashboard,
  produtos e carteira continuam sobre `lib/data/users.ts`, mesmo com login real.
- **Verificação de identidade de profissionais** com provedor especializado — hoje é só um
  campo de dado (`verificationStatus`).
- Rate limiting, cron de prazo de entrega, refund automático de pedidos personalizados, storage
  de mídia real, moderação e antifraude operacionais, saques bancários reais — ver README,
  seção "Limitações e integrações futuras".

## Decisões técnicas tomadas

- Mantidos os identificadores internos `creator`/`creatorId`/`CreatorCard`/
  `creatorRevenueShare` em vez de renomear para `professional` em todo o código — é um refactor
  de nomenclatura amplo e de alto risco sem ganho funcional; a UI já foi ajustada onde importa
  ("Criadores" → "Profissionais e criadores").
- Categorias de conteúdo-criador (fotos, vídeos, gaming, etc.) da base herdada foram mantidas
  em vez de substituídas, e as categorias profissionais do briefing foram adicionadas por cima
  — evita quebrar produtos/testes existentes e ainda cobre o pedido de "não limitado a
  freelancer tradicional".
- Trabalho de Mercado Pago desta sessão (uma estrutura mais simples, sem OAuth/split real) foi
  descartado em favor da implementação já existente em `main`, mais completa — ver nota de
  concorrência acima.

## Testes/validações realizadas

`npx tsc --noEmit`, `npm run lint` e `npm run build` (Next.js 16, Turbopack) rodados após todas
as mudanças desta sessão — todos passando, sem erros. Ver relatório final desta sessão para o
resultado completo do build.

## Último ponto de execução

Rebrand para Jobê, ampliação de categorias profissionais e migração completa do fluxo de
pedido personalizado (chat/proposta/entrega) para Supabase concluídos. `npx tsc --noEmit`,
`npm run lint` e `npm run build` verdes após a migração. Próximo passo sugerido: migrar
`UserRepository` para `profiles` (Supabase) em todo o app, e avaliar migrar
`AuditLogRepository`/`ReportRepository` (admin) para Supabase também.
