# Histórico de alterações para IAs

Este documento mantém a continuidade técnica do Jobê entre diferentes IAs. Toda alteração no
site deve gerar uma entrada nova no topo deste arquivo, conforme a regra do `CLAUDE.md`.

## 2026-09-20 — Explorar com visual mais aberto e editorial

### Objetivo

- Remover a aparência excessivamente baseada em caixas e cartões na página Explorar.
- Dar ao cabeçalho e aos títulos de seção uma composição mais natural, limpa e menos genérica.

### Mudanças

- `app/descobrir/page.tsx`
  - O cabeçalho deixou de ser um card fechado com formas decorativas e virou uma abertura livre,
    com destaque tipográfico e busca integrada.
  - As buscas populares agora são links de texto, sem uma coleção de pills com borda.
  - Títulos de profissionais e serviços perderam ícones em caixas e passaram a usar hierarquia
    tipográfica, espaço e uma linha divisória discreta.
  - O estado vazio deixou de ficar dentro de outro card.
- `components/ExploreFilters.tsx`
  - Categorias e ordenação passaram de chips contornados para abas de texto compactas.
  - O bloco de ordenação perdeu o card externo e o ícone decorativo.
  - O resumo de busca virou uma indicação lateral discreta.
  - O título de produtos deixou de usar ícone dentro de caixa.

### Validação

- ESLint, TypeScript e build de produção.
- Conferência responsiva do fluxo horizontal de categorias e ordenação.
- Checagem de cores fixas nos arquivos alterados.

## 2026-09-20 — Categorias compactas e pesquisa revisada

### Objetivo

- Reduzir o espaço ocupado pelas categorias na página Explorar.
- Remover os ícones decorativos das categorias.
- Verificar e melhorar o comportamento da pesquisa da página.

### Mudanças

- `components/ExploreFilters.tsx`
  - Os oito cartões grandes de categorias e a segunda faixa de chips foram substituídos por uma
    única faixa horizontal compacta.
  - Todas as categorias continuam acessíveis por rolagem horizontal, com as populares primeiro.
  - O filtro continua instantâneo, acessível por teclado e sincronizado com a URL.
- `lib/repositories/ProductRepository.ts`
  - A pesquisa local de produtos passou a ignorar diferenças de acentuação e caixa em título,
    descrição e tags.
- `app/descobrir/page.tsx`
  - A busca de profissionais também passou a ignorar diferenças de acentuação e caixa no nome e
    no nome de usuário.
  - O fluxo foi conferido: produtos usam título/descrição/tags; profissionais usam nome/usuário;
    serviços ativos usam título/descrição no Supabase.
- `CLAUDE.md`
  - Adicionada a obrigação de atualizar este histórico em toda mudança futura do site.

### Validação

- ESLint.
- Build de produção e verificação do TypeScript.
- Busca testada com termos acentuados e sem acento.
- Checagem de cores fixas nos arquivos alterados.

## 2026-09-20 — Cards e filtros da página Explorar

### Mudanças

- `components/ProductCard.tsx`: card redesenhado com mídia mais valorizada, preço sobreposto,
  identificação de vídeo, melhor hierarquia e ação visual.
- `components/ExploreFilters.tsx`: categorias, ordenação e ofertas migradas para estado local,
  removendo o recarregamento perceptível a cada seleção e mantendo a URL sincronizada.
- `app/descobrir/page.tsx`: integração do novo fluxo de filtros sem alterar a busca principal.

### Validação

- ESLint, TypeScript e build de produção concluídos.
