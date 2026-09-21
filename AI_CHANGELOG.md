# Histórico de alterações para IAs

Este documento mantém a continuidade técnica do Jobê entre diferentes IAs. Toda alteração no
site deve gerar uma entrada nova no topo deste arquivo, conforme a regra do `CLAUDE.md`.

## 2026-09-21 — Paleta mais viva (tokens de cor)

### Objetivo

- A pedido do usuário, deixar a própria paleta de cores mais viva (mais saturada), não só o
  layout da home — mudando os valores dos tokens em `app/globals.css`, o que propaga
  automaticamente para toda a aplicação (light e dark), como o design system prevê.

### Mudanças

- `app/globals.css` (`:root` e `:root[data-theme="dark"]`)
  - `--color-accent`/`--color-accent-hover`/`--color-accent-soft`: verde-sálvia mais saturado
    (de `#456c58` para `#146b48` no claro; de `#7fa58f` para `#35c98a` no escuro), mantendo a
    identidade "fechada" da marca mas com bem mais vivacidade.
  - `--color-highlight`/`--color-highlight-hover`/`--color-highlight-soft`: terracota mais
    vibrante (de `#995334` para `#c2491e` no claro; de `#d3906f` para `#ff8a54` no escuro).
  - `--color-verified`: azul mais saturado (`#4f7199` → `#1f74c4` no claro; `#83a8d1` →
    `#4fa8e8` no escuro).
  - `--color-success`/`--color-warning`/`--color-danger`: mesma lógica de saturação aplicada
    aos estados semânticos, mantendo `--color-success` visualmente distinto do accent.
  - `--color-on-accent` no escuro ajustado de `#102018` para `#072013` para preservar contraste
    com o novo verde mais claro/saturado.
  - Nenhum componente foi tocado: como todos já usam os tokens (`bg-(--color-accent)` etc.), a
    mudança de paleta se propagou sozinha para toda a UI.

### Validação

- `grep` pelos hex antigos em `.tsx`/`.ts`/`.css` (fora de `.next`/`node_modules`): nenhuma
  ocorrência — confirma que tudo referencia os tokens, não valores fixos.
- `npm run build`: compilação e checagem de TypeScript concluídas com sucesso (a falha de
  pré-renderização de `/admin` é pré-existente, por falta de `SUPABASE_SERVICE_ROLE_KEY` no
  ambiente local, não relacionada a esta mudança).
- Contraste recalculado (WCAG) para os pares mais usados: `--color-on-accent` sobre
  `--color-accent` ≈ 5,3:1 no claro e ≈ 7,9:1 no escuro; `--color-accent` sobre
  `--color-accent-soft` ≈ 5,4:1 no claro; `--color-on-highlight` sobre `--color-highlight`
  ≈ 4,9:1 no claro — todos dentro do mínimo de 4,5:1 para texto normal em componentes-chave
  (CTAs, badges).

## 2026-09-21 — Mais cor viva na página inicial

### Objetivo

- Deixar a página inicial mais viva visualmente, sem sair da paleta Marfim + Sálvia nem
  introduzir cor fora dos tokens existentes.

### Mudanças

