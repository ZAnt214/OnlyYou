# Design system do Jobê

## Direção visual aprovada em 2026-09-23 (prevalece sobre referências antigas abaixo)

- Identidade laranja vivo, marfim neutro e texto carvão, definida nos tokens de `app/globals.css`.
- CTA laranja usa `--color-on-accent` escuro para contraste; texto e ícones sobre fundo claro usam `--color-accent-text`.
- `--color-contrast` e `--color-on-contrast` definem o botão escuro sobre a faixa laranja.
- Home: busca, chips de categorias, faixa compacta de publicação, vitrine real, pedidos publicados, conteúdo de apoio.
- Continuação da home: cartões com capas reais quando existirem, lista de pedidos sem painel branco, vitrine com filtros locais, seção de conversa ilustrativa sem etapas numeradas, convite para criadores com perfis reais, comunidade recolhida e dúvidas em duas colunas. Fechamento em faixa laranja.
- Navegação mobile integrada ao rodapé, com ícones e rótulos visíveis; preservar o acesso à Biblioteca.
- Sem gradientes, anúncios fictícios ou ilustrações geradas substituindo imagens reais dos serviços.


O Jobê usa uma vitrine de marketplace na página inicial e um feed próprio para publicações.
As regras de componentes abaixo seguem válidas quando não conflitarem com a direção laranja
aprovada acima. Os exemplos antigos de framboesa devem ser lidos como referências ao token de
marca, não como especificações de cor literal.

## Regra de ouro: nunca usar cor "crua"

Nunca usar hex (`#d92d66`), `rgb()`/`hsl()` literais, nem classes de paleta fixa do Tailwind
(`bg-orange-500`, `text-red-600`, `border-blue-400` etc). Sempre usar os tokens definidos em
`app/globals.css`, referenciados como `bg-(--color-accent)`, `text-(--color-text-muted)`,
`border-(--color-border)` etc. Isso garante que qualquer ajuste de paleta futuro (e o
suporte a dark mode) se propague automaticamente para toda a aplicação.

Tokens disponíveis (`app/globals.css`):

| Token                                                                      | Uso                                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `--color-bg`                                                               | fundo geral da página (marfim suave)                                                |
| `--color-surface`                                                          | fundo de cards/painéis (branco)                                                     |
| `--color-surface-2`                                                        | fundo secundário (hover, seções alternadas)                                         |
| `--color-border`                                                           | bordas e divisores                                                                  |
| `--color-text` / `--color-text-muted` / `--color-text-subtle`              | hierarquia de texto                                                                 |
| `--color-accent` / `--color-accent-hover` / `--color-accent-soft`          | Framboesa Jobê — **fundos preenchidos**: CTAs, estado ativo e barrinhas decorativas |
| `--color-accent-text`                                                      | mesma framboesa, em tom escuro — texto, borda, ícone e foco sobre superfície clara  |
| `--color-on-accent`                                                        | texto/ícone sobre o fundo de accent; nunca presumir branco no tema escuro           |
| `--color-highlight` / `--color-highlight-hover` / `--color-highlight-soft` | framboesa fechada — ofertas, preços promocionais e pontos de energia comercial      |
| `--color-on-highlight`                                                     | texto/ícone sobre o fundo de highlight                                              |
| `--color-success` / `--color-warning` / `--color-danger`                   | estados semânticos (ver nota abaixo sobre `--color-success`)                        |
| `--color-verified`                                                         | selo de criador verificado (azul, separado do accent)                               |
| `--radius-card` (`1.25rem`)                                                | cards e painéis maiores                                                             |
| `--radius-pill` (`999px`)                                                  | botões, badges, nav flutuante                                                       |

### `--color-accent` vs. `--color-accent-text`: por que dois tokens

O framboesa de marca (`#d92d66` no claro) funciona em fundos preenchidos. Para texto sobre
`--color-bg`/`--color-surface`, a variante escura amplia ainda mais o contraste. Por isso a
família existe em dois tokens:

