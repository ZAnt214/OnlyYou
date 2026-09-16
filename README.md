# OnlyYou

OnlyYou é um marketplace de conteúdo adulto (+18). Criadores publicam produtos digitais
individuais — fotos, vídeos, packs, bundles e conteúdo personalizado — e definem o próprio
preço. Compradores adquirem cada produto individualmente e recebem acesso na própria
biblioteca assim que o pagamento é confirmado.

Este repositório contém o **primeiro scaffold real** da plataforma: interface completa,
arquitetura de domínio e dados simulados (mock) cobrindo o fluxo principal
**Criador → Produto → Compra → Entrega → Biblioteca → Vendas**.

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
  payments/          # PaymentProvider e MediaStorageProvider (mock) + TODOs de integração
  access/            # regras de liberação de conteúdo (content-release)
  moderation/        # ModerationService, ReportService
  security/          # configuração de revenue share, AuditLogRepository
  mock-session/       # MockSessionProvider — único ponto que toca localStorage
```

Quando chegar a hora de conectar um banco de dados real, o trabalho é escrever
`DatabaseProductRepository implements ProductRepository` (por exemplo) e trocar a instância
usada — nenhuma página muda. O mesmo vale para `RealPaymentProvider implements PaymentProvider`
no lugar de `MockPaymentProvider`.

### Repositórios de leitura vs. repositórios com mutação

- Repositórios só de leitura (`ProductRepository`, `UserRepository`, `CategoryRepository`,
  `ReviewRepository`, `ReportRepository`, `CouponRepository`, `WalletRepository`) são
  instâncias simples que leem de `lib/data/*`.
- Repositórios que precisam de mutação durante a sessão de uso (`OrderRepository`,
  `PaymentRepository`, `SaleRepository`, `EntitlementRepository`, `WithdrawalRepository`,
  `FavoriteRepository`) são expostos como **hooks** (`useOrderRepository()` etc.) que operam
  sobre o estado central mantido por `MockSessionProvider` — nunca acessam `localStorage`
  diretamente.

## Como funciona o checkout mock (Order → Payment → Sale → Entitlement)

Não há banco de dados nem gateway de pagamento reais nesta fase. O fluxo de compra é simulado
assim:

1. **Order**: ao clicar em "Finalizar compra", `OrderService` cria um `Order` com status
   `pending`, guardando um *snapshot* do preço no momento da compra (`OrderItem`).
2. **Payment**: `PaymentService` chama `MockPaymentProvider.createCheckout()`, que cria um
   `Payment` com status `pending` — nenhuma cobrança real acontece.
3. **Confirmação**: a tela de checkout tem um botão "Simular confirmação do pagamento", que
   equivale ao webhook de confirmação de um provedor real. Isso muda o `Payment` para `paid`.
4. **Sale**: `WalletService` registra uma `Sale` (snapshot financeiro) aplicando o split de
   receita configurado (ver abaixo).
5. **Entitlement**: `EntitlementService` só concede o `Entitlement` (o que libera o produto na
   biblioteca) **se o `Payment` associado estiver `paid`** — a criação do `Order` sozinha nunca
   libera conteúdo. Essa regra está implementada em código, não só em documentação.

Todo esse estado (`orders`, `payments`, `sales`, `entitlements`, `withdrawals`, favoritos) é
mantido por `lib/mock-session/MockSessionProvider.tsx`, que hidrata a partir do `localStorage`
no carregamento e persiste a cada mudança — assim o fluxo sobrevive a navegação e reload da
página **durante a sessão do navegador**. Essa persistência é client-side e vale apenas para
esta fase de mock; não substitui um banco de dados real.

## Divisão de receita (revenue share)

`lib/security/config.ts` exporta:

```ts
export const platformConfig = {
  creatorRevenueShare: 0.8,
  platformRevenueShare: 0.2,
};
```

Esse é o único lugar onde esses percentuais devem existir — `WalletService` é o único
consumidor que calcula `platformFee`/`creatorAmount` a partir dele, e nenhum outro módulo
deve hardcodar `0.8`/`0.2`.

## Deploy no Vercel

1. No painel da Vercel, escolha **Import Git Repository** e selecione este repositório
   (`ZAnt214/OnlyYou`).
2. Nenhuma configuração adicional é necessária — é um projeto Next.js padrão (zero-config).
3. Quando integrações reais forem adicionadas, as variáveis de `.env.example` (sem valores
   aqui) precisarão ser configuradas em **Project Settings → Environment Variables** na Vercel.

## Limitações e integrações futuras

Esta é a primeira versão pública do produto — um scaffold de interface e arquitetura. Ela
**não tem**:

- **Pagamentos reais.** `MockPaymentProvider` simula o fluxo pending → paid manualmente. A
  escolha de um processador de pagamentos compatível com o modelo específico do OnlyYou
  (marketplace de conteúdo adulto, venda individual, divisão de comissões, saques para
  criadores, chargebacks, reembolsos) ainda precisa ser validada formalmente antes de qualquer
  integração real. A disponibilidade de processamento depende das políticas atuais do
  provedor, da jurisdição, do tipo de conteúdo, do modelo comercial e da aprovação da conta —
  não se deve presumir que um gateway genérico (Stripe/PayPal/Mercado Pago padrão) aceita este
  modelo sem essa validação. Exemplos de provedores especializados a avaliar (não decididos):
  CCBill, Segpay, Epoch, Verotel.
- **Banco de dados real.** Todos os dados vivem em fixtures TypeScript (`lib/data/`) mais o
  estado de sessão em `localStorage`.
- **Autenticação real.** As telas de entrar/cadastro são ilustrativas; a "sessão" é sempre o
  usuário mock definido em `lib/data/users.ts`.
- **Verificação real de idade.** O `AgeGate` no cadastro é uma confirmação visual de data de
  nascimento, não uma verificação documental — claramente insuficiente para fins legais.
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

## Estrutura de páginas

Ver `app/` para o roteamento completo (App Router): marketplace público (`/`, `/descobrir`,
`/categorias/[slug]`, `/criadores`, `/criadores/[username]`, `/produto/[id]`), conta
(`/entrar`, `/cadastro`, `/checkout/[productId]`, `/biblioteca`, `/favoritos`), institucional
(`/sobre`, `/termos`, `/privacidade`, `/conteudo`, `/seguranca`), área do criador
(`/dashboard/*`) e um esqueleto de administração (`/admin/*`).