- `app/page.tsx`
  - Hero: gradiente radial passou a combinar `--color-highlight-soft` (canto superior direito)
    com `--color-accent-soft` (canto inferior esquerdo), em vez de um único tom neutro.
  - Faixa de destaques ("Preço visível" / "Conversa antes de fechar" / "Compra em um só
    lugar"): trocou divisórias finas em fundo neutro por três pílulas coloridas
    (`--color-accent-soft`/`--color-accent` e `--color-highlight-soft`/`--color-highlight`
    alternados), dando mais peso visual à seção.
  - Categorias: cada card ganhou uma barrinha colorida acima do título, alternando
    `--color-accent` e `--color-highlight` por item.
  - "Como funciona": os números de passo (01/02/03) passaram de texto simples para um círculo
    preenchido com `--color-accent-soft`/`--color-accent`.
- Nenhum token novo foi necessário; todas as cores usadas já existiam em `app/globals.css`.

### Validação

- `grep` por hex e por classes de paleta fixa do Tailwind em `app/page.tsx`: nenhuma ocorrência.
- `npx eslint app/page.tsx`: sem erros.
- `npm run build`: compilação e checagem de TypeScript concluídas com sucesso (a falha de
  pré-renderização de `/admin` é pré-existente, por falta de `SUPABASE_SERVICE_ROLE_KEY` no
  ambiente local, e não relacionada a esta mudança).

## 2026-09-21 — Home com presença comercial

### Objetivo

- Dar à página inicial aparência clara de marketplace, mantendo a paleta confortável e a
  identidade humana do Jobê.
- Exibir ofertas reais antes de categorias e conteúdo explicativo.

### Mudanças

- `app/page.tsx`
  - Hero orientado a busca, comparação e contratação, com CTA para explorar e para vender.
  - Bloco lateral diferencia serviços, produtos digitais e Jogue comigo.
  - Vitrine real movida para cima; categorias, como funciona e comunidade vêm depois.
  - Vitrine e comunidade separadas em Suspense próprios e compartilham uma leitura memoizada
    no servidor, evitando consultas duplicadas e JavaScript adicional no navegador.
  - Atalhos ganharam formato de ação e skeletons específicos para cada trecho.
- `app/globals.css` e `CLAUDE.md`
  - Adicionados tokens terracota de highlight para ofertas e energia comercial, sem substituir
    o verde-sálvia dos CTAs principais.
- `components/ProductCard.tsx` e `components/PriceTag.tsx`
  - Ofertas e preços promocionais usam o novo highlight quente.
- `docs/HOME_REDESIGN.md` atualizado com a nova hierarquia e decisão de cor.

### Validação

- ESLint, TypeScript e build de produção.
- Checagem de cores fixas, diff e reutilização da consulta no servidor.
- Contraste do terracota sobre fundo suave: 4,56:1; texto branco sobre terracota: 5,77:1.
- Smoke test da home em servidor de produção, confirmando resposta HTML e CTAs principais.

## 2026-09-21 — Paleta Marfim + Sálvia

### Objetivo

- Substituir o verde vivo por uma identidade mais calma, amigável e confortável para leitura.
- Garantir contraste adequado nos textos, botões e estados semânticos do tema claro.
- Preparar o tema escuro para usar texto próprio sobre o accent, sem presumir branco.

### Mudanças

- `app/globals.css`
  - Fundo marfim, superfícies neutras, textos grafite esverdeados e verde-sálvia fechado.
  - Estados de sucesso, atenção, erro e verificação ficaram menos saturados.
  - Criado o token `--color-on-accent`, branco no tema claro e escuro profundo no tema escuro.
- Componentes e páginas com CTA verde passaram de `text-white` para
  `text-(--color-on-accent)`, preservando legibilidade nos dois temas.
- `CLAUDE.md` e `docs/HOME_REDESIGN.md` atualizados para tornar Marfim + Sálvia a referência
  do projeto e impedir que a paleta anterior volte em alterações futuras.

### Contraste medido

- Texto principal sobre o fundo: 12,43:1.
- Texto secundário sobre o fundo: 5,73:1.
- Texto sutil sobre o fundo marfim: 4,61:1; sobre superfície branca: 5,03:1.
- Texto do CTA sobre o verde-sálvia: 5,93:1.
- Verde-sálvia sobre o fundo suave de accent: 4,92:1.

### Validação

- ESLint, TypeScript e build de produção.
- Checagem dos tokens e dos CTAs que usam fundo de accent.
- Conferência contra cores fixas fora do arquivo central de tokens.

## 2026-09-21 — Home orientada à descoberta e contratação

### Objetivo

- Adaptar princípios úteis de VintePila, Workana e Packzin à página inicial,
  preservando o feed, as funções existentes e a paleta Milky + Mantis.

### Mudanças

- `app/page.tsx`: busca com rótulo acessível, sugestões, atalhos por objetivo,
  navegação por âncoras, categorias compactas, vitrine condicional, profissionais
  reais, feed expansível, como funciona, chamada para criadores e FAQ nativo.
- Removida a dependência de perfis mock da home. Autores de produtos e serviços
  são resolvidos em uma consulta em lote, sem ranking artificial.
- Mantidos ISR de 60 s e componentes existentes; catálogo isolado com Suspense,
  skeleton e tratamento de falhas parciais. Consultas limitadas e paralelas.
- `docs/HOME_REDESIGN.md`: referências, decisões, limites, roteiro de validação
  e possibilidades futuras. Nenhuma migration ou alteração de pagamentos.

### Validação

- Lint, TypeScript e build completo aprovados com variáveis fictícias de teste.
- Leitura pública real de produtos, serviços e perfis aprovada.
- HTML gerado verificado, incluindo o estado de indisponibilidade.
- Segundo build com chave publicável real aprovado: HTML da home contém serviços
  e feed reais, sem aviso de falha. Service role fictícia apenas para satisfazer
  a configuração de build preexistente; nenhuma escrita ou teste administrativo.
- Revisão de cores e diff; nenhuma nova dependência do projeto.
- Validação visual e de cliques pendente: navegador indisponível por falhas de
  instalação (certificado/timeout). Não foram medidos Core Web Vitals.

## 2026-09-21 — Paleta definitiva: Milky + Mantis

### Objetivo

- Depois de 13 paletas testadas nesta sessão, o usuário escolheu **Milky + Mantis** (já tinha
  sido testada antes, ver entrada "Teste de paleta: Milky + Mantis") como a paleta definitiva do
  Jobê. Diferente das entradas anteriores desta sequência (todas marcadas como "teste,
  substituível a qualquer momento"), esta fecha a identidade visual — por isso também atualizei
  o `CLAUDE.md`, que ainda descrevia o sistema antigo (laranja + cinza-névoa).

### Mudanças

- `app/globals.css`: tema claro e escuro voltam exatamente aos valores da paleta Milky/Mantis
  (fundo creme `#fffdf1`, accent verde `#59c749`) — mesmos hex já validados na entrada anterior,
  reaplicados por cima da última paleta de teste (Barley White/Mikado Yellow).
- `CLAUDE.md`:
  - Trocado "laranja como cor de marca" / "fundo cinza-névoa frio" pela descrição real (verde
    Mantis / creme Milky).
  - Exemplo de hex "cru" da regra de ouro atualizado de `#f5821f` (laranja antigo) pra `#59c749`
    (verde atual).
  - Nota sobre `--color-success` reescrita: a justificativa antiga ("verde destoa da paleta
    laranja+cinza") não fazia mais sentido com o accent sendo verde. A regra em si continua
    valendo (badge positivo usa `bg-(--color-accent-soft) text-(--color-accent)`, nunca
    `--color-success`) — só a razão mudou: `--color-success` é um verde **diferente** do accent,
    e os dois lado a lado confundiriam duas semânticas distintas (aprovado vs. mensagem de
    sucesso).
  - Badge de verificado: "separado do `--color-accent` laranja" → "separado do `--color-accent`
    verde".

### Ponto que continua em aberto (não resolvido nesta entrada)

- `--color-success` (`#1f9d55`) e `--color-accent` (`#59c749`) continuam sendo dois verdes
  parecidos, mesmo com a regra do CLAUDE.md minimizando o uso de `--color-success` em badges. Se
  algum dia esses dois tons precisarem aparecer juntos na mesma tela, vale revisitar se um dos
  dois deveria mudar de matiz — não fiz isso agora porque o usuário só pediu pra fixar a paleta,
  não pra resolver esse ponto.

### Validação

- `tsc --noEmit`: sem erros.
- `grep` por "laranja"/"cinza-névoa" no `CLAUDE.md`: nenhuma ocorrência restante.

## 2026-09-21 — Teste de paleta: Barley White + Mikado Yellow

### Objetivo

- Décimo terceiro teste de paleta seguido: Barley White `#FFF4CC` e Mikado Yellow `#FFBE00`.
  Substitui a paleta Cotton/Electric Blue/Moonless Night da entrada anterior.

### Mapeamento pros tokens

- **Barley White** → `--color-bg` no tema claro; reaproveitado como `--color-text` no escuro.
- **Mikado Yellow** → `--color-accent`/`--color-accent-hover`, mesmo hex nos dois temas (é claro
  o bastante pra funcionar como texto/ícone sobre fundo escuro).
- `--color-text` no claro foi pra um marrom bem escuro (`#2b2100`) em vez do neutro, mesma
  família do amarelo. `--color-surface-2`/`--color-border`/`--color-accent-soft` derivados em
  tons de âmbar/dourado claro.

### Alerta mais forte desta sequência de testes: contraste, não só combinação de cor

- Nas entradas anteriores os avisos eram sobre **duas cores da mesma família aparecendo em
  contextos diferentes** (dourado×dourado, verde×verde, vermelho×vermelho) — incômodo visual,
  mas ainda legível. Aqui o problema é outro e mais sério: **amarelo vibrante com texto branco
  em cima tem contraste muito baixo** (a conta de luminância dá around 1.6:1 — bem abaixo do
  mínimo de acessibilidade). E o app fixa `text-white` (branco literal, não um token) em 52
  lugares que usam `bg-(--color-accent)` — ver a mesma observação já feita na entrada
  monocromática (Pale Ash/Black Ink). Lá o problema só existia no tema escuro; aqui existe
  **nos dois temas**, porque Mikado Yellow já nasce claro. Isso significa que, com esta paleta,
  praticamente todo botão de call-to-action do site (comprar, aceitar, publicar, enviar
  proposta) fica com o texto difícil de ler. Implementei do jeito que foi pedido (o hex exato),
  mas se esta for a paleta escolhida de verdade, o próximo passo obrigatório não é ajustar o
  token — é trocar `text-white` por uma cor escura nesses 52 lugares (ou um novo token
  `--color-accent-text` que já nasça correto pra cada paleta).

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário — praticamente obrigatório desta vez, dado o
  problema de contraste descrito acima.

## 2026-09-21 — Teste de paleta: Cotton + Electric Blue + Moonless Night

### Objetivo

- Décimo segundo teste de paleta seguido: Cotton `#F4F3F1`, Electric Blue `#3171C6`, Moonless
  Night `#2D2D2D`. Substitui a paleta Milano Red/Cararra da entrada anterior — some o risco de
  confusão accent×danger que eu tinha avisado ali, já que o accent volta a ser azul.

### Mapeamento pros tokens

- **Cotton** → `--color-bg` no tema claro; reaproveitado como `--color-text` no escuro.
- **Electric Blue** → `--color-accent`/`--color-accent-hover`. No tema escuro, uma versão um
  pouco mais clara do mesmo azul (`#4a86d6`) em vez do hex exato — dá mais margem de contraste
  como texto/ícone direto sobre o fundo escuro, sem precisar de uma clareada tão grande quanto a
  do Royal Blue/Milano Red (Electric Blue já não era tão escuro assim).
- **Moonless Night** → `--color-text` no tema claro; `--color-bg` no tema escuro.
- `--color-surface-2`/`--color-border`/`--color-accent-soft` derivados na mesma família
  cinza-azulada, nos dois temas.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram —
  `--color-verified` (azul) volta a ficar na mesma família do novo accent (mesma observação já
  feita quando testamos Royal Blue), mas sem o risco mais sério de confusão com danger que a
  paleta anterior tinha.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-21 — Teste de paleta: Milano Red + Cararra

### Objetivo

- Décimo primeiro teste de paleta seguido: Milano Red `#BB080B` (vermelho profundo) e Cararra
  `#F0EDE8` (bege/cinza quente). Substitui a paleta Peach/Lilac Ice da entrada anterior.

### Mapeamento pros tokens

- **Cararra** → `--color-bg` no tema claro; reaproveitado como `--color-text` no escuro.
- **Milano Red** → `--color-accent`/`--color-accent-hover` no tema claro. No tema escuro o
  accent precisou clarear (`#e8353a`) pelo mesmo motivo do Royal Blue e do cinza monocromático:
  o tom original é escuro demais pra funcionar como texto/ícone direto sobre um fundo já escuro.
- `--color-text`, `--color-surface-2`/`--color-border`/`--color-accent-soft` derivados na mesma
  família bege/vermelho quente, nos dois temas.

### Ponto de atenção importante (avisado ao usuário antes de implementar)

- `--color-danger` (`#c0392b` no claro, `#c9484e` no escuro — usado em recusar/cancelar/excluir/
  denúncia) já era vermelho, e agora o `--color-accent` (Milano Red) **também é vermelho, num
  tom bem próximo**. Diferente das outras observações de "cores parecidas" desta sequência
  (dourado×dourado, verde×verde), este é o par mais arriscado até agora: um usuário pode ler um
  botão de accent (comprar, aceitar) e um botão de perigo (recusar, cancelar, excluir) como a
  mesma cor, especialmente lado a lado numa mesma tela (ex.: card de proposta com "Aceitar" e
  "Recusar"). Não ajustei `--color-danger` porque não fazia parte da paleta pedida, mas se os
  dois botões ficarem confusos na prática, a correção certa é afastar `--color-danger` do
  vermelho (pra um tom mais alaranjado ou naming diferente), não o contrário.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário — atenção especial a telas com botões de
  accent e de perigo lado a lado (ex.: card de proposta na conversa).

## 2026-09-21 — Teste de paleta: Peach + Lilac Ice

### Objetivo

- Décimo teste de paleta seguido: Peach `#FF8C36` (laranja) e Lilac Ice `#F6F5FF` (lavanda bem
  clara). Substitui a paleta monocromática Pale Ash/Black Ink da entrada anterior. Estrutura
  parecida com o primeiro teste da sequência (laranja + lavanda clara), tons diferentes.

### Mapeamento pros tokens

- **Lilac Ice** → `--color-bg` no tema claro; reaproveitado como `--color-text` no escuro.
- **Peach** → `--color-accent`/`--color-accent-hover` — mesmo hex nos dois temas (laranja é
  claro/saturado o bastante pra funcionar como texto/ícone direto sobre fundo escuro, sem
  precisar do ajuste que Royal Blue e o cinza monocromático da entrada anterior precisaram).
- `--color-text` no claro foi pra um roxo bem escuro (`#1c1a29`) em vez do neutro cinza-chumbo,
  pra ficar na mesma família da lavanda. `--color-surface-2`/`--color-border`/`--color-accent-soft`
  derivados na mesma lógica lavanda/pêssego, nos dois temas.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-21 — Teste de paleta: Pale Ash + Black Ink (monocromática)

### Objetivo

- Nono teste de paleta seguido. Diferente de todas as anteriores: só duas cores neutras, **sem
  nenhum accent colorido** — Pale Ash `#E5E5E5` e Black Ink `#1C1C1C`. Substitui a paleta Deep
  Charcoal/Gold Green/Apricot White da entrada anterior.

### Mapeamento pros tokens e um problema real que isso expôs

- **Pale Ash** → `--color-bg` no tema claro; reaproveitado como `--color-text` no escuro.
- **Black Ink** → `--color-text` no tema claro; `--color-bg` no tema escuro.
- Sem uma terceira cor de accent, a leitura mais fiel ao print é um design monocromático: CTA
  também em preto/cinza, não colorido — `--color-accent` = Black Ink no tema claro.
- **Isso esbarrou num problema real**: 52 lugares no código usam literalmente
  `bg-(--color-accent) text-white` (texto branco fixo, não um token) — funcionava em todas as
  paletas anteriores porque o accent sempre foi uma cor de saturação média/alta. Se o
  `--color-accent` do tema escuro virasse Pale Ash (quase branco, pra "inverter" como nas
  entradas anteriores), esses 52 botões ficariam com texto branco sobre fundo quase branco —
  ilegível. Por isso, **só nesta entrada**, o accent do tema escuro não é a cor clara invertida:
  é um cinza médio (`#4a4a4a`) escolhido especificamente pra manter esse texto branco
  fixo legível, com hover mais claro (`#666666`) e um badge/soft bem mais claro (`#d5d5d5`) pra o
  texto do accent (agora cinza médio) continuar visível em cima.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram — nesta
  paleta eles são as ÚNICAS cores saturadas que sobram na tela, o que pode ficar estranho
  (destoam mais do que em qualquer paleta anterior, já que tudo o resto é cinza/preto/branco).

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário — vale prestar atenção especial nos botões de
  CTA no tema escuro, é o ponto mais delicado desta entrada.

## 2026-09-21 — Teste de paleta: Deep Charcoal + Gold Green + Apricot White

### Objetivo

- Oitavo teste de paleta seguido: Deep Charcoal `#222222`, Gold Green `#CAC426`, Apricot White
  `#EED3BA`. Substitui a paleta Titan White/Crocus Purple/Ebony Clay da entrada anterior.

### Mapeamento pros tokens

- **Apricot White** → `--color-bg` no tema claro (creme quente, não mais lavanda); reaproveitado
  como `--color-text` no tema escuro.
- **Gold Green** → `--color-accent`/`--color-accent-hover` — oliva/verde-dourado, mesmo hex nos
  dois temas (é claro o bastante pra funcionar como texto/ícone direto sobre fundo escuro, igual
  ao Crocus Purple da entrada anterior — só o hover que muda de direção: mais escuro no claro,
  mais claro no escuro).
- **Deep Charcoal** → `--color-text` no tema claro; `--color-bg`/`--color-surface` no tema
  escuro (encaixa bem com o nome — "Deep" já sugeria fundo escuro).
- `--color-surface-2`/`--color-border`/`--color-accent-soft` derivados na mesma família
  creme/oliva quente, nos dois temas.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Ponto de atenção

- `--color-warning` (`#b58a1a`, dourado-acastanhado) e o novo `--color-accent` (Gold Green,
  também um dourado-esverdeado) ficam de novo próximos em família de cor — mesma observação já
  feita na entrada de Sunglow. Não ajustei por não fazer parte da paleta pedida.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-21 — Teste de paleta: Titan White + Crocus Purple + Ebony Clay

### Objetivo

- Sétimo teste de paleta seguido: Titan White `#EBF0FF`, Crocus Purple `#9687F5`, Ebony Clay
  `#2D284B`. Substitui a paleta Royal Blue/Light Cream da entrada anterior.

### Mapeamento pros tokens

- **Titan White** → `--color-bg` no tema claro; reaproveitado como `--color-text` no tema
  escuro (mesmo truque de sempre: cor clara vira texto quando o fundo escurece).
- **Crocus Purple** → `--color-accent`/`--color-accent-hover` — dessa vez o mesmo hex funciona
  nos dois temas sem precisar clarear pro escuro (diferente das duas entradas anteriores com
  Royal Blue): Crocus Purple já é claro o bastante pra servir de texto/ícone direto sobre um
  fundo escuro.
- **Ebony Clay** → `--color-text` no tema claro (encaixou bem como texto principal, já que é um
  roxo bem escuro) e `--color-bg`/`--color-surface` no tema escuro.
- `--color-surface-2`/`--color-border`/`--color-accent-soft` derivados na mesma família
  lavanda/roxo, nos dois temas.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-21 — Teste de paleta: Royal Blue + Light Cream

### Objetivo

- Sexto teste de paleta seguido: Royal Blue `#014BAA` e Light Cream `#F8F3F0` — só duas cores
  desta vez (print de post de design, não relacionado ao projeto). Substitui a paleta Royal
  Blue/Light Grey/Sky Blue da entrada anterior (mesmo nome "Royal Blue", hex ligeiramente
  diferente — `#014BAA` em vez de `#10367D`).

### Mapeamento pros tokens

- **Light Cream** → `--color-bg` no tema claro.
- **Royal Blue** → `--color-accent`/`--color-accent-hover` no tema claro; `--color-accent-soft`
  ganhou um azul bem claro derivado dele (não fazia parte do print, mas segue o mesmo princípio
  de contraste das entradas anteriores: accent escuro precisa de um tom claro pra funcionar como
  fundo de badge).
- Tema escuro: mesma solução da entrada anterior — Royal Blue é escuro demais pra virar texto
  direto sobre fundo já escuro, então o accent no escuro usa uma versão mais clara do mesmo azul;
  `--color-text` do escuro reusa o Light Cream.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-21 — Teste de paleta: Royal Blue + Light Grey + Sky Blue

### Objetivo

- Quinto teste de paleta seguido (mesmo contexto de liberdade das entradas anteriores): Royal
  Blue `#10367D`, Light Grey `#EBEBEB`, Sky Blue `#74B4D9` — sem legenda de
  dominante/secundária/accent desta vez, mandado só como print de 3 blocos de cor.

### Mapeamento pros tokens

- **Light Grey** → `--color-bg` (quase o mesmo valor do cinza-névoa original do Jobê, antes de
  toda essa sequência de testes) — volta a ser um fundo neutro claro, não colorido como nas
  entradas anteriores.
- **Royal Blue** → `--color-accent`/`--color-accent-hover` no tema claro — CTAs, preços, estado
  ativo.
- **Sky Blue** → `--color-accent-soft` no tema claro (fundo de badge/chip ativo, com texto na cor
  Royal Blue por cima — contraste bom, azul escuro sobre azul claro).
- `--color-surface-2`/`--color-border` derivados numa família cinza-azulada leve, entre o fundo e
  o branco dos cards.
- **Tema escuro quebra o padrão das 4 entradas anteriores**: nelas, `--color-accent` era
  idêntico nos dois temas. Aqui não dá — Royal Blue é escuro demais pra funcionar como cor de
  texto/ícone direto sobre um fundo já escuro (ficaria ilegível). Então no escuro
  `--color-accent` vira uma versão mais clara do mesmo azul (`#4a85d6`), e Sky Blue passa a ser o
  `--color-accent-hover` (mais claro ainda) em vez do soft; `--color-text` do tema escuro reusa o
  Light Grey (mesmo truque das entradas anteriores, cor clara virando texto no escuro).
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram — note que
  `--color-verified` (`#3b82f6`) já era um azul, agora parecido em família com o novo accent; não
  ajustei por não fazer parte da paleta pedida.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-21 — Teste de paleta: Milky + Mantis

### Objetivo

- Quarto teste de paleta seguido (mesmo contexto de liberdade dado pelo usuário nas entradas
  anteriores): Milky `#FFFDF1` (creme) e Mantis `#59C749` (verde vibrante). Diferente das duas
  anteriores, essa é uma paleta **clara** — volta o site a abrir com fundo claro por padrão.

### Mapeamento pros tokens

- **Milky** → `--color-bg` (fundo creme) e base do `--color-text` do tema escuro (ver abaixo).
  `--color-surface` (cards) ficou branco puro, um tom acima do creme, mesmo princípio de
  separação card/fundo das entradas anteriores.
- **Mantis** → `--color-accent`/`--color-accent-hover` — CTAs, preços, estado ativo.
- `--color-text` no tema claro foi pra um verde bem escuro (`#182619`, quase preto com leve
  matiz verde) em vez do neutro anterior, pra manter tudo na mesma família de cor.
  `--color-text-muted`/`--color-text-subtle`, `--color-surface-2`/`--color-border` e
  `--color-accent-soft` são derivados da mesma família (verde claro/creme).
- Tema escuro: inverte a lógica (fundo bem escuro com leve matiz verde, texto no tom Milky).
- `--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Ponto de atenção

- `--color-success` (`#1f9d55`, usado em confirmações — pouco exercitado no app hoje, ver regra
  do CLAUDE.md sobre preferir laranja/accent pra positivo) é outro tom de **verde**, agora bem
  parecido com o novo `--color-accent` (Mantis). Se algum lugar específico usar as duas cores
  lado a lado, pode ficar confuso "isso é sucesso ou é o botão de ação?". Não mudei
  `--color-success` porque não fazia parte da paleta pedida.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-20 — Teste de paleta: Midnight Blue + Neon Purple + Ice White

### Objetivo

- Mais um print de paleta pra testar (segundo teste seguido, mesmo processo de "ignorar
  CLAUDE.md por enquanto" da entrada anterior): Midnight Blue `#1E1E2F`, Neon Purple `#8A2BE2`,
  Ice White `#F4F6FC`. Substitui a paleta Dark Purple/Wisteria/Sunglow do teste anterior.

### Mapeamento pros tokens

- **Midnight Blue** → `--color-bg`/`--color-surface` (fundo geral e cards, com o card um tom
  mais claro que o fundo pra dar separação) — continua dark-first, como o teste anterior.
- **Neon Purple** → `--color-accent`/`--color-accent-hover` — CTAs, preços, estado ativo, no
  lugar do dourado.
- **Ice White** → `--color-text` (texto principal), usado no hex exato dado.
- `--color-text-muted`/`--color-text-subtle`, `--color-surface-2`/`--color-border` e
  `--color-accent-soft` foram derivados pra manter a mesma disciplina de contraste das entradas
  anteriores (texto claro sobre fundo escuro, nunca claro sobre claro).
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados (o escuro é uma versão ainda mais profunda
  do mesmo esquema, mesma lógica das duas entradas anteriores).

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário.

## 2026-09-20 — Teste de paleta: Dark Purple + Wisteria + Sunglow

### Objetivo

- Usuário mandou print de uma paleta de 3 cores (dominante/secundária/accent) pra testar no
  site: Dark Purple `#210B2C` (dominante), Wisteria `#BC96E6` (secundária), Sunglow `#FFD166`
  (accent). Substitui a paleta laranja+azul-gelo da entrada anterior — troca explícita, não uma
  adição.

### Mapeamento pros tokens

- **Dark Purple** → `--color-bg`/`--color-surface` (fundo geral e cards, num tom levemente mais
  claro que o fundo pra dar separação) — o site passa a abrir com fundo escuro por padrão em vez
  de claro (decisão explícita do usuário pra este teste; `color-scheme: only light` permanece
  como estava, não afeta a estética, só o hint de widgets nativos do navegador).
- **Sunglow** → `--color-accent`/`--color-accent-hover` — CTAs, preços, estado ativo, no lugar
  do laranja.
- **Wisteria** → em vez de virar fundo de painel (`--color-surface-2`), virou a cor do **texto
  secundário** (`--color-text-muted`). Motivo: como o fundo agora é bem escuro e o texto
  primário é quase branco, usar Wisteria (claro) como fundo de painel deixaria qualquer texto
  claro em cima dele ilegível (claro sobre claro). Como cor de texto direto sobre o fundo roxo
  escuro, o contraste é ótimo e a cor aparece de verdade em nomes de usuário, legendas,
  horários — muito mais visível do que confinada a um painel que quase não aparece na tela.
  `--color-text-subtle` ganhou uma versão mais escura/dessaturada do mesmo Wisteria, mantendo a
  hierarquia de texto.
- `--color-surface-2`/`--color-border` ficaram numa família de roxo intermediária (nem tão
  escura quanto o fundo, nem clara como o Wisteria) — mantém painéis/hover/divisores legíveis
  com o texto claro que já existe em todo o app.
- `--color-success`/`--color-warning`/`--color-danger`/`--color-verified` não mudaram.

### Mudanças

- `app/globals.css`: tema claro e escuro atualizados com a paleta acima (o escuro é uma versão
  ainda mais profunda do mesmo esquema, já que a paleta em si já nasceu escura).

### Ponto de atenção

- `--color-warning` (dourado-acastanhado, `#b58a1a`) ficou visualmente próximo do novo
  `--color-accent` (Sunglow, `#ffd166`) — os dois lêem como "dourado". Não mudei porque não fazia
  parte da paleta pedida, mas se causar confusão entre "aviso" e "call-to-action" na prática, é
  candidato a ajuste.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário — é uma mudança de identidade bem mais radical
  que a anterior (site inteiro passa a ter fundo escuro).

## 2026-09-20 — Redesenho da paleta: Ice Cream Blue ganha presença real

### Objetivo

- Usuário pediu explicitamente pra eu redesenhar a paleta com liberdade total ("pode colocar do
  jeito que achar melhor, pode ignorar o CLAUDE.md nesse momento") — resposta direta ao ponto de
  atenção que eu tinha levantado na entrada anterior: laranja sobre o azul gelo, usado só como
  `--color-accent-soft`, tinha contraste baixo demais pra texto de badge, e o azul mal aparecia
  no resto do site.

### Decisão de design

- **Atomic Orange continua a cor de marca** (`--color-accent`) — CTAs, preços, estado ativo,
  como já estava.
- **Ice Cream Blue passa a ter presença de verdade no site**, em vez de ficar restrito a um
  token pequeno: vira a base do fundo geral (`--color-bg`, num tom bem claro) e das superfícies
  secundárias/hover (`--color-surface-2`) nos dois temas. Cards continuam brancos
  (`--color-surface`) — o contraste entre card branco e fundo azulado é o que dá a sensação de
  "sorvete" (creme + laranja) em vez de cinza-névoa neutro.
- **`--color-accent-soft` volta a ser um tom claro do próprio laranja** (não mais o azul) — troca
  que resolve o problema de contraste: texto laranja em cima de pêssego claro tem a mesma
  qualidade de legibilidade que o esquema original, só que com o novo tom de laranja.
- `--color-verified` (selo azul de verificado) e as cores semânticas (success/warning/danger)
  não mudaram.

### Mudanças

- `app/globals.css`
  - Tema claro: `--color-bg: #eaf8fc` (era `#f5f6f8`, cinza neutro); `--color-surface-2: #c8f3ff`
    (era `#eceef2`, cinza neutro — agora é o Ice Cream Blue puro); `--color-border: #a9e2ef`
    (era `#e4e7ec`, ajustado pra combinar com o novo fundo/superfície); `--color-accent-soft:
#ffe1d2` (pêssego claro derivado do novo laranja, era o azul gelo na entrada anterior).
  - Tema escuro: `--color-bg: #0d1b20`, `--color-surface: #15262c`, `--color-surface-2: #1d3540`
    (análogos escuros da mesma família azul-petróleo, substituindo os cinzas neutros anteriores);
    `--color-border: #2a4750`; `--color-accent-soft: #40200f` (marrom-pêssego escuro, mesma
    lógica do claro).
  - `--color-accent`/`--color-accent-hover` (o laranja em si) não mudaram nesta entrada — só a
    entrada anterior já tinha trocado para `#ff5c23`.

### Validação

- `tsc --noEmit`: sem erros.
- Teste visual pendente de confirmação do usuário — como isso muda o fundo geral de toda
  página (não só um token isolado), vale conferir várias telas (feed, dashboard, conversa) antes
  de considerar fechado.

## 2026-09-20 — Nova paleta: Atomic Orange + Ice Cream Blue

### Objetivo

- Atualizar a cor de marca do Jobê a pedido do usuário: "Atomic Orange" (`#FF5C23`) e "Ice Cream
  Blue" (`#C8F3FF`).
- Decisão confirmada com o usuário antes de mexer (impacto visual em todo o site): Atomic Orange
  substitui `--color-accent` (óbvio — é a nova cor de marca); Ice Cream Blue substitui
  especificamente `--color-accent-soft` (fundo dos chips/badges ativos), não `--color-verified`
  nem um token à parte.

### Mudanças

- `app/globals.css`
  - Tema claro: `--color-accent: #ff5c23` (era `#f5821f`); `--color-accent-hover: #e04a15`
    (versão mais escura, mesma relação de contraste que já existia); `--color-accent-soft:
#c8f3ff` (era um pêssego bem claro derivado do laranja antigo — agora é o azul gelo).
  - Tema escuro: `--color-accent: #ff5c23`; `--color-accent-hover: #ff7d4f` (versão mais clara,
    mesma relação que já existia no escuro); `--color-accent-soft: #123540` (análogo escuro do
    azul gelo — usar o mesmo tom claro de `#c8f3ff` como fundo no escuro ficaria estourado；
    mantém o matiz, ajusta luminosidade pro tema).
  - `--color-verified` (selo azul de verificado) e as cores semânticas
    (success/warning/danger) não mudaram — continuam com os valores antigos, como confirmado.
  - `grep` por hex antigo (`f5821f`, `dd6f10`, `fdead6`, `ff9a40`, `3a2712`) no repo inteiro:
    nenhuma ocorrência fora de `globals.css` — a paleta já era 100% centralizada em tokens, sem
    cor hardcoded em componente nenhum, então a troca não exigiu tocar em mais nenhum arquivo.

### Ponto de atenção (não implementado — decisão de design, não bug)

- `--color-accent-soft` (`#c8f3ff`) é usado como fundo de chip com **texto na cor
  `--color-accent`** (`bg-(--color-accent-soft) text-(--color-accent)`, o padrão de badge
  ativo/positivo do Jobê). No tema claro, laranja `#ff5c23` sobre azul gelo `#c8f3ff` tem
  contraste baixo (abaixo do mínimo recomendado pra texto pequeno) — legível, mas menos nítido
  que a combinação anterior (laranja sobre pêssego, mesma família de cor). Se algum badge
  específico ficar difícil de ler na prática, a correção é ajustar só o tom do azul (mais escuro)
  ou a cor do texto naquele componente, não reverter a decisão de paleta.

### Validação

- `tsc --noEmit`: sem erros (CSS não passa por TypeScript/ESLint, validado visualmente pela
  ausência de qualquer outra ocorrência hardcoded no repo).
- Teste visual pendente de confirmação do usuário.

## 2026-09-20 — Correção: comprador perdia acesso ao produto despublicado

### Objetivo

- Reportado pelo usuário: o produto some da biblioteca do comprador depois que o criador
  despublica o anúncio.

### Causa

- RLS de `products` só tinha duas policies de `SELECT`: público vê `status = 'approved'`, dono vê
  as próprias linhas. Nenhuma delas cobre "comprador com `product_entitlements` ativo, mas o
  produto não é mais `approved`" — então `listOwnedProductsForUser` (biblioteca) simplesmente
  parava de enxergar a linha assim que o criador despublicava (`status` vira `draft`). O acesso
  já tinha sido pago e concedido; a compra não deveria depender do anúncio continuar publicado.
- No mesmo caminho: `delete_product` não tinha nenhuma proteção contra apagar um produto que já
  tivesse `product_entitlements` — a constraint de chave estrangeira (sem `ON DELETE`) até
  impedia o `DELETE`, mas com um erro cru de Postgres em vez de uma mensagem que fizesse sentido.

### Mudanças

- Supabase: nova policy `products_select_entitled_buyer` — quem tem entitlement ativo pro
  produto continua enxergando a linha independentemente do `status` atual.
- `delete_product` (RPC) agora barra explicitamente a exclusão de um produto com pelo menos um
  `product_entitlements`, com mensagem orientando a despublicar em vez de excluir.

### Validação

- `get_advisors` (security) checado depois das duas mudanças: nenhum alerta novo.
- Reprodução manual pendente de confirmação do usuário.

## 2026-09-20 — Correção: erro de servidor ao abrir perfil de criador mock

### Objetivo

- Reportado pelo usuário: "This page couldn't load. A server error occurred." ao entrar numa
  conta e clicar para ir a um perfil de criador.

### Causa

- A home ainda mistura criadores reais com criadores fictícios de demonstração
  (`userRepository.findCreators()` concatena `profiles` reais com o array mock de
  `lib/data/users.ts`). Ao abrir o perfil de um criador fictício, `getProfileByUsername` não
  encontra linha real, e `app/criadores/[username]/page.tsx` cai no fallback
  `userRepository.findByUsername` — que devolve um `creator.id` como `"user-c01"`, não um uuid.
  Antes, os produtos desse criador vinham de um array em memória (`Array.filter`, nunca lança
  erro para um id que não bate com nada). Com a fatia anterior (produtos reais), a mesma busca
  virou uma consulta Postgres contra uma coluna `uuid` — e um valor como `"user-c01"` faz o
  próprio banco rejeitar a consulta (erro de cast), não devolver uma lista vazia. Isso derrubava
  a página inteira com erro 500.

### Mudanças

- `app/criadores/[username]/page.tsx`: produtos, avaliações, portfólio e currículo reais só são
  buscados quando existe de fato um perfil real (`realProfile`) por trás — criador mock cai
  direto nas quatro listas vazias, igual ao comportamento antigo.
- `lib/supabase/products.ts`: `listProductsForCreator`, `getPublicProductById` e
  `getProductOrderById` ganharam uma checagem de formato de uuid antes de consultar o Postgres —
  qualquer id que não seja um uuid válido (criador mock, URL adulterada, etc.) devolve
  vazio/`null` em vez de propagar um erro. Blinda a causa raiz, não só o ponto que quebrou desta
  vez — protege qualquer chamador futuro que ainda misture ids mock com dados reais.

### Validação

- `tsc --noEmit` e `eslint` nos arquivos alterados: sem erros.
- Reprodução manual pendente de confirmação do usuário.

## 2026-09-20 — Correção: RLS bloqueava publicar produto

### Objetivo

- Reportado pelo usuário ao testar a fatia anterior: `new row violates row-level security policy
for table "products"` ao clicar em "Publicar produto" em `/dashboard/produtos/novo`.

### Causa

- A migração `products_orders_entitlements_schema` ativou RLS em `products` e `product_orders`
  mas só criou policies de `SELECT`. `create_product`/`update_product`/`delete_product` e
  `create_product_order` são `security invoker` (rodam com o privilégio de quem chama, igual às
  RPCs de `gigs`) — sem policy de `INSERT`/`UPDATE`/`DELETE` para `authenticated`, o próprio
  INSERT dentro da função era negado por padrão. `gigs` já tinha esse conjunto completo
  (`creator_inserts_gigs`/`creator_updates_gigs`/`creator_deletes_gigs`); a migração de produtos
  esqueceu de replicar o mesmo padrão.

### Mudanças

- Supabase (migração `products_and_product_orders_write_policies`): adiciona
  `products_insert_own`/`products_update_own`/`products_delete_own` (`creator_id = auth.uid()`)
  e `product_orders_insert_own` (`buyer_id = auth.uid()`) — mesmo modelo de `gigs`.
  `product_entitlements` continua de propósito sem nenhuma policy de escrita para
  `authenticated`: só o service role (webhook) concede acesso.
- Nenhuma mudança de código — é só correção de policy no banco (não há migrations versionadas em
  arquivo neste repo, ver nota em entradas anteriores), efeito imediato sem novo deploy.

### Validação

- `get_advisors` (security) checado depois da correção: nenhum alerta novo.
- Reprodução manual pendente de confirmação do usuário (publicar um produto de teste deve
  funcionar agora).

## 2026-09-20 — Produtos digitais: catálogo, compra e biblioteca reais

### Objetivo

- Segunda fatia da evolução do Jobê. A primeira análise (ver entrada anterior) identificou uma
  violação séria da própria regra de persistência do CLAUDE.md: **produtos digitais** — e, na
  investigação, na verdade um ecossistema inteiro paralelo (`ProductRepository`, `OrderRepository`,
  `PaymentRepository`, `EntitlementRepository`, `SaleRepository`, `WalletService`,
  `EntitlementService`, `OrderService`, `PaymentService`) — viviam inteiramente em
  `localStorage` via `MockSessionProvider`. O pagamento em si já era real (Mercado Pago +
  `payment_confirmations`, com `kind: "product"` já previsto no schema), mas o acesso concedido
  ao comprador (biblioteca) nunca era: ficava preso ao navegador de quem comprou, sem
  sobreviver a reload/dispositivo — ou seja, dinheiro real por um "acesso" que só existia
  localmente.
- Usuário confirmou escopo completo: catálogo + compra + biblioteca, ponta a ponta, reaproveitando
  ao máximo a infraestrutura real já existente (Mercado Pago, `payment_confirmations`, `wallet`).

### Mudanças

- Supabase (projeto `onlyyou`), migração `products_orders_entitlements_schema`
  - `products`: catálogo real (título, descrição, categoria, tags, tipo, preço/preço promocional
    em centavos, capa, galeria, `file_url` — o arquivo real entregue —, status, rating/vendas).
    RLS: público só vê `approved`; dono vê tudo. RPCs `create_product`/`update_product`/
    `delete_product` (mesma disciplina de `gigs`: `security invoker`, `search_path` vazio,
    sanitização de arrays no banco).
  - `product_orders`: pedido de compra com preço **travado no momento da criação**
    (`create_product_order`, RPC) — vira o `order_id` levado ao Mercado Pago. RLS: só
    comprador/criador leem a própria linha; nenhuma policy de update para `authenticated` (só
    service role, via webhook).
  - `product_entitlements`: acesso concedido — só gravada pelo servidor (nunca pelo
    comprador). `unique(product_id, buyer_id)`.
  - `get_advisors` (security) checado depois da migração: nenhum alerta novo.
- `lib/payments/activateProductOrderAfterPayment.ts` (novo, mesma forma de
  `activateCustomServiceOrder.ts`): chamado pelo webhook quando `payment_confirmations` confirma
  `paid` com `kind: "product"` — marca o pedido como pago, concede o entitlement, incrementa
  `sales_count`, notifica os dois lados. Idempotente.
  - Ligado em `app/api/mercadopago/webhook/route.ts` (confirmação assíncrona) e
    `app/api/mercadopago/status/route.ts` (reconciliação ativa do retorno do Checkout Pro),
    espelhando exatamente como `custom_service` já funcionava.
  - **Achado de segurança corrigido no caminho**: `app/api/mercadopago/checkout/route.ts`
    confiava num `orderId` inventado pelo navegador e recalculava o valor a partir do produto "ao
    vivo" a cada chamada. Agora exige um `product_orders` real (criado antes pela RPC, preço já
    travado) e só confere que ele pertence ao comprador autenticado — nunca mais confia em nada
    vindo do cliente para decidir valor/criador.
  - `getCreatorBalance` (`lib/supabase/wallet.ts`) já somava `payment_confirmations` por
    `creator_id` sem filtrar por `kind` — carteira/saque do criador passam a refletir vendas de
    produto automaticamente, **sem nenhuma mudança** nessa função.
- `lib/supabase/products.ts` (novo, mesmo padrão de `gigs.ts`): leituras públicas
  (`listApprovedProducts`, `listApprovedProductsByCategory`, `searchApprovedProducts`,
  `getPublicProductById`) nunca selecionam `file_url` — só `listProductsForCreator` (painel do
  dono) e `listOwnedProductsForUser` (biblioteca de quem comprou) trazem essa coluna. Isso evita
  que o link de download vaze para quem não pagou, já que RLS é por linha, não por coluna.
- `app/api/upload/route.ts`, `lib/uploadFile.ts`: dois `UploadKind` novos —
  `product-image` (mesmas regras de `portfolio-image`) e `product-file` (qualquer arquivo até
  500 MB, só para criadores) — upload real via Vercel Blob, mesmo mecanismo já usado em entrega
  de pedido/portfólio.
- `app/dashboard/produtos/novo/page.tsx`: assistente de publicação deixou de ser uma simulação
  (`moderationService.submitForReview()`, "simular envio de arquivo") — agora envia arquivo de
  verdade e publica via `createProduct` (RPC), direto como `approved` (sem fila de moderação,
  mesma política self-serve de `gigs`).
  `app/dashboard/produtos/page.tsx`: listagem real, publicar/despublicar e excluir via RPC.
- `components/ProductPurchaseArea.tsx`, `components/CheckoutFlow.tsx`,
  `app/checkout/[productId]/page.tsx`, `app/checkout/retorno/page.tsx`: reescritos sem
  `useMockSession`/`useCheckoutServices` — criam pedido real, chamam o checkout real, e só
  liberam a tela de "pago" quando `/api/mercadopago/status` confirma (que é quem concede o
  entitlement de verdade). `MercadoPagoPixPanel` perdeu o acoplamento ao tipo concreto
  `PaymentService` (agora só exige um `syncStatus`, sem repositório mock nenhum por trás).
- `app/biblioteca/page.tsx`: lê `product_entitlements` de verdade (via `useCurrentUserId` real),
  com botão "Baixar" para o `file_url` de cada produto comprado.
- Substituições diretas de `productRepository` (mock) por `lib/supabase/products.ts` em:
  `app/page.tsx`, `app/produto/[id]/page.tsx` (perdeu `generateStaticParams` — produto agora é
  dado real e dinâmico, virou ISR com `revalidate = 60`, igual à home), `app/categorias/[slug]/page.tsx`,
  `app/criadores/[username]/page.tsx`, `app/descobrir/page.tsx`, `app/favoritos/page.tsx`,
  `app/admin/page.tsx` (contagem real via `service.ts`), `app/dashboard/{estatisticas,page,vendas}.tsx`.
- Removidos por ficarem sem nenhum consumidor real: `lib/repositories/ProductRepository.ts`,
  `lib/repositories/PaymentRepository.ts`, `lib/repositories/EntitlementRepository.ts`,
  `lib/services/{useCheckoutServices,PaymentService,OrderService,WalletService,EntitlementService}.ts`,
  `lib/checkout/finalizeCheckout.ts`, `lib/access/content-release.ts`, `lib/data/products.ts`.

### Fora do escopo desta fatia (permanece mock, documentado para não confundir depois)

- `app/dashboard/vendas/page.tsx` e `app/dashboard/estatisticas/page.tsx` ainda leem
  `OrderRepository`/`SaleRepository` mock para o **histórico** de vendas (lista/gráfico) — a
  fonte de verdade financeira real já é `payment_confirmations` (usada por `wallet.ts`); migrar
  essas duas telas para consultar `payment_confirmations` diretamente é o próximo passo natural,
  não feito agora para não ampliar ainda mais esta mudança.
- Favoritos (`FavoriteRepository`), cupons (`CouponRepository`), avaliação de produto
  (`ReviewRepository`, diferente de `custom_order_reviews`) e denúncias de produto
  (`ReportRepository`) continuam mock — nenhum desses foi pedido nesta fatia.
- Nenhuma fila de moderação para produto (`pending_review`/`rejected`/`suspended`): publicação é
  self-serve, igual a `gigs`. As colunas/valores continuam existindo no banco para o dia em que
  isso for construído.

### Validação

- `tsc --noEmit` no projeto inteiro: sem erros.
- `eslint .` no projeto inteiro: sem erros (2 avisos de `set-state-in-effect` encontrados e
  corrigidos em `app/biblioteca/page.tsx` e `components/ProductPurchaseArea.tsx`).
- `npx next build`: compilação e checagem de tipos concluídas; a geração estática chegou a
  28/38 páginas fazendo chamadas reais ao Supabase antes de ser bloqueada pela política de rede
  deste sandbox (host não liberado no allowlist) — confirma que o código chega a fazer requests
  reais, não é um erro de lógica. Falta validar a build completa e o fluxo de compra ponta a
  ponta (Pix real) num ambiente com rede liberada e `.env.local` configurado.
- Migração e RPCs aplicadas diretamente no projeto Supabase real via MCP; `get_advisors`
  (security) conferido: nenhum alerta novo além dos já documentados.
- Checagem de cores fixas nos arquivos alterados: nenhuma ocorrência.

## 2026-09-20 — Ofertas com revisões e "o que está incluso"

### Objetivo

- Primeira fatia de uma evolução maior do Jobê (marketplace de serviços prontos, pedidos
  personalizados, propostas, combos, produtos digitais, recompra e reputação), inspirada em
  conceitos de GetNinjas/Workana/VintePila/Packzin sem copiar identidade ou funcionalidades —
  aplicada sobre a estrutura já existente, sem recriar nada do zero.
- Antes de tudo: mapeamento completo do que já existe (gigs, pedidos personalizados, chat,
  categorias, avaliações, portfólio, banco) para reaproveitar em vez de duplicar. O fluxo de
  pedido personalizado já é essencialmente 1:1 direcionado a um criador (não é bidding aberto a
  vários profissionais) — decisão de manter assim por ora.
- Nesta fatia: dar estrutura ao que hoje era só texto livre na descrição do gig e da proposta —
  quantas revisões estão incluídas, o que está incluso (lista) e uma galeria de imagens no gig,
  além da capa. É a base pras próximas fatias (combos reaproveitam os mesmos campos; briefing por
  categoria e recompra ficam para depois).

### Mudanças

- Supabase (projeto `onlyyou`)
  - Migração `gig_and_proposal_structured_offer_fields`: `gigs` ganha `revision_count`,
    `included_items` (`text[]`) e `gallery_urls` (`text[]`); `custom_proposals` ganha
    `revision_count` e `included_items`. Checks garantem `revision_count >= 0` quando informado.
  - `create_gig`/`update_gig`/`create_custom_proposal` recriadas com os novos parâmetros
    (adicionados ao final, com default, preservando a assinatura como replace — não overload).
    Sanitizam os arrays no banco: trim, remove itens vazios, corta cada item em 140 caracteres e
    limita a 8 itens.
  - `get_advisors` (security) executado após a migração: nenhum alerta novo — só os avisos
    pré-existentes já documentados (funções `security definer` de `become_creator` e
    `submit_custom_order_review`, proteção de senha vazada).
- `lib/types/gig.ts`, `lib/supabase/gigs.ts`
  - `Gig`/`GigInput` ganham `revisionCount?`, `includedItems: string[]`, `galleryUrls: string[]`.
  - Novo `getGigById` — usado para pré-preencher a proposta a partir do gig de origem.
- `lib/types/custom-proposal.ts`, `lib/types/custom-request.ts`, `lib/supabase/customRequests.ts`
  - `CustomProposal` ganha `revisionCount?`/`includedItems`; `createCustomProposal` aceita e
    envia os dois campos.
  - `CustomRequest` passa a expor `sourceGigId` (a coluna já existia no banco, mas não estava
    mapeada no tipo/mapper) — permite ligar a proposta ao anúncio que originou o pedido.
- `app/dashboard/servicos/page.tsx`
  - Formulário de anúncio ganha "Revisões incluídas" (número opcional), "O que está incluso"
    (lista, uma linha por item) e "Mais imagens" (galeria, reaproveitando o mesmo padrão de
    upload/lista de URLs já usado em `PortfolioSection.tsx`).
- `components/GigCard.tsx`, `components/GigFeedCard.tsx`
  - Exibem a quantidade de revisões; o card de feed também mostra os 3 primeiros itens inclusos.
- `components/ConversationView.tsx`
  - Formulário de proposta ganha os mesmos dois campos (revisões, o que está incluso).
  - Ao abrir "Criar proposta" num pedido que nasceu de um gig (`sourceGigId`), o formulário é
    pré-preenchido a partir do anúncio (`getGigById`) — o criador só confirma ou ajusta.
  - Card de proposta na conversa passa a exibir revisões e itens inclusos quando informados.

### Validação

- ESLint e `tsc --noEmit` sem erros nos arquivos alterados.
- `npx next build`: compilação e checagem de tipos concluídas com sucesso; a etapa de
  pré-renderização falha neste sandbox por falta de `.env.local` (sem `NEXT_PUBLIC_SUPABASE_URL`)
  — limitação pré-existente do ambiente, não relacionada a esta mudança.
- Checagem de cores fixas (`grep` por hex e classes de paleta Tailwind) nos arquivos alterados:
  nenhuma ocorrência.
- Migração e RPCs aplicadas diretamente no projeto Supabase real via MCP; advisors de segurança
  conferidos após a mudança.

### Próximos passos sugeridos (não implementados nesta fatia)

- Produtos digitais reais (hoje só mock em `lib/data/products.ts`, viola a regra de persistência).
- Combos/pacotes de serviços.
- Propostas abertas a múltiplos profissionais para o mesmo pedido.
- Briefing dinâmico por categoria pós-aceite.
- Recompra ("contratar novamente") a partir do histórico de pedidos.

## 2026-09-20 — Alinhamento dos controles do cabeçalho

### Objetivo

- Corrigir o desalinhamento visual entre o sino de notificações e o avatar no mobile.

### Mudanças

- `components/NotificationBell.tsx`
  - No mobile, sino e avatar usam círculos idênticos de 40 px, com os ícones centralizados.
  - O contador textual que desequilibrava o alinhamento óptico foi substituído por um ponto
    discreto; a quantidade continua informada no texto acessível do link.
- `components/Header.tsx`
  - Contêiner mobile do sino passou a compartilhar a mesma altura e eixo vertical do avatar.

### Validação

- ESLint, TypeScript e build de produção.
- Checagem de cores fixas nos arquivos alterados.

## 2026-09-20 — Cabeçalho e navegação mobile mais leves

### Objetivo

- Integrar melhor o cabeçalho ao conteúdo e reduzir o peso visual da navegação inferior.
- Evitar que controles redundantes e fundos grandes deem sensação de interface genérica ou
  encubram o conteúdo no celular.

### Mudanças

- `components/Header.tsx`
  - Cabeçalho passou a usar superfície translúcida e compacta, com assinatura laranja discreta
    sob a marca e sem a linha divisória no mobile.
  - Removido o atalho redundante de Explorar, já presente na navegação inferior.
  - Notificações foram levadas ao cabeçalho mobile e o acesso à conta perdeu borda desnecessária.
  - Menu mobile virou um painel flutuante compacto, com links em duas colunas e área rolável.
  - Menus receberam `aria-expanded` para comunicar corretamente o estado a leitores de tela.
- `components/MobileNav.tsx`
  - Dock ficou mais baixo e ocupa uma largura previsível, com ícones melhor distribuídos.
  - Estado ativo deixou de usar um círculo preenchido grande; agora usa cor e um traço curto.
  - Adicionados nome acessível da navegação e `aria-current` na rota ativa.
- `components/PageMain.tsx`
  - Reserva inferior ajustada para impedir que a dock cubra o fim do conteúdo.

### Validação

- ESLint, TypeScript e build de produção.
- Revisão de acessibilidade, estados ativos e áreas de toque no mobile.
- Checagem de cores fixas nos arquivos alterados.

## 2026-09-20 — Categorias Elojob e Jogue comigo

### Objetivo

- Criar duas categorias gamer completas dentro do fluxo real de serviços.
- Permitir que preço, duração, jogo e progressão de elo sejam cadastrados e persistidos.

### Mudanças

- Supabase `gigs`
  - Adicionadas as colunas `category`, `game`, `platform`, `session_minutes`, `current_rank` e
    `target_rank` pela migration `add_gaming_service_categories`.
  - RPCs `create_gig` e `update_gig` recriadas como `security invoker`, com `search_path` vazio,
    acesso exclusivo a `authenticated` e validações específicas por categoria.
  - Jogue comigo exige jogo e sessão mínima de 15 minutos; Elojob exige jogo, elo atual, elo
    desejado e prazo.
- `app/dashboard/servicos/page.tsx`
  - O formulário ganhou seletor de categoria e campos condicionais para os dois serviços gamer.
  - Jogue comigo cadastra preço por sessão e duração em minutos.
  - Elojob cadastra preço, jogo, plataforma/servidor, elo atual, elo desejado e prazo.
- `lib/types/gig.ts` e `lib/supabase/gigs.ts`
  - Tipos, mapeamento, leitura, pesquisa e mutações atualizados para os novos dados.
- `lib/data/categories.ts`, `app/descobrir/page.tsx` e `components/ExploreFilters.tsx`
  - Elojob e Jogue comigo adicionados às categorias em destaque da página Explorar.
  - O filtro agora exibe apenas os serviços da categoria gamer selecionada.
- `app/categorias/[slug]/page.tsx`
  - As duas categorias ganharam páginas próprias com serviços reais do Supabase.
- `components/GigCard.tsx`, `components/GigFeedCard.tsx` e `components/RequestGigButton.tsx`
  - Cards mostram jogo, sessão ou progressão de elo.
  - A solicitação enviada para a conversa inclui automaticamente os detalhes gamer.

### Validação

- ESLint, TypeScript e build de produção.
- Migration aplicada e colunas conferidas no projeto Supabase `onlyyou`.
- RPC testada em transação com rollback para Jogue comigo e Elojob.
- Advisors de segurança e desempenho executados; nenhum novo alerta ligado às colunas ou RPCs.
- Permanecem avisos anteriores do projeto sobre duas funções `security definer`, proteção de
  senhas vazadas, índices e políticas RLS não relacionados a esta mudança.

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