- `--color-accent` — em `bg-*`: botões/CTA sólidos, estado ativo preenchido, elementos
  decorativos pequenos (barrinhas, pontos). Sempre combinado com `text-(--color-on-accent)`
  por cima.
- `--color-accent-text` — em `text-*`, `border-*`, `ring-*`, `outline-*`, `accent-*` (nativo de
  checkbox/radio) quando o framboesa aparece como primeiro plano sobre uma superfície clara: preços,
  links, ícones, foco de input, borda ativa de tab/chip. É uma variante mais escura da mesma cor,
  com contraste garantido.

Regra prática: se a cor está preenchendo uma área (fundo), use `--color-accent`; se está
desenhando algo sobre um fundo claro (texto, linha, contorno), use `--color-accent-text`. No
tema escuro o accent fica mais claro e o texto sobre ele passa a ser vinho profundo.

A escala padrão do Tailwind (`rounded-lg/xl/2xl/3xl`) já foi sobrescrita no `@theme` para ser
mais arredondada. **Não crie uma escala paralela** — continue usando
`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` normalmente; eles já
saem no raio certo.

## Padrões de componente (seguir o que já existe antes de inventar um novo)

- **Cards** (produto, criador, estatística): fundo `bg-(--color-surface)`, borda
  `border-(--color-border)`, `rounded-2xl` (ou `--radius-card`), sombra leve (`shadow-sm`/`shadow-lg
shadow-black/10`, nunca sombra escura pesada).
- **Botões primários/CTA**: pill (`rounded-full`), fundo `bg-(--color-accent)`, texto
  `text-(--color-on-accent)`,
  hover `bg-(--color-accent-hover)`. Botões secundários: outline com `border-(--color-border)`.
- **Badges/indicadores de status positivo** (aceita, aprovado, pago, verificado — exceto o
  selo de verificado, que usa `--color-verified` —, ativo, concluído, entrega enviada,
  pagamento confirmado etc.): usam o mesmo padrão do chip ativo/CTA —
  `bg-(--color-accent-soft) text-(--color-accent-text)` (ou borda `--color-accent-text` em
  cards) — **não** `--color-success`. O `--color-success` continua verde e semântico, enquanto
  o accent é framboesa; usar os dois lado a lado em contextos parecidos
  (badge de "aprovado" vs. mensagem de sucesso) confundiria as duas semânticas. Por isso
  `--color-success` continua reservado só para os casos em que `--color-warning`/
  `--color-danger` já convivem lado a lado e um terceiro tom é indispensável — na dúvida, usar
  o accent (framboesa de marca).
- **Navegação inferior mobile** (`components/MobileNav.tsx`): barra integrada ao rodapé com
  ícones e rótulos visíveis; item ativo no tom de marca, sem excluir o acesso à Biblioteca.
- **Badge de verificado**: usa o token `--color-verified` (azul), intencionalmente separado do
  `--color-accent`/`--color-accent-text` framboesa — mantém a semântica de verificação (tipo
  Twitter/Meta) sem confundir com CTAs.
- **Feed** (`components/FeedPostCard.tsx`): coluna única `max-w-2xl` centralizada; card com
  cabeçalho de criador (avatar + nome + verificado + @handle + tempo + `⋯`), legenda, mídia
  preenchendo a largura (`MediaPlaceholder` com `flush`), barra de ações e linha de métricas.
- **Estado vazio** (`components/EmptyState.tsx`): ícone em círculo `bg-(--color-surface-2)`,
  título forte e texto de apoio — nunca um parágrafo solto de "nada encontrado".
- **Chips de filtro**: pill; ativo com `bg-(--color-accent-soft) text-(--color-accent-text)` e
  borda transparente, inativo com borda `--color-border` sobre `--color-surface`.
- **Título de página interna**: barra em card branco `rounded-2xl` com o texto centralizado.
- **Cards de mensagem na conversa** (`components/ConversationView.tsx`, `MessageItem`):
  qualquer card de mensagem (proposta, entrega, marco de pedido) usa `w-full max-w-sm
self-center rounded-2xl` como a proposta — nunca um card sem `max-w-*` (fica desproporcional,
  esticando pra largura toda do painel em telas maiores; foi o caso do card "Entrega enviada").
