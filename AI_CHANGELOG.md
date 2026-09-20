# Histórico de alterações para IAs

Este documento mantém a continuidade técnica do Jobê entre diferentes IAs. Toda alteração no
site deve gerar uma entrada nova no topo deste arquivo, conforme a regra do `CLAUDE.md`.

## 2026-09-20 — Cards de produtos reorganizados

### Objetivo

- Melhorar a leitura e o equilíbrio visual dos cards de produtos, principalmente na grade de
  duas colunas do mobile.

### Mudanças

- `components/ProductCard.tsx`
  - O preço saiu da mídia e passou para uma área própria abaixo do título.
  - Promoções agora mostram um badge pequeno de oferta, preço anterior discreto e preço atual em
    destaque, sem o balão grande que quebrava o layout.
  - A área da imagem ficou mais baixa e passou a usar um fundo uniforme na grade.
  - Criador, título, preço e avaliação receberam espaçamento e hierarquia consistentes.
  - O botão circular com seta foi removido; o card inteiro continua sendo o link do produto.
- `components/MediaPlaceholder.tsx`
  - Adicionada a opção `muted` para grades que precisam de placeholders com fundo uniforme.
- `components/PriceTag.tsx`
  - `formatBRL` passou a ser exportado para manter a mesma formatação de preço no novo card.

### Validação

- ESLint, TypeScript e build de produção.
- Conferência dos estados com preço normal, promocional, vídeo e sem avaliações.
- Checagem de cores fixas nos arquivos alterados.

## 2026-09-20 — Pesquisa em tempo real e skeleton de carregamento

### Objetivo

- Atualizar os resultados da página Explorar durante a digitação e edição da pesquisa.
- Dar feedback visual imediato enquanto uma nova consulta está sendo processada.

### Mudanças

- `components/LiveExploreSearch.tsx`
  - Novo campo controlado com atualização automática após 350 ms sem digitação.
  - A tecla Enter antecipa a busca e o botão de limpar remove o termo imediatamente.
  - A URL continua refletindo o termo pesquisado sem rolar a página para o topo.
  - Um skeleton local aparece enquanto a navegação e os novos resultados estão pendentes.
- `app/descobrir/page.tsx`
  - O formulário tradicional com botão Buscar foi substituído pela pesquisa ao vivo.
- `app/descobrir/loading.tsx`
  - O indicador genérico foi substituído por um skeleton responsivo que acompanha o desenho da
    página Explorar.

### Validação

- ESLint, TypeScript e build de produção.
- Verificação do debounce, limpeza, Enter e sincronização do termo na URL.
- Checagem de cores fixas nos arquivos alterados.

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
