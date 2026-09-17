# Design system do Jobê

O Jobê usa layout de rede social de criadores (feed de coluna única, cards de post, nav
inferior em pill flutuante) com paleta própria: fundo cinza-névoa frio, cards brancos e
laranja como cor de marca. **Toda UI nova ou alterada deve seguir estas regras — sem
exceção**, mesmo quando não for pedido explicitamente.

## Regra de ouro: nunca usar cor "crua"

Nunca usar hex (`#f5821f`), `rgb()`/`hsl()` literais, nem classes de paleta fixa do Tailwind
(`bg-orange-500`, `text-red-600`, `border-blue-400` etc). Sempre usar os tokens definidos em
`app/globals.css`, referenciados como `bg-(--color-accent)`, `text-(--color-text-muted)`,
`border-(--color-border)` etc. Isso garante que qualquer ajuste de paleta futuro (e o
suporte a dark mode) se propague automaticamente para toda a aplicação.

Tokens disponíveis (`app/globals.css`):

| Token | Uso |
|---|---|
| `--color-bg` | fundo geral da página (cinza-névoa frio) |
| `--color-surface` | fundo de cards/painéis (branco) |
| `--color-surface-2` | fundo secundário (hover, seções alternadas) |
| `--color-border` | bordas e divisores |
| `--color-text` / `--color-text-muted` / `--color-text-subtle` | hierarquia de texto |
| `--color-accent` / `--color-accent-hover` / `--color-accent-soft` | laranja — CTAs, preços, estado ativo |
| `--color-success` / `--color-warning` / `--color-danger` | estados semânticos |
| `--color-verified` | selo de criador verificado (azul, separado do accent) |
| `--radius-card` (`1.25rem`) | cards e painéis maiores |
| `--radius-pill` (`999px`) | botões, badges, nav flutuante |

A escala padrão do Tailwind (`rounded-lg/xl/2xl/3xl`) já foi sobrescrita no `@theme` para ser
mais arredondada. **Não crie uma escala paralela** — continue usando
`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` normalmente; eles já
saem no raio certo.

## Padrões de componente (seguir o que já existe antes de inventar um novo)

- **Cards** (produto, criador, estatística): fundo `bg-(--color-surface)`, borda
  `border-(--color-border)`, `rounded-2xl` (ou `--radius-card`), sombra leve (`shadow-sm`/`shadow-lg
  shadow-black/10`, nunca sombra escura pesada).
- **Botões primários/CTA**: pill (`rounded-full`), fundo `bg-(--color-accent)`, texto branco,
  hover `bg-(--color-accent-hover)`. Botões secundários: outline com `border-(--color-border)`.
- **Badges de desconto/sucesso**: pill verde suave usando `--color-success` sobre fundo claro
  derivado dele (não usar `green-500` do Tailwind).
- **Navegação inferior mobile** (`components/MobileNav.tsx`): pill flutuante ancorada ao fundo
  da tela, só ícones, item ativo com `bg-(--color-accent-soft) text-(--color-accent)`. Qualquer
  nova aba entra nesse mesmo padrão, não numa barra reta com labels.
- **Badge de verificado**: usa o token `--color-verified` (azul), intencionalmente separado do
  `--color-accent` laranja — mantém a semântica de verificação (tipo Twitter/Meta) sem confundir
  com CTAs.
- **Feed** (`components/FeedPostCard.tsx`): coluna única `max-w-2xl` centralizada; card com
  cabeçalho de criador (avatar + nome + verificado + @handle + tempo + `⋯`), legenda, mídia
  preenchendo a largura (`MediaPlaceholder` com `flush`), barra de ações e linha de métricas.
- **Estado vazio** (`components/EmptyState.tsx`): ícone em círculo `bg-(--color-surface-2)`,
  título forte e texto de apoio — nunca um parágrafo solto de "nada encontrado".
- **Chips de filtro**: pill; ativo com `bg-(--color-accent-soft) text-(--color-accent)` e borda
  transparente, inativo com borda `--color-border` sobre `--color-surface`.
- **Título de página interna**: barra em card branco `rounded-2xl` com o texto centralizado.

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