- **Mensagens de marco de pedido** (pagamento confirmado, entrega confirmada — identificadas
  por `message.metadata.customServiceOrderId`, ver `mapMessage` em `lib/supabase/customRequests.ts`):
  é UMA linha só no banco/conversa compartilhada, mas o texto exibido deve mudar por papel
  (`isRequester`) sempre que o conteúdo descrever algo específico de um dos lados ("seu
  pagamento foi confirmado" não faz sentido pra quem recebeu o pagamento). Ver
  `orderMilestoneText()` em `ConversationView.tsx` — toda mensagem de marco nova precisa de um
  par de textos ali, não reaproveitar o texto genérico do banco pros dois lados.

## Persistência de dados: sempre no banco real

**Toda nova feature que precise guardar estado (avaliação, preferência, contador, configuração,
histórico etc.) deve persistir no Supabase (Postgres) — nunca em mock in-memory
(`lib/repositories/*Mock*`, `lib/data/*`), `localStorage` ou estado que morre com o reload.**
Isso vale mesmo quando não for pedido explicitamente: se o dado precisa sobreviver a um
refresh, a uma nova sessão, ou ser visto por outra pessoa (perfil público, avaliação, etc.), ele
é candidato a virar tabela/coluna real, não um placeholder "por enquanto".

Ao implementar isso:

1. Modele a tabela e RLS (uma linha por autor/dono, `to authenticated`/`to public` conforme o
   dado deva ser privado ou público — ver `custom_order_reviews` como referência: privado até o
   dado precisar aparecer publicamente, então liberado com `to public using (true)`, mesmo
   padrão de "profiles são públicos para leitura").
2. Toda mutação passa por função RPC (`security invoker`, `set search_path to ''`), nunca
   INSERT/UPDATE direto da API pública — mesmo padrão já usado em todo o fluxo de pedidos
   personalizados (`lib/supabase/customRequests.ts`).
3. Se a feature precisa de uma métrica agregada que já existe como coluna solta e nunca
   alimentada (ex.: `profiles.rating`/`rating_count`, que ficaram "mortas" até a feature de
   avaliação começar a recalculá-las), aproveite a coluna existente em vez de inventar uma
   nova — mas rode `get_advisors` (security) depois de qualquer mudança de RLS/função.
4. Só cai fora dessa regra: dado puramente de UI local sem valor de negócio (aba selecionada,
   texto de um formulário ainda não enviado) — isso pode ficar em `useState`/`localStorage`
   normalmente.

## Nome da plataforma

A plataforma se chama **Jobê**. O repositório no GitHub (`ZAnt214/OnlyYou`), o projeto na
Vercel (`only-you`) e o projeto no Supabase (`onlyyou`) mantêm os nomes antigos — não trocar
essas referências de infraestrutura em documentação ou código.

## Ao adicionar qualquer tela, componente ou feature nova

1. Reaproveite um componente existente (`components/*Card.tsx`, `StatusBadge`, `PriceTag`, etc.)
   antes de estilizar do zero.
2. Se precisar de uma cor/raio que não existe como token, **adicione o token em
   `app/globals.css`** (light + dark) em vez de usar um valor solto no componente.
3. Rode `grep` por `#[0-9a-fA-F]\{3,6\}` e por classes de paleta Tailwind (`bg-red-`,
   `text-blue-`, etc.) nos arquivos que você tocou antes de considerar a tarefa pronta — o
   objetivo é manter o repo 100% livre de cor hardcoded (estado atual do projeto).
4. **Atualize `AI_CHANGELOG.md` em toda alteração feita no site.** Registre a data, o objetivo,
   os arquivos alterados, as decisões técnicas relevantes e as validações executadas. A entrada
   mais recente fica no topo. Não finalize nem envie uma mudança de código sem atualizar esse
   documento; ele é a continuidade obrigatória entre as IAs que trabalham no projeto.
