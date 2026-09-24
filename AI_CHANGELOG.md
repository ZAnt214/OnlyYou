# Histórico de alterações para IAs

## 2026-09-23 — Documenta padrões visuais aprovados no redesenho do chat

- Objetivo: preservar as decisões de design/UX aprovadas no chat para reaproveitamento consistente
  em futuras páginas do Jobê.
- Novo `JOBE_CHAT_DESIGN_GUIDE.md`: registra direção visual, hierarquia, uso de carvão/laranja,
  compactação, avisos de sistema, card de proposta, compositor, menu “+”, separação entre arquivo
  de revisão e conclusão, tela de finalizar trabalho, comportamento mobile/teclado, linguagem,
  anti-padrões e checklist de revisão.
- `CLAUDE.md`: adicionada referência obrigatória ao novo guia para futuros redesenhos.
- Também foram corrigidas referências antigas a “framboesa” no texto do design system para
  “laranja”, alinhando a documentação com a identidade atual definida em `app/globals.css`.
- Nenhum comportamento ou layout do site foi alterado nesta mudança; apenas documentação de
  continuidade do projeto.
- Arquivos: `JOBE_CHAT_DESIGN_GUIDE.md`, `CLAUDE.md`, `AI_CHANGELOG.md`.


## 2026-09-23 — Aplica opção 2 à tela de finalizar trabalho

- Objetivo: usuário escolheu a opção 2 das prévias HTML, mas sem o fundo laranja-claro do bloco de confirmação.
- `components/ConversationView.tsx`: a tela “Finalizar trabalho” agora usa confirmação em duas etapas
  com dois checkboxes reais: concluir tudo o que foi combinado e confirmar que os arquivos necessários
  já foram enviados na conversa.
- O bloco de confirmação usa apenas superfície neutra + borda do design system; não há fundo
  `--color-accent-soft` nem outro destaque laranja-claro.
- O botão principal mudou para “Confirmar conclusão” e só é habilitado quando as duas confirmações
  estiverem marcadas. Fechar/cancelar ou concluir limpa o estado dos checkboxes.
- O texto final informa que o cliente será avisado e poderá confirmar o recebimento ou relatar um problema.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: sem cores literais/classes fixas de paleta no TSX alterado.


## 2026-09-23 — Finalização do trabalho não exige novo arquivo

- Objetivo: “Finalizar entrega” ainda obrigava o criador a anexar um arquivo final. O novo fluxo
  separa definitivamente compartilhar arquivos durante a produção de declarar o trabalho concluído.
- Banco: nova RPC `finalize_custom_delivery` permite apenas ao criador do pedido em produção
  marcar o trabalho como concluído sem anexar arquivo. A RPC muda o pedido para `delivered`,
  registra uma mensagem de sistema e notifica o comprador.
- `lib/supabase/customRequests.ts`: adicionada `finalizeCustomDelivery`.
- `components/ConversationView.tsx`: o painel “Finalizar trabalho” agora explica o que a ação faz,
  mostra regras antes da confirmação e não possui campo de arquivo.
- Regras exibidas: finalizar somente quando o combinado estiver concluído; usar “Enviar arquivo”
  enquanto ainda houver revisão/ajustes; o comprador poderá confirmar ou relatar problema; não é
  necessário reenviar arquivo se os finais já estiverem na conversa.
- A tela do comprador passa a usar o título “Trabalho finalizado” nessa etapa.
- Arquivos: `components/ConversationView.tsx`, `lib/supabase/customRequests.ts`,
  `supabase/migrations/20260923222500_finalize_custom_delivery_without_file.sql`, `AI_CHANGELOG.md`.
- Validação: alteração sem cores literais/classes fixas de paleta no TSX.


## 2026-09-23 — Ajusta descrição de “Finalizar entrega”

- `components/ConversationView.tsx`: a descrição de “Finalizar entrega” mudou de
  “Enviar versão final” para “Marcar trabalho como concluído”, evitando a impressão de que
  necessariamente é preciso anexar uma nova versão final para concluir.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.


## 2026-09-23 — Aplica menu escuro e simples nas ações do trabalho

- Objetivo: usuário escolheu a opção 4 das prévias HTML para o submenu aberto pelo botão “+”.
- `components/ConversationView.tsx`: o submenu agora usa fundo `--color-contrast`, texto claro,
  sem ícones nas opções e com largura mais compacta.
- “Enviar arquivo” usa a descrição curta “Mandar para revisão”; “Finalizar entrega” usa
  “Enviar versão final” e recebe apenas o laranja da marca no título para diferenciar a ação final.
- O divisor entre as duas ações ficou discreto e o botão do compositor alterna entre caracteres
  simples “+” e “×”, sem ícone adicional quando o menu está aberto.
- Nenhuma regra de negócio foi alterada; os dois fluxos continuam separados.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: sem cores literais/classes fixas de paleta no TSX alterado.


## 2026-09-23 — Agrupa ações do trabalho no botão “+” do chat

- Objetivo: “Finalizar entrega” estava escondido no menu de três pontos, enquanto “Enviar arquivo”
  ficava sozinho no compositor. As duas ações pertencem ao mesmo contexto de trabalho em andamento.
- `components/ConversationView.tsx`: para o criador com pedido `in_progress`, o botão à esquerda
  do campo de mensagem volta a ser um “+” e abre um submenu compacto acima do compositor.
- O submenu reúne “Enviar arquivo” (compartilhar versão para revisão/ajustes sem finalizar) e
  “Finalizar entrega” (marcar o trabalho como pronto e enviar a versão final).
- “Finalizar entrega” foi removido do menu de três pontos, que volta a concentrar apenas ações
  secundárias/administrativas como denunciar ou bloquear.
- Ao focar o campo de mensagem, o submenu fecha automaticamente. Enquanto aberto, o “+” vira um X
  para deixar claro como fechar as ações.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: sem novas cores literais/classes fixas de paleta no TSX alterado.


## 2026-09-23 — Separa arquivos de revisão da entrega final

- Objetivo: o criador precisa poder enviar versões do trabalho ao cliente durante a produção para
  pedir feedback e ajustes, sem transformar cada arquivo enviado em uma entrega final.
- Banco: nova RPC `send_custom_attachment` cria uma mensagem do tipo `attachment` e grava os
  arquivos em `message_attachments`, mas mantém `custom_service_orders.status = in_progress`.
  Ela só aceita o criador do pedido, conversa aberta e pedido em produção. A RPC reutiliza
  `send_custom_message` para preservar notificação e atualização da conversa.
- `lib/supabase/customRequests.ts`: adicionada `sendCustomAttachment`.
- `components/ConversationView.tsx`: o clipe ao lado do compositor agora abre “Enviar arquivo”,
  com arquivo + mensagem opcional ao cliente e aviso explícito de que isso não finaliza o pedido.
  Arquivos enviados aparecem como mensagens normais do chat com link para download/visualização.
- “Finalizar entrega” virou uma ação separada no menu de três pontos do cabeçalho. Só essa ação
  abre o fluxo de entrega final e chama `sendCustomDelivery`, que continua responsável por mudar
  o pedido para entregue.
- O painel de entrega final também ganhou texto mais explícito e o botão “Finalizar e enviar” para
  reduzir finalizações acidentais.
- Arquivos: `components/ConversationView.tsx`, `lib/supabase/customRequests.ts`,
  `supabase/migrations/20260923211500_work_files_before_delivery.sql`, `AI_CHANGELOG.md`.
- Validação: sem novas cores literais/classes fixas de paleta nos arquivos TSX alterados.


## 2026-09-23 — Move envio de entrega para o compositor e oculta avaliação vazia

- Objetivo: usuário apontou dois elementos que ainda ocupavam espaço ou poluíam o cabeçalho:
  “Sem avaliações” quebrando em duas linhas e o bloco grande “Enviar entrega” abaixo da conversa.
- `components/ConversationView.tsx`: a avaliação no cabeçalho agora só aparece quando
  `counterpartRatingCount > 0`. Sem avaliações, nada é renderizado.
- Para o criador com pedido `in_progress`, “Enviar entrega” deixa de ocupar um card separado.
  A ação agora vira um botão compacto com ícone de clipe na mesma linha do campo de mensagem.
- Ao tocar no clipe, abre um painel interno sobre a área do chat com seleção do arquivo, ação
  “Confirmar entrega”, botão “Cancelar” e X no cabeçalho. Enquanto esse painel está aberto, o
  compositor fica oculto, seguindo o mesmo padrão usado pela criação de proposta.
- O fluxo de upload e envio continua usando `handleSendDelivery`, sem mudança de regra de negócio.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Aplica a opção 6 ao card de proposta

- Objetivo: usuário escolheu a opção 6 das prévias HTML para o card de proposta no chat.
- `components/ConversationView.tsx`: o card de proposta passa a usar fundo escuro
  `--color-contrast`, texto claro e o laranja da marca para o valor. O status usa a variante
  inline já existente, sem badge claro sobre o card.
- Título e descrição ficaram integrados ao bloco escuro; valor, prazo e revisões aparecem numa
  faixa inferior separada apenas por um divisor discreto, evitando o “card dentro do card” do
  layout anterior.
- Itens incluídos, prazo de pagamento e ações secundárias foram adaptados para contraste sobre
  fundo escuro. Ações principais continuam usando o laranja do Jobê.
- Nenhuma regra de negócio da proposta foi alterada; aceite, recusa, pagamento e cancelamento
  continuam com o mesmo comportamento.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Compacta a tela do comprador após o pagamento

- Objetivo: na conversa do comprador com pedido em produção, o aviso grande de prazo e mensagens
  antigas de pagamento ocupavam espaço demais e repetiam informações que já aparecem no status do
  cabeçalho.
- `components/ConversationView.tsx`: removido o card fixo grande de prazo (com texto explicativo).
  Enquanto o pedido está `in_progress`, o prazo agora aparece como uma mensagem compacta dentro
  da própria conversa: “Prazo de entrega · DD/MM, HH:MM”.
- Mensagens de marco do pedido, como pagamento confirmado, agora usam o mesmo padrão compacto de
  mensagem de sistema, sem borda e sem ícone. Para o comprador, o texto passa a ser
  “Pagamento confirmado. O serviço já está em produção.”.
- Depois que o pedido sai de `awaiting_payment`, mensagens antigas começando por “Proposta aceita.”
  deixam de ser renderizadas, evitando instrução obsoleta para concluir um pagamento que já ocorreu.
- No card da proposta aceita, “Pagamento até ...” também só aparece antes de existir uma contratação;
  depois do pagamento/ordem criada, a proposta continua como registro de escopo, valor e prazo sem
  informação vencida.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Remove ícone do aviso de proteção no chat

- Objetivo: usuário pediu um aviso ainda mais discreto, sem o ícone de escudo.
- `components/ConversationView.tsx`: removido `ShieldCheck` do aviso de proteção e também do
  import de `lucide-react`. O texto e o fundo neutro permanecem iguais.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: alteração visual simples, sem novas dependências ou cores literais.


## 2026-09-23 — Ancora a última mensagem acima do teclado no mobile

- Objetivo: reproduzir o comportamento esperado de mensageiros como o WhatsApp: quando o teclado
  abre, a conversa não deve apenas perder altura; o histórico precisa subir junto para manter a
  mensagem mais recente visível imediatamente acima do compositor.
- `components/ConversationScreen.tsx`: a altura atual de `visualViewport`, que já controla a
  altura da tela, agora também é repassada para `ConversationView`.
- `components/ConversationView.tsx`: a área rolável das mensagens ganhou uma ref própria. Sempre
  que chegam mensagens ou a altura do `visualViewport` muda (abertura/fechamento do teclado),
  a rolagem é ancorada no final da conversa via `requestAnimationFrame`.
- Resultado esperado no mobile: ao abrir o teclado, o compositor permanece acima dele e a última
  mensagem acompanha a redução de viewport, ficando logo acima do campo de digitação, sem alterar
  a escala visual da tela.
- Arquivos: `components/ConversationScreen.tsx`, `components/ConversationView.tsx`,
  `AI_CHANGELOG.md`.
- Validação: alteração restrita a layout/scroll e sem introdução de cores literais ou classes de
  paleta fixa.


## 2026-09-23 — Simplifica status, menu e aviso do chat

- Objetivo: usuário apontou três elementos que ainda estavam chamando atenção demais no chat:
  badge “Em negociação”, botão de três pontos e aviso de proteção.
- `components/StatusBadge.tsx`: adicionado `variant="inline"`, sem fundo de badge. O status
  passa a ser representado por um ponto semântico pequeno + texto, preservando o mapa de status
  existente e sem duplicar rótulos no componente de conversa.
- `components/ConversationView.tsx`: o status saiu da linha do nome e foi para a linha de apoio,
  ao lado de “Aguardando sua proposta”, reduzindo a competição visual no cabeçalho. O padding
  vertical do cabeçalho também foi levemente reduzido.
- O botão de três pontos agora é transparente no estado normal, sem círculo claro permanente;
  o fundo aparece apenas em hover/interação.
- O aviso de proteção dentro da conversa ficou menor, centralizado, limitado a 82% da largura,
  com fundo secundário neutro em vez do laranja suave. Texto encurtado para “Mantenha conversa e
  pagamento no Jobê para sua proteção.”.
- Arquivos: `components/ConversationView.tsx`, `components/StatusBadge.tsx`,
  `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta nos arquivos alterados, sem ocorrências.


## 2026-09-23 — Estabiliza escala do chat ao focar campos no mobile

- Objetivo: usuário percebeu que o chat parecia mudar de zoom conforme abria o teclado ou focava
  campos. Havia duas causas visuais possíveis no próprio componente: o layout mudava padding/gap
  quando o compositor recebia foco, e os inputs usavam `text-sm` (14px), tamanho que pode fazer
  navegadores mobile ampliarem a página ao focar o campo.
- `components/ConversationView.tsx`: removido o estado `composerFocused` e a troca de
  espaçamento do quadro principal. O chat agora mantém exatamente o mesmo padding e gap antes,
  durante e depois da digitação.
- Inputs e textareas da conversa/proposta passam a usar `text-base` no mobile (16px) e
  `sm:text-sm` em telas maiores. O campo “Escreva uma mensagem” segue o mesmo padrão. Isso
  evita o zoom automático de foco sem bloquear o zoom de acessibilidade do navegador.
- A altura ainda acompanha `visualViewport` via `ConversationScreen`, então o teclado pode
  reduzir a área visível normalmente, mas sem alterar a escala aparente dos elementos.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Faz a criação de proposta ocupar a área do chat sem sobreposição

- Objetivo: ao abrir “Criar proposta” no mobile, o formulário crescia abaixo do histórico e o
  compositor de mensagem continuava visível por cima, cobrindo os últimos campos e botões.
- `components/ConversationView.tsx`: a região central da conversa agora é `relative` e o painel
  de proposta abre como um overlay interno `absolute inset-0`, limitado exatamente à área do chat.
  O painel tem rolagem própria (`overflow-y-auto`), então todos os campos e ações continuam
  acessíveis mesmo com teclado aberto.
- Enquanto a proposta está aberta, o compositor “Escreva uma mensagem” fica oculto. Ao fechar pelo
  X ou por “Cancelar”, o chat e o compositor reaparecem no mesmo estado de antes.
- O cabeçalho da conversa continua visível, então o usuário mantém contexto de com quem está
  negociando sem perder espaço útil para o formulário.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Corrige overflow do botão Enviar e adiciona fechar na proposta

- Objetivo: no mobile, com o botão “+” ao lado do compositor, o botão “Enviar” ultrapassava a
  margem direita do chat. Também faltava um controle explícito de fechar no painel aberto pelo “+”.
- `components/ConversationView.tsx`: formulário e linha do compositor agora usam
  `w-full min-w-0`, e o input recebeu `min-w-0` para poder encolher corretamente dentro do
  flex sem empurrar os controles para fora do viewport.
- No mobile, “Enviar” virou botão quadrado somente com o ícone de envio; o texto “Enviar” volta a
  aparecer a partir de `sm`. Isso deixa o compositor simétrico com o botão “+” e recupera espaço
  horizontal.
- O painel “Criar proposta” ganhou cabeçalho próprio com botão de fechar no canto superior direito,
  além do “Cancelar” que já existia no rodapé do formulário.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Integra “Criar proposta” ao campo de mensagem

- Objetivo: o botão “Criar proposta” ocupava uma linha inteira abaixo do histórico e reduzia a
  área útil do chat, principalmente no celular.
- `components/ConversationView.tsx`: removido o CTA grande em uma linha própria quando o
  formulário está fechado. A ação agora aparece como um botão compacto com ícone de “+” na mesma
  linha do campo “Escreva uma mensagem”, antes do input.
- O formulário completo de proposta continua igual e só ocupa espaço depois que o criador toca
  no botão, ou seja, durante a conversa normal toda a altura que antes pertencia ao CTA volta para
  o histórico de mensagens.
- O botão compacto mantém `aria-label` e `title` “Criar proposta” para acessibilidade e usa
  apenas tokens existentes do design system.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Move aviso de proteção para dentro da conversa

- Objetivo: usuário pediu que o aviso de proteção se comporte como uma mensagem do próprio chat,
  no estilo do aviso de criptografia do WhatsApp, em vez de ocupar um card fixo separado acima
  das mensagens.
- `components/ConversationView.tsx`: removido o card externo de proteção; o aviso agora é o
  primeiro item dentro da área rolável da conversa, centralizado, compacto e com
  `ShieldCheck`. Usa `--color-accent-soft` e `--color-accent-text`, mantendo a identidade
  visual do Jobê sem parecer uma mensagem de usuário.
- Texto encurtado para “Para sua proteção, mantenha a conversa, os combinados e o pagamento
  dentro do Jobê.”, preservando a orientação original com menos altura.
- Como o aviso agora faz parte do histórico visual, ele rola junto com as mensagens e deixa de
  consumir espaço fixo quando o teclado abre. O comportamento já existente de compactar a tela e
  ocultar temporariamente “Criar proposta” durante a digitação continua igual.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: busca por cores literais/classes fixas de paleta no arquivo alterado, sem ocorrências.


## 2026-09-23 — Compacta o chat quando o teclado está aberto

- Objetivo: no Android, ao focar o campo “Escreva uma mensagem”, o teclado reduz bastante a
  altura útil da conversa. O aviso de proteção e o CTA “Criar proposta” continuavam ocupando
  espaço fixo, espremendo a área das mensagens e fazendo o botão de proposta aparecer parcialmente
  atrás do compositor.
- `components/ConversationView.tsx`: adicionado estado local de foco do compositor. Enquanto o
  campo de mensagem está focado, o aviso longo de proteção e o CTA fechado “Criar proposta” ficam
  temporariamente ocultos e o espaçamento/padding do quadro principal é reduzido. Assim, a área
  rolável de mensagens recebe a maior parte do viewport restante e o compositor continua inteiro
  acima do teclado.
- Ao sair do campo de mensagem, aviso e ação de proposta reaparecem normalmente; nenhuma função
  do fluxo foi removida e não há persistência nova.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: revisão estrutural do TSX e busca por cores literais/classes fixas de paleta no
  arquivo alterado, sem ocorrências.


## 2026-09-23 — Remove borda externa da área de conversa

- Objetivo: após aplicar o visual de alto contraste ao chat, o usuário percebeu um contorno claro
  envolvendo toda a área das mensagens. Esse contorno vinha da borda do container principal da
  conversa e deixava a tela com aparência de “card dentro de card”.
- `components/ConversationView.tsx`: removidos `border` e `border-(--color-border)` somente
  do container rolável que envolve os balões de mensagem. Fundo branco, raio e sombra leve foram
  mantidos para separar a conversa do fundo externo sem criar uma moldura visível.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validação: alteração restrita a classes visuais existentes, sem introduzir cor literal ou nova
  dependência.


## 2026-09-23 — Aplica visual de alto contraste ao chat

- Objetivo: usuário escolheu a opção 3 (“Alto contraste”) entre as prévias do chat. A conversa
  passa a separar melhor cabeçalho, área de mensagens e controles, reduzindo o aspecto lavado da
  tela e preservando o laranja do Jobê como cor de marca.
- `components/ConversationView.tsx`: cabeçalho passa a usar `--color-contrast` com texto claro;
  aviso de proteção e painel de mensagens viram superfícies brancas bem delimitadas sobre o fundo
  secundário; mensagens recebidas usam `--color-surface-2` e mensagens próprias continuam no
  laranja da marca; balões ganharam raio e sombra leves.
- “Criar proposta” deixa de ficar dentro de um card grande quando o formulário está fechado e
  vira um CTA escuro compacto. Ao abrir o formulário, o card branco reaparece para manter os
  campos organizados.
- Campo de mensagem usa superfície branca e o botão “Enviar” passa a ser escuro, aumentando a
  hierarquia entre conversa e ação. O indicador de digitação usa fundo secundário para continuar
  visível dentro do painel branco.
- Nenhuma cor literal foi adicionada: a implementação usa apenas tokens existentes de
  `app/globals.css`, em conformidade com `CLAUDE.md`.
- Arquivos: `components/ConversationView.tsx`, `AI_CHANGELOG.md`.
- Validações: revisão estrutural do TSX e busca automática por hex/classes fixas de paleta no
  arquivo alterado, sem ocorrências. O conector GitHub não executa `tsc`/`eslint` localmente.


## 2026-09-23 — Expande categorias de serviço e mostra a taxa da plataforma pro criador

- Objetivo: usuário pediu comparação com o concorrente VintePila (benchmark de preço/formato +
  ideias de categoria) e, na sequência, pediu pra implementar as duas lacunas identificadas:
  (1) o criador nunca via quanto ficava com o Jobê antes de publicar um preço — a taxa de 20%
  só existe no banco (`platform_fee_cents`), nunca aparecia na UI de quem define o valor; (2)
  `GigCategory` (categoria de serviço personalizado) só tinha 3 valores (`general`, `elojob`,
  `play_together`), enquanto os produtos já usam uma taxonomia de 39 categorias — nenhuma delas
  aplicada a serviços.
- **Categorias de gig** (`supabase/migrations/20260923215541_expand_gig_categories.sql`,
  aplicada via `apply_migration` e conferida com `get_advisors` antes/depois — sem regressão de
  segurança): `gigs_category_check` e as RPCs `create_gig`/`update_gig` (`security invoker`,
  `search_path ''`, mesmo padrão do resto do fluxo de pedidos) passam a aceitar 11 categorias —
  as 3 antigas + `design`, `programacao`, `marketing`, `videos`, `redacao-e-copywriting`,
  `ui-ux`, `consultorias` (reaproveitando os slugs que os produtos já usam) e
  `assistente-virtual` (categoria nova, adicionada também a `lib/data/categories.ts` — não
  existia em lugar nenhum da plataforma, é o gap mais concreto que o VintePila expôs). Os
  campos especiais de jogo/elo/duração continuam restritos a `elojob`/`play_together` (antes a
  condição era "qualquer coisa != general", o que agora pegaria as categorias novas por
  engano — corrigido pra checar as duas categorias de jogo explicitamente).
- `lib/types/gig.ts`: `GigCategory` expandido, `GIG_CATEGORY_LABELS` com os novos rótulos, e
  novo `GAMING_GIG_CATEGORIES` (lista das categorias com campos especiais) pra não espalhar essa
  lista mágica pelos componentes.
- `app/dashboard/servicos/page.tsx`: select de categoria lista as 11 opções; bloco de
  jogo/elo/duração agora só aparece pra `elojob`/`play_together`, não mais pra qualquer coisa
  diferente de "geral".
- **Taxa da plataforma pro criador** — `app/dashboard/servicos/page.tsx` (preço do anúncio) e
  `components/ConversationView.tsx` (valor da proposta na conversa): abaixo do campo de preço,
  uma linha mostra "Você recebe R$X — Jobê fica com 20%", calculada ao vivo a partir de
  `platformConfig` (`lib/security/config.ts`, única fonte da porcentagem — nunca hardcoded em
  outro lugar). Ficou de fora a exibição pro comprador: o modelo do Jobê é o criador absorver a
  taxa (o comprador paga exatamente o valor combinado, sem taxa somada em cima, diferente do
  VintePila) — mostrar "taxa" pro comprador seria enganoso, já que ele não paga nada a mais.
- **Páginas de categoria** — `components/ExploreFilters.tsx` (resultados de busca/`/descobrir`)
  e `app/categorias/[slug]/page.tsx`: agora reconhecem qualquer uma das 11 categorias de gig
  (antes só reconheciam elojob/jogue-comigo), então `/categorias/design`,
  `/categorias/marketing` etc. passam a mostrar os serviços publicados naquela categoria junto
  com os produtos digitais existentes, em seções separadas.
- Arquivos: `supabase/migrations/20260923215541_expand_gig_categories.sql` (novo),
  `lib/types/gig.ts`, `lib/data/categories.ts`, `app/dashboard/servicos/page.tsx`,
  `components/ConversationView.tsx`, `components/ExploreFilters.tsx`,
  `app/categorias/[slug]/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint` nos arquivos alterados e busca por cor fixa —
  todos sem problemas. `get_advisors` (security) conferido antes e depois da migração, sem
  novo achado.

## 2026-09-23 — Cria componente SectionLabel e padroniza as etiquetas de seção

- Objetivo: feedback do usuário — os textos pequenos em caixa alta no topo de cada seção da
  home (e da página `/para-criadores`) funcionavam mais como detalhe visual do que como parte
  real da leitura. Pediu um único componente de "section label" reutilizado em toda a página:
  etiqueta curta, caixa alta, contraste forte (fundo suave da marca ou borda, padding, cantos
  arredondados, semibold) — não um botão, só um marcador visual — com o título logo abaixo.
- `components/SectionLabel.tsx` (novo): reaproveita o padrão já existente de chip ativo do
  design system (`bg-(--color-accent-soft)` + `text-(--color-accent-text)`, ver regra de chips
  de filtro no `CLAUDE.md`) em vez de inventar um estilo novo — pill com padding horizontal,
  `rounded-full`, `text-[11px] font-semibold uppercase tracking-[0.12em]`.
- `app/page.tsx`: todas as etiquetas de seção trocadas de texto solto (`<p>` cinza) para
  `<SectionLabel>`, com texto encurtado onde fazia sentido (exemplo dado pelo usuário — "Para
  quem cria" + "Tem algo que você faz bem?" viraram etiqueta "Para criadores" + título único
  "Tem algo que você faz bem? Tem gente procurando por isso."): hero ("Para quem contrata e
  para quem cria"), seção de conversa ("Antes de contratar" e "Antes de fechar", esse último já
  era um destaque em `--color-accent-text` — agora é a mesma etiqueta padrão), dúvidas
  frequentes ("Dúvidas frequentes") e comunidade ("Para criadores"). `SectionHeading` (usado na
  vitrine e nos cartões de "Ofertas") ganhou uma prop `eyebrow` opcional, com "Encontre
  profissionais" e "Promoções" respectivamente — essas duas seções não tinham etiqueta nenhuma
  antes.
- `app/para-criadores/page.tsx`: as 5 etiquetas de seção (Como funciona, O que publicar, Como
  te encontram, Pedidos e conversas, Seu perfil) trocadas pelo mesmo `<SectionLabel>`; o eyebrow
  do cabeçalho principal ("Jobê para criadores") foi mantido no padrão de `/oportunidades`
  (texto colorido, sem badge) por já ser suficientemente visível e por ser a convenção de
  cabeçalho de página já usada no resto do site — a reclamação do usuário era sobre as
  etiquetas pequenas cinza, não sobre esse estilo.
- Rótulos "Você"/"Profissional" acima dos balões de exemplo e "Passo N" nos cartões de
  "Como funciona" não viraram badge — são marcadores por item, não etiquetas de seção.
- Arquivos: `components/SectionLabel.tsx` (novo), `app/page.tsx`, `app/para-criadores/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint` nos arquivos alterados e busca por cor fixa —
  todos sem problemas.

## 2026-09-23 — Compacta bloco "para quem cria" da home e cria página /para-criadores

- Objetivo: pedido do usuário para simplificar o bloco "Para quem cria" na home (título +
  descrição + link de texto + cartão escuro com criadores em destaque) num único bloco
  compacto com um CTA que leva para uma página própria explicando tudo antes da pessoa entrar.
- `app/page.tsx`, seção `#comunidade` (`Community()`): substituído o grid de duas colunas
  (texto + cartão `bg-(--color-contrast)` com `CreatorCard`s) por um bloco único: eyebrow "Tem
  algo que você faz bem?", título "Tem gente procurando por isso.", descrição e um botão pill
  preenchido "Conhecer o Jobê para criadores" (padrão de CTA primário do design system) levando
  a `/para-criadores`. Removida a lista de criadores em destaque e o import de `CreatorCard`
  (não usado mais neste arquivo); `creators`/`featuredCreators` não são mais desestruturados
  aqui (a publicação recente da comunidade, `feed`, continua exatamente como estava).
- `app/para-criadores/page.tsx` (novo): página pública explicando como funciona vender no
  Jobê, com as seções pedidas — "Como funciona" (4 passos: montar perfil, publicar, conversar,
  combinar e receber), "O que você pode publicar" (serviços vs. produtos digitais), "Como as
  pessoas te encontram", "Pedidos e conversas", "Como montar um bom perfil" (dicas) e uma faixa
  final `bg-(--color-accent)` com CTA forte "Quero ser criador no Jobê" — ambos os CTAs da
  página levam pra `/dashboard` (mesmo destino que o link "Quero ser criador" já usava antes).
  Reaproveita o mesmo padrão visual de cabeçalho de `/oportunidades` (eyebrow em
  `--color-accent-text`, h1 bold, descrição, CTA pill) e os tokens/raios já definidos —
  nenhuma cor nova.
- `components/Footer.tsx`: adicionado link "Para criadores" → `/para-criadores` na lista de
  links institucionais, pra a página ficar descobrível sem depender só do CTA da home.
- Arquivos: `app/page.tsx`, `app/para-criadores/page.tsx` (novo), `components/Footer.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint` nos arquivos alterados e busca por cor fixa —
  todos sem problemas.

## 2026-09-23 — Corrige lado dos balões trocado na seção de conversa da home

- Objetivo: correção apontada pelo usuário — no exemplo de conversa da seção "como funciona"
  (entrada anterior deste changelog, mesmo dia), "Você" aparecia à esquerda num balão claro e
  "Profissional" à direita num balão escuro, o oposto da convenção usada no chat de verdade do
  app (`components/ConversationView.tsx`, `MessageItem`): mensagem própria (`isOwn`) sempre à
  direita (`self-end`) em `bg-(--color-accent)`, mensagem da outra pessoa à esquerda em balão
  claro com borda.
- `app/page.tsx`: troca os lados — "Você" agora à direita em `bg-(--color-accent)` (mesmo token
  usado pra mensagem própria no chat real, no lugar do `--color-contrast` genérico anterior);
  "Profissional" à esquerda no balão claro com borda. O texto de cada fala continua o mesmo,
  só a lateral/label mudou de lugar.
- Arquivos: `app/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint app/page.tsx` e busca por cor fixa no arquivo
  alterado — todos sem problemas.

## 2026-09-23 — Compacta e redesenha a seção de conversa "como funciona" da home

- Objetivo: feedback do usuário sobre a seção "Espaço para combinar" / "Um bom trabalho começa
  na conversa." — muito comprida pra quantidade de informação, exemplo de conversa ocupando
  espaço demais, e o bloco "Escopo, valor e prazo" com seta parecia um botão clicável sem ser.
- `app/page.tsx`, seção `#como-funciona`:
  - Texto: eyebrow "Espaço para combinar" → "Um bom começo é se entender"; título "Um bom
    trabalho começa na conversa." → "Conversem antes de decidir."; descrição → "Explique sua
    ideia, entenda como o profissional trabalha e combinem juntos o que será feito, o valor e
    o prazo." (versão mais acolhedora sugerida).
  - Exemplo de conversa: rótulo "Uma conversa pode começar assim" trocado pelo destaque pequeno
    em `--color-accent-text` "Antes de fechar"; balões menores (`px-4 py-3` em vez de
    `px-5 py-4`), com identificação discreta "Você"/"Profissional" acima de cada um.
  - Bloco final: removido o cartão com seta que parecia clicável (`ArrowUpRight` + "Escopo,
    valor e prazo. Combinados antes de fechar.") — substituído por uma linha simples "O que
    será feito · Valor · Prazo" com legenda "Tudo alinhado antes de seguir.", sem nenhum
    elemento com aparência de link/botão.
  - Seção mais compacta: `py-10 sm:py-14` → `py-8 sm:py-12`, `gap-8 md:gap-16` →
    `gap-6 md:gap-12`, aproximando o exemplo de conversa do texto principal.
  - Framboesa/laranja aparece só no detalhe pequeno "Antes de fechar", como pedido — sem criar
    outro bloco grande na cor de marca.
- Arquivos: `app/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint app/page.tsx` e busca por cor fixa no arquivo
  alterado — todos sem problemas. `ArrowUpRight` continua importado e usado em outros pontos do
  arquivo, então o import foi mantido.

## 2026-09-23 — Remove seção "Outro jeito de encontrar" (pedidos publicados) da home

- Objetivo: pedido do usuário para remover a seção "OUTRO JEITO DE ENCONTRAR" / "Conte o que
  precisa. Abra a conversa." — o bloco com "Publicar meu pedido" e a lista de pedidos abertos
  ("Pedido aberto — Teste teste — Orçamento de até R$ 5,00" / "Ver todos os pedidos") logo
  abaixo da vitrine.
- `app/page.tsx`: removidos o `<Suspense>` que renderizava `<OpportunitySpotlight />` na home e
  as funções `OpportunitySpotlight`, `OpportunityPreview`, `OpportunitySpotlightSkeleton` e
  `getLatestOpportunities` (só existiam para essa seção). Removidos também os imports que
  ficaram sem uso (`ServiceRequest`, `listOpenServiceRequests`).
- A faixa laranja "Conta pra gente o que você precisa" (topo da home) e a página `/oportunidades`
  continuam existindo normalmente — só a seção de destaque de pedidos no meio da home saiu.
- Arquivos: `app/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint app/page.tsx` e busca por cor fixa no arquivo
  alterado — todos sem problemas.

## 2026-09-23 — Reescreve texto da faixa de publicar pedido na home

- Objetivo: pedido do usuário para trocar o texto da faixa laranja "Prefere receber propostas?"
  por um tom mais direto e convidativo.
- `app/page.tsx`: título "Prefere receber propostas?" → "Conta pra gente o que você precisa";
  descrição "Publique seu pedido e converse com profissionais." → "Publique seu pedido e
  encontre profissionais interessados em ajudar." Só texto — mesmas classes/tokens, mesmo
  botão "Publicar pedido".
- Arquivos: `app/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint app/page.tsx` e busca por cor fixa no arquivo
  alterado — todos sem problemas.

## 2026-09-23 — Reescreve o bloco de texto do hero da home

- Objetivo: pedido do usuário para reestruturar as três frases do topo da home em papéis
  distintos (chamada pequena de apoio, título principal acolhedor, descrição objetiva) em vez
  de repetir o mesmo tom nas três.
- `app/page.tsx`: troca o texto de apoio de "Serviços e produtos digitais" para "Veio contratar
  ou mostrar o que sabe fazer?" (fala com os dois públicos do Jobê), o título de "Sua ideia
  merece quem sabe fazer." para "Tem algo em mente? Vamos encontrar quem pode ajudar." (tom mais
  de conversa) e a descrição para "No Jobê, você encontra profissionais, serviços e produtos
  digitais para tirar sua ideia do papel." Peso do texto de apoio ajustado de `font-medium` para
  `font-semibold` para dar um pouco mais de presença sem competir com o título — todo o resto
  reaproveita as classes/tokens já existentes (`text-(--color-text-muted)`, tracking, tamanhos
  responsivos), sem introduzir estilo novo.
- Arquivos: `app/page.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint app/page.tsx` e busca por cor fixa no arquivo
  alterado — todos sem problemas. Mudança é só de texto/peso de fonte, sem alterar estrutura,
  tokens ou comportamento.

## 2026-09-23 — Corrige desalinhamento dos cards de serviço na vitrine

- Objetivo: com o upload de capa já funcionando (fix anterior), o usuário reportou que os cards
  de serviço na vitrine da home ficam desalinhados entre si quando o título tem tamanhos
  diferentes — "Teste" (1 linha) e "Vou criar o logo da sua marca" (2 linhas) lado a lado
  fazem a linha de preço/prazo e o botão "Solicitar" ficarem em alturas diferentes.
- Causa: `components/GigCard.tsx`, o `h3` do título usa `line-clamp-2` (até 2 linhas) mas sem
  altura mínima reservada — um título de 1 linha ocupa menos espaço vertical que um de 2,
  empurrando o resto do card pra cima. O `components/ProductCard.tsx` (mesmo padrão de card,
  mesma vitrine) já resolve isso com `min-h-10` no título — só o `GigCard` estava sem.
- Correção: adiciona `min-h-10` ao título do `GigCard`, igualando ao padrão já usado no
  `ProductCard`.
- Arquivos: `components/GigCard.tsx`.
- Validações: `npx tsc --noEmit`, `npx eslint components/GigCard.tsx` e busca por cor fixa no
  arquivo alterado — todos sem problemas.

## 2026-09-23 — Corrige (de vez) CSP bloqueando o upload pro Vercel Blob: faltava vercel.com

- Objetivo: a entrada anterior deste changelog (mesmo dia) liberou
  `https://*.public.blob.vercel-storage.com` no CSP por suposição — o usuário confirmou que
  **continuou** travando. Em vez de tentar mais um palpite, pedi print do DevTools (Console +
  Network) do usuário: o Console mostrava repetidamente "Refused to connect to
  'https://vercel.com/api/blob/?pathname=...' because it violates ... connect-src" e a aba
  Network, sem filtro, mostrava só a chamada pro nosso `/api/upload` (200, retorna o token) e
  nenhuma chamada depois disso — a "requisição fantasma" nem aparece no Network porque o Chrome
  bloqueia via CSP antes de despachar.
- Causa raiz real (confirmada lendo `node_modules/@vercel/blob/dist/chunk-YYMLUMXS.js`): o
  endpoint que o `upload()`/`put()` do cliente usa pra fazer o PUT de verdade é
  `defaultVercelBlobApiUrl = "https://vercel.com/api/blob"` — um host fixo da própria lib, sem
  nenhuma relação com `*.blob.vercel-storage.com` (esse domínio só é usado depois, pra montar a
  URL pública de leitura do arquivo já enviado). O CSP nunca liberou `https://vercel.com`, então
  o PUT sempre foi bloqueado, e a promise de `upload()` ficava presa num retry interno da lib
  (`isNetworkError` classifica o "Failed to fetch" do bloqueio de CSP como erro de rede e tenta
  de novo, até 10x com backoff) — daí o carregamento "infinito" mesmo com o timeout de 60s da
  entrada anterior deste changelog (o abort só cancela a tentativa em andamento, não impede a
  lib de já ter perdido minutos tentando de novo antes disso, dependendo de quando o usuário
  desistiu de esperar).
- Correção: adiciona `https://vercel.com` ao `connect-src` em `next.config.ts` — esse é o host
  que realmente precisava estar liberado; os dois hosts `*.blob.vercel-storage.com` da entrada
  anterior continuam lá (usados pra exibir a imagem depois via `<img>`/`next/image`, cobertos
  também por `img-src https:`, mas sem custo mantê-los explícitos no connect-src também).
- Arquivos: `next.config.ts`.
- Validações: `npx tsc --noEmit` e `npx eslint next.config.ts` sem erros. Peço ao usuário para
  testar de novo e confirmar antes de considerar resolvido — as duas tentativas anteriores
  pareciam certas e não foram.

## 2026-09-23 — Corrige CSP bloqueando o upload direto pro Vercel Blob

- Objetivo: o usuário reportou que, mesmo após o timeout de 60s adicionado em `lib/uploadFile.ts`
  (entrada anterior deste changelog), o upload de capa continuava girando indefinidamente. Antes
  de aplicar outra correção especulativa, investiguei mais a fundo em vez de assumir que o
  timeout resolveria: `select cover_image_url from gigs/products/portfolio_items where ... is not
  null` no Supabase (`mcp__Supabase__execute_sql`) mostrou **zero uploads de imagem concluídos
  com sucesso** em qualquer uma dessas tabelas desde sempre — não é uma falha de rede pontual de
  um usuário, é sistêmico.
- Causa: `next.config.ts` define um `Content-Security-Policy` cujo `connect-src` libera apenas
  `https://*.blob.vercel-storage.com`. A URL real de upload do Vercel Blob tem **dois** níveis de
  subdomínio — `https://<storeId>.public.blob.vercel-storage.com` —, e um wildcard de CSP (`*.`)
  só casa um único nível de subdomínio. Isso bloqueia silenciosamente o PUT que o navegador faz
  direto pro Blob (fora da nossa rota `/api/upload`, que só emite o token — por isso ela sempre
  responde 200 e não aparecia nenhum erro nos logs do Vercel), fazendo o `upload()` do
  `@vercel/blob/client` nunca resolver nem rejeitar.
- Correção: adicionado `https://*.public.blob.vercel-storage.com` ao `connect-src`, junto com a
  entrada existente (mantida por segurança, caso algum ambiente use um domínio sem o subdomínio
  `public`).
- Arquivos: `next.config.ts`.
- Validações: `npx tsc --noEmit` e `npx eslint next.config.ts` sem erros. Reprodução real em
  produção depende de repetir o upload após o deploy — pedir ao usuário para confirmar.

## 2026-09-23 — Corrige upload de imagem travando com carregamento infinito

- Objetivo: corrigir bug reportado pelo usuário — no modal "Editar anúncio" (e nos demais
  formulários que fazem upload de imagem: produtos e portfólio), o botão de enviar/trocar a
  capa fica girando indefinidamente sem nunca terminar nem mostrar erro.
- Investigação: `mcp__Vercel__get_runtime_errors` não mostrou nenhum erro em `/api/upload` nos
  últimos 7 dias, e `mcp__Vercel__get_runtime_logs` mostrou que as duas tentativas do usuário
  bateram em `/api/upload` (o passo de gerar o token de upload) e retornaram 200 — ou seja, a
  rota da nossa aplicação funciona. `BLOB_READ_WRITE_TOKEN` está configurado no projeto. O que
  falta depois disso é o PUT direto do navegador pro Vercel Blob (fora do nosso servidor, não
  aparece nesses logs); quando esse PUT trava numa rede instável/bloqueio de rede, a promise
  de `upload()` (`@vercel/blob/client`) nunca resolve nem rejeita, então o `try/catch/finally`
  de quem chama (`handleCoverUpload` etc.) nunca roda e o spinner (`uploadingCover`/
  `uploadingGallery`/equivalentes) fica preso pra sempre — sem essa promise nunca settar, não
  há como o estado de loading se recuperar sozinho.
- Correção: `lib/uploadFile.ts` agora passa um `abortSignal` com timeout de 60s pro `upload()`
  do Vercel Blob. Se o envio não terminar nesse prazo, o upload é cancelado e o `uploadFile()`
  rejeita com uma mensagem clara ("O envio demorou demais e foi cancelado..."), que já é
  capturada e exibida pelos formulários existentes (produtos, serviços, portfólio, entregas) —
  nenhuma mudança necessária nesses arquivos, pois o `finally` deles volta a rodar assim que a
  promise settar.
- Arquivos: `lib/uploadFile.ts`.
- Validações: `npx tsc --noEmit` e `npx eslint lib/uploadFile.ts` sem erros.

## 2026-09-23 — Corrige duplicação de título/criador nos cards de serviço sem capa

- Objetivo: corrigir bug reportado pelo usuário (print da home) — serviços sem capa cadastrada
  ("Vou criar o logo da sua marca", "Vou editar seu vídeo do YouTube", "Vou organizar o seu
  servidor de Discord", todos do Noisyboy) apareciam com categoria, título e nome do criador
  repetidos duas vezes dentro do mesmo card na vitrine da home.
- Causa: `components/GigCard.tsx`, variante `marketplace`, renderizava categoria + título +
  criador dentro do placeholder que substitui a capa ausente (área da imagem) e o corpo do card
  já renderiza esses mesmos dados logo abaixo (avatar, nome do criador, título, entrega e
  preço) — informação duplicada sempre que `gig.coverImageUrl` não existe.
- Arquivos: `components/GigCard.tsx`.
- Correção: o placeholder da capa ausente (variante marketplace) agora mostra só o rótulo da
  categoria, sem repetir título e criador, que continuam aparecendo uma única vez no corpo do
  card.
- Validações: `grep` por hex/paleta Tailwind fixa no arquivo alterado (nenhum resultado).

## 2026-09-23 — Continuação da home aprovada em HTML

- Objetivo: aplicar a proposta aprovada da vitrine ao rodapé, substituindo o tutorial numerado por uma conversa explicitamente ilustrativa.
- Arquivos: app/page.tsx; components/HomeCatalogTabs.tsx; components/GigCard.tsx; components/ProductCard.tsx; components/Footer.tsx; CLAUDE.md.
- Vitrine com filtros locais Serviços/Produtos digitais/Jogue comigo e cards abertos compactos. Pedidos em duas colunas no desktop, perfis reais junto ao convite para criadores, comunidade expandível, FAQ lateral e faixa final laranja.
- Mantidos dados reais, capas reais quando disponíveis, links e solicitação de serviços existentes. Sem anúncios fictícios; ausência de capa usa título/categoria reais. Tokens existentes preservam os temas claro e escuro. Nenhuma mudança em autenticação, pagamentos ou banco.
- Validações: TypeScript, ESLint dos componentes alterados, git diff --check e busca por cores fixas passaram. Build webpack validado com configuração pública de exemplo (não é teste de integração com Supabase).


## 2026-09-23 — Direção laranja aplicada ao restante da home

- `app/page.tsx`: vitrine e pedidos com divisores e textos mais diretos; profissionais e publicações reunidos antes de explicar a contratação. A primeira publicação fica à vista, com as demais acessíveis por expansão. O final agora segue uma sequência clara: como funciona, convite para publicar o próprio trabalho e dúvidas frequentes.
- `components/ProductCard.tsx` e `components/GigCard.tsx`: capas reais aparecem quando cadastradas; placeholders permanecem para anúncios sem imagem. O card de produto perde a sombra e usa contorno mais leve.
- `components/CreatorCard.tsx`: variante compacta para o início, com nome, usuário e selo quando aplicável, preservando o card completo nas outras páginas.
- `CLAUDE.md`: documentada a ordem e os padrões da página completa.
- Validação: TypeScript, ESLint, `git diff --check` e build Webpack concluídos. A compilação usou valores fictícios nas variáveis Supabase; os dados reais precisam ser conferidos no ambiente publicado.


## 2026-09-23 — Home laranja aprovada

- `app/globals.css`: identidade laranja, marfim neutro e carvão com tokens claros/escuros e contraste de CTAs.
- `app/page.tsx`: busca, categorias, faixa de publicação, vitrine real em duas colunas mobile e pedidos publicados sem repetir a introdução.
- `components/GigCard.tsx`: variante marketplace com preço abaixo do título, preservando os demais consumidores.
- `components/Header.tsx` e `components/MobileNav.tsx`: marca legível, barra inferior integrada com rótulos e Biblioteca preservada.
- `CLAUDE.md`: documentação da direção aprovada; nenhuma imagem ou oferta fictícia da prévia foi incluída.
- TypeScript e ESLint dos componentes alterados passaram sem erros.
- Build compilou e validou tipos, mas a pré-renderização parou por ausência de `NEXT_PUBLIC_SUPABASE_URL` no ambiente. Inspeção visual não executada: `agent-browser` não está instalado.
- Contrastes medidos: texto/CTA 5,39:1, hover 4,60:1 e links sobre marfim 6,32:1. Alterações integradas à main em b474cfc.

Este documento mantém a continuidade técnica do Jobê entre diferentes IAs. Toda alteração no
site deve gerar uma entrada nova no topo deste arquivo, conforme a regra do `CLAUDE.md`.

## 2026-09-23 — Remove gradiente do hero da home

### Objetivo

- Pedido do usuário: remover o gradiente aplicado ao hero na alteração anterior ("Deixa a home
  mais clean com cards suaves em framboesa", PR #44) — manter o card, mas com fundo sólido.

### O que mudou (`app/page.tsx`)

- O hero deixou de usar `bg-gradient-to-br from-(--color-accent-soft) via-(--color-surface)
to-(--color-surface)` e passou a usar apenas `bg-(--color-accent-soft)` (cor sólida, mesmo
  token, sem gradiente).

### Validações executadas

- Grep por `#[0-9a-fA-F]{3,6}` e por classes de paleta fixa do Tailwind em `app/page.tsx`: nenhuma
  ocorrência.

> **Nota de manutenção:** o restante deste arquivo (a partir daqui) está com conteúdo binário/corrompido
> no repositório desde o commit `b4eab40` ("Atualiza paleta: Atomic Orange + Ice Cream Blue"). O
> último ponto em que o arquivo estava íntegro em texto foi o commit `ffdd893`. Não foi tentado
> reverter/recuperar o histórico corrompido nesta alteração (fora do escopo do pedido); recomenda-se
> uma tarefa dedicada para investigar a causa e, se possível, recuperar as entradas perdidas a partir
> do git history (`git show ffdd893:AI_CHANGELOG.md` em diante).

## 2026-09-23 — Refinamento visual da home: cores e cards mais "clean"

### Objetivo

- Pedido do usuário: deixar a aparência da tela inicial mais bonita e clean, sem alterar a
  paleta em si (Marfim + Framboesa Jobê já definida em `app/globals.css`).

### O que mudou (`app/page.tsx`)

- Hero: passou a ter fundo em card (`rounded-3xl`) com gradiente suave
  `from-(--color-accent-soft) via-(--color-surface) to-(--color-surface)`, dando mais presença de
  marca sem introduzir cor nova.
- Barra de busca: sombra mais perceptível (`shadow-md shadow-black/5`) para destacar sobre o
  gradiente do hero.
- Bloco lateral "Do seu jeito, no seu tempo": virou um card (`bg-surface`, `border`, `rounded-2xl`,
  `shadow-sm`) com itens em hover de fundo (`hover:bg-(--color-surface-2)`) em vez de divisórias
  simples — mesmo padrão de card já usado em `ProductCard`/`GigCard`.
- Faixa de selos ("Preço visível" / "Conversa antes de fechar" / "Compra em um só lugar"): trocou a
  borda solta (`border-y`) por um card (`rounded-2xl border bg-surface shadow-sm`).
- Grade de categorias: cada categoria virou um card clicável (`rounded-2xl border bg-surface
  shadow-sm`) com leve elevação no hover (`hover:-translate-y-0.5 hover:shadow-md`), em vez de uma
  lista com apenas borda inferior.
- Seção "Do primeiro oi ao trabalho entregue": os números dos passos (01/02/03) agora aparecem em
  um círculo `bg-(--color-accent-soft) text-(--color-accent-text)`, reforçando a identidade
  framboesa sem virar CTA.
- Seção "Tem um trabalho para mostrar?": virou um card cheio em `bg-(--color-accent-soft)` (framboesa
  suave), no lugar de bordas soltas — destaca o CTA final da página.
- `OpportunitySpotlight` (pedidos abertos): o painel passou a usar `bg-(--color-surface)` com
  `shadow-sm` em vez de `bg-(--color-bg)` (mesma cor do fundo da página), para realmente ler como
  card e não apenas uma borda.

### Decisões técnicas

- Nenhuma cor nova foi criada: todos os ajustes reaproveitam tokens já existentes em
  `app/globals.css` (`--color-accent-soft`, `--color-accent-text`, `--color-surface`,
  `--color-surface-2`), conforme a regra de ouro do design system (nunca cor "crua").
- Reaproveitado o padrão de card já usado em `components/ProductCard.tsx` e
  `components/GigCard.tsx` (`rounded-2xl border border-(--color-border) bg-(--color-surface)
shadow-sm`), em vez de inventar um estilo novo.
- Grep por `#[0-9a-fA-F]{3,6}` e por classes de paleta fixa do Tailwind (`bg-red-`, `text-blue-`
  etc.) em `app/page.tsx` não encontrou ocorrências.

### Validações executadas

- `npx tsc --noEmit -p .`: sem erros em `app/page.tsx` (repositório precisou de `npm install`
  local, que não estava presente no ambiente).
- `npx next build`: compilação e checagem de tipos concluídas com sucesso; a etapa de
  pré-renderização de `/` falha neste ambiente por falta das variáveis `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (não há `.env` neste sandbox) — falha pré-existente e não
  relacionada a esta alteração de UI.
- Não foi possível abrir o app no navegador neste ambiente (sem credenciais Supabase); a revisão
  do resultado final em produção/preview fica pendente para quem tiver acesso ao ambiente com as
  variáveis configuradas.

Y��x-���jם��i��+��j[h��ܢ���~v�:-jZ.����)޳R2��7L;7&�6�FR�FW&:|;VW2&�0��W7FRF�7V�V�F���L:��6��F��V�FFRL:�6�6F���,:�V�G&RF�fW&V�FW2�2�F�F�FW&:|:6���6�FRFWfRvW&"V�V�G&F��f��F��FW7FR'V�f��6��f�&�R&Vw&F�4�TDR��Fࠢ22##b���#"(	B&V��:|:6�F6��F��6�V�F�7�6�F�f�26V���v�ࠢ��FV�F�FFR��6�(	��'V&�(	�FV���RFR6W"��6�F�R&W7FW&FV����6�6W76���&�f�FW&��6��V�FRV�6W7<:6�l:ƖFF�7W&6RFVf��R7W'&V�EW6W$�F��F6�&�&BRF֖�7G&:|:6�v�&&V7W6�f�6�F�FW2��6W'f�F�"�6V�f��&6�&7&VF�"�P�F֖�7G&F�"��6���V�G���BFR&VV�&��6�&V6V&WR�W6�&�F\:|:6���Ɩ�2F:&VF�7&�F�"FV��&�FR��F"&V�W&f����6�V�V�F�6W7<:6��:6�W��7FR��W&f��,;7&���6��f�wW&:|;VW2RFV�;��6�2F�,:��FV��&�FR77V֗"V��FV�F�FFRf�7L:�6���FF�2FV���7G&F�f�26��F��V�F�7��:�fV�2V�26���6��F\;�F�;�&Ɩ6�Ff�G&��Rࠢ22##b���#"(	B&�F\:|:6�F26��F2RF�f:|:6�6VwW&FR7&VF�'0���&V��f�FW&֗7<:6�FRW67&�FF�&WFFR6��F2�;F��2RWFV�F�6F2V�&�f��W6��VF�:|:6�F�W&f���6��WL:��6�2R�F���2v�&76��"%726V7W&�G���f��W&�6���FV�F�FFP��'F�F�"WF��V�B���W66��f����$�2RW&֗7<;VW2Ɩ֗FF2:26��V�2VF�L:fV�2��F�f:|:6�W6V�%26V7W&�G�FVf��W&�6��F��V6W7<:&�V�2&7&W66V�F"�V��7&VF�&:,;7&�6��F6V�Ɩ&W&"W67&�F;�&Ɩ6V�&��W6��&��W6�fW&�f�6:|:6��fƖ:|;VW2R6��FF�&W2��FW&��2FV��&�FR6W"�FW,:fV�2V��;�&Ɩ6��FV�FRF�f:|:6�W�Ɩ6�2,;7����276�2RW��vR6�:��6�F�2FW&��2R&Vw&2FR6VwW&�:v��fƖF:|:6�U4Ɩ�BRG�U67&�B6��6�\:�F�3�FW7FW25�6��f�&�&�&��VV��FR&��W6�fW&�f�6:|:6�RfƖ:|;VW3�Gf�6�'2&Wf�6F�2��'V��B6�����RR76�RV��G�U67&�B��2vW&:|:6�FP��F֖�W��vR2f&�:fV�27W&6RFR6W'f�6R&��R�W6V�FW2���&�V�FR��6�ࠢ22##b���#"(	B&Vf���V�F�VF�F�&��Rf�7V�F���P���6&\:vƆ���FVw&F���&f����fVv:|:6�V�WFV�FV�2��FW&�VF�:&�2R'W666��,;7GV��6W7<:�fV����W&�6��Ɩ�wVvV�6��7&WF�'W66&��6��R�FW&�F�f&V&Ɩ6"VF�F���6FVv�&�26V�&'&2FV6�&F�f3�WF2�WWG&3�6��f�FR&�f�76����6V�&��W76FR&V�F��6&G2FR6W'f�:v�6��:|:6�FRCB�R6��F�&��F�67&WF��6V���:|:6�FRFW6��6�V�F���6V��FR�fW'F�WWG&�&W6W'fF�2FF�2&V�2�&�F2R�W&:|;VW2W��7FV�FW2��&VfW,:��6�2;�&Ɩ626��7V�FF3�vWD��2�v�&���f��FU��R6������fƖF:|:6�Ɩ�BRG�U67&�BW�V7WFF�3���7\:|:6�f�7V�V��fVvF�"R'V��B6���WF��:6�&VƗ�F�2�W7F&Wf�<:6�ࠢ22##b���#"(	B��&�F�&v旦F�:v����6����222�&�WF�f��f�W"���R6��GW��"W76�V�V��&FV�&Wf�<:�fV��6V�֗7GW&"FW66�&W'F�V&Ɩ6:|:6�P�W�Ɩ6:|:6�F�&�6W76�ࠢ222�VF�:v0����vR�G7���fVv:|:6���FW&�f�&�RV�6֖���V�W&F�R��&����F�6��VG&�:|;VW3��W66�ƆW"6FVv�&��fW"�:|;VW2�V&Ɩ6"VF�F�RV�FV�FW"6��G&F:|:6���26\:|;VW2f�&�&V�&FV�F2&6VwV�"W76R�W6��W&7W'6�6FVv�&�2(i"f�G&��R(i"VF�F�0�V&Ɩ6F�2(i"gV�6����V�F�(i":&V&&�f�76����2(i"6��V�FFR(i"L;�f�F2���L:�GV��FR6FVv�&�2v�&W�Ɩ66��6�&W�VRW76R:��&��V�&���F�F��&�F���fVv:|:6�6��F��V&��:fV���6V�V�"�6V�6&G26���&�F�2�R:�6��W2FV6�&F�f�2ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BRv�BF�fb��6�V6�6��6�\:�F�26V�W'&�2ࠢ22##b���#"(	BgV�F���FVw&F���FW7FVRFR��'GV�FFW0��222�&�WF�f��VƖ֖�"�&V6�'FR'&�6�F�&��6�R��FVw,:����gV�F��&f��F:v����6��ࠢ222�VF�:v0����vR�G7���FW7FVRFR��'GV�FFW276�RFR��6���"�7W&f6V&��6���"�&vP�W&FWR6��'&���FV�F�FW�F�2�W7:v�V�F�2�:|;VW2RF�f�6�&W2���FW&F�2ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BRv�BF�fb��6�V6�6��6�\:�F�26V�W'&�2ࠢ22##b���#"(	BFW7FVRFR��'GV�FFW2��2Ɩ��222�&�WF�f��6�'&�v�"�W6�f�7V�W�6W76�f�F�&��6�FR��'GV�FFW2����RR&WF�&"V�V�V�F�26�Т,:��6�FR��FW&f6RvW&F�"�ࠢ222�VF�:v0����vR�G7��&V��f�F�2�6V��&�66��:�6��R�&�&F6���&�FRf��&�6��fW&��"���L:�GV��f�6�R�V��"���2F�&WF�R6��VV'&2�GW&�2��6V�V�"��FW67&�:|:6�f��V�7W'FF��6VwV�F�5Df�&�RV�Ɩ�F�67&WF�R�2VF�F�2&V6V�FW2v�&ТV�&W6V�F:|:6���26��7FR�WWG&���&��6�W6V�2&�&F2R7WW&l:�6�W2F�FW6�v�7�7FV��6V�FW�F�FV6�&F�f�6�'&RgV�F�6���&�F�R6V�:�6��W2FR�ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BRv�BF�fb��6�V6�6��6�\:�F�26V�W'&�2ࠢ22##b���#"(	B��'GV�FFW2;�&Ɩ62�&'&��&��P��222�&�WF�f����FW"�FƆ�F�fVVBf�<:�fV�&V�VW"W76����6�W6�fRf�6�F�FW2R6��&F�&W2ࠢ222�VF�:v0���6����V�G2���&��T�b�G7��&(	���'GV�FFW>(	�FV���RFRFWV�FW"F�V�7&VF�&Rv�&�&V6RW&��V�FV�V�FR�&'&f�WGV�FR��fW&��"���FW7F���76�R6W"���'GV�FFW6�VR:�;�&Ɩ6�:|;VW2FR&W7��FW"RV�f�"&��7F�6��F��V�W��v��F�WFV�F�6:|:6�R2W&֗7<;VW2�:W��7FV�FW2��&V��f�F6��7V�FF�6����FRV���7W&6RfV�FW�6�W6�f�V�FRV�&'&��&��Rࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BRv�BF�fb��6�V6�6��6�\:�F�26V�W'&�2ࠢ22##b���#"(	B��'GV�FFW2�&'&��fW&��"��&��P��222�&�WF�f��6���6"�6W76��fVVBW�6�W6�f����V�Rf�WGV�FR��fW&��"��F�6F�����&��Rࠢ222�VF�:v0���6����V�G2���&��T�b�G7��6��F26��V�7&VF�&&V6V&V�V�&(	���'GV�FFW>(	��6�Т:�6��R,;7&�����F�F�&�F6�&�&B���'GV�FFW6��&:��֗F�F&f�6�F�FW2R6��&F�&W26��V�2;726��7V�F"�2:��2F�W&f��&V����V�G&"��fVVB�6��V�FR��f&f�6F�f���FV�vW&�F:&VF�7&�F�"�:6�6V�FR��W6��FV��ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BRv�BF�fb��6�V6�6��6�\:�F�26V�W'&�2ࠢ22##b���#"(	BFƆ�6��F�6����&�fVVBFR��'GV�FFW0��222�&�WF�f��F"6W76�,:�F��fVVBFRVF�F�26V���7G&"V��:|:6���;�F��&6��&F�&W26��V�2ࠢ222�VF�:v0���6����V�G2�VFW"�G7���6&\:vƆ�6��7V�F�6��&��W6F�W&f��WFV�F�6F�RF�6����(	�fVVBFR��'GV�FFW>(	�:�fVv:|:6�FW6�F�R��V�R��&��R6��V�FRV�F�6��F�77V��V�7&VF�&��f�6�F�FW2�6��&F�&W2R6��F26V�W&f��FR7&�F�"6��F��V�fV�F��fVv:|:6��FW&��"��G&�6FR6W7<:6�GVƗ�F�F��FV�F�FFRW��&�FV�F�f�6�&�ƖFFRF�FƆ�ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BRv�BF�fb��6�V6�6��6�\:�F�26V�W'&�2ࠢ22##b���#(	BFW7FVRFRVF�F�2����RRfVVBW�6�W6�f�&7&�F�&W0��222�&�WF�f��F�&�"V&Ɩ6:|:6�F�VRV�W76�&�7W&V�gV�:|:6�6V�G&�Rf6���V�FRFW66�&W'F����R��V�G&Vv"�27&�F�&W2V�fVVBFVF�6F�V�2VF�F�2FR6W'f�:v�2�R&�GWF�2ࠢ222�VF�:v0����vR�G7��F�6���FV�6\:|:6�FR�F�FW7FVR�FW2Ff�G&��R�6��W�Ɩ6:|:6�F�f�W����5D2&V&Ɩ6"RW���&"R,:�f�F2G,:�2��'GV�FFW2��2&V6V�FW2F�&�6����F6�&�&B���'GV�FFW2��7&�F��fVVBW�6�W6�f�F:&VF�7&�F�"�V�6��V�;��6��6��f��G&�2�"6FVv�&��6�V�WF��,;7&��R6��V�FRV&Ɩ6:|;VW2FRW76�2&�7W&�F��v����F6�&�&B�vR�G7�����f�fVVBv��R6W76�F�&WF����V"F���V���6����V�G2�6W'f�6U&WVW7D6&B�G7��F�6���F���F�FRfVVB6���V�GW&��26��f�'L:fV��6VТGWƖ6"6����V�FR�V�f�W��FR��FW&W76R��FW�F�2FRFW66�&W'FRV&Ɩ6:|:6�v�&FV���W��:�6�F�VRW76��FR&�7W&"V�6W'f�:v��R&�GWF��&W6W'f�F���W6��f�W��FR6��fW'6R&��7Fࠢ222fƖF:|:6��U4Ɩ�B6��6�\:�F�6V�f�6�2��v�BF�fb��6�V6�6��6�\:�F�6V�W'&�2��'W66��2'V�f�2�FW&F�26V�6�&W27'V2�R6�76W2f��2FR�WFF��v��Bࠢ22##b���#(	BV&Ɩ6:|;VW2FR6W'f�:v�2&�7W&F�0��222�&�WF�f��W&֗F�"VRV�W76�V&ƗVR�6W'f�:v�VRW7L:&�7W&�F��6���(	�&V6�6�FR�w\:��&�f�W"'FRF��WR6��(	��R&V6V&&W7�7F2FR&�f�76����2FV�G&�F���,:���&V&�fV�F"F�F6VwW&�:vR��&�FW��7FV�FRFR6��fW'6�&��7F�v�V�F��V�G&VvP�fƖ:|:6�V�fW�FR7&�"V�f�W��FR6��G&F:|:6�&�V��ࠢ222�VF�:v0���7W&6S�7&�FF&V�6W'f�6U�&WVW7G66��W��&:|:6�FR3F�2�$�2�:��F�6W2R%72&�V&Ɩ6"�V�6W'&"RFV���7G&"��FW&W76R�7W7F���&WVW7G6v��R�l:��7V��6�W&6U�6W'f�6U�&WVW7E��F�6��V�6�FFR�"&�f�76�������'GV�FFR�����'GV�FFW2����f2:v��2;�&Ɩ6�FRV&Ɩ6:|:6�RFRvW&V�6��V�F����6�V��F�6�V�WF��FR6'&Vv�V�F�Rf��G&�2�"6FVv�&���6����V�G2�6W'f�6U&WVW7EV&Ɨ6�W"�G7�R6����V�G2�6W'f�6U&WVW7D6&B�G7��f�&�V�:&��&W7��6�f��6&G26��7F�2�W7FF�2FRWFV�F�6:|:6��V�6W'&�V�F�R��F�FR&W6V�F:|:6����FV���7G&"��FW&W76R��&�6�fƖF�W&f��&�f�76�����'&R�VF�F�W'6��Ɨ�F�R�6��fW'6�&Vv�7G&�V�6vV���6��R��F�f�6�WF�"��&�f�76����6VwVRV�L:6�&FV��W��7FV�FRFR&��7F��6����V�G2�VFW"�G7�R�vR�G7��F�6���F�26W76�2&��'GV�FFW2�֖�0�V&Ɩ6:|;VW2R(	�V&ƗVR�VR&V6�6(	��&W6W'f�F��2Ɩ�2�FW&��&W2���V�R��&��R��F�72�4U%d�4U�$UTU5E���%ET�D�U2��F�F�7V�V�FF'V�FWGW&R2&Vw&2FR6��F��V�FFP�&�WG&2�2ࠢ222fƖF:|:6��f�W��FR&�6�W�W&6�FF�V�G&�6:|:6�6��&���&6��7&�:|:6��"6��&F�"R&W7�7F�"7&�F� �vW&&�W�F�V�FRV�VF�F�W'6��Ɨ�F��V�V�Ɩ�FRFW7FRW&��V6WR��&�6���U4Ɩ�BRG�U67&�B6��6�\:�F�26V�W'&�3�'V��BFR&�G\:|:6�6��6�\:�F��2C&�F2W6�F�6��V�FP�f&�:fV�2f�7L:�6�2FRfƖF:|:6������R�Ɨ7FvV��V&Ɩ6:|:6�RvW&V�6��V�F�&W7��FW&��EE#��6W'f�F�"FR&�G\:|:6���6ò��D��6��f�&��R�2L:�GV��2�5D2RW7FF�f���W7W&F�2��'W66�"6�&W27'V2Rv�BF�fb��6�V6�6V��6�',:��6�3�2FV�2W6�6��V�FR�2F��V�2F�FW6�v�7�7FV�R&Vw&2&W7��6�f2�"'&V����B��7W&6RfW&�f�6F�6��G,:�2%726V7W&�G���f��W&�6V&6��F�f����G,:�2��:�F�62$�2��:��F�6W2FRƗ7FvV��WF�"R:��F�6R;��6��"��'GV�FFR�&�f�76�����Gf�6�'2�:6���F&Т�W'F��f�ƖvF�6W'f�6U�&WVW7G6��2f�6�2&WF�&�F�2<:6�&VW��7FV�FW2V��WG&2F&V�0�R�6��f�wW&:|:6�FR6V�2f�F2F�WF�����7\:|:6�f�7V�WF��F��F�:6�;FFR6W"W�V7WFF���fVvF�"&V��F�&��VV���6Ɔ�7BR��fVvF�"��6��:6�;FFR&��"�&��:&���"W'&�FR6W'F�f�6F�F&VFR�'V��B��D��6W'f�F�P�&�F2f�&�fƖFF�26���6�&W'GW&�FW&�F�f�6V�f�&�"V�6GW&f�7V���W��7FV�FRࠢ22##b���#(	B�W&�6V�,;7GV��FV6�&F�f�222�&�WF�f��&V��fW"�,;7GV��V�6���F6��F�L:�GV��F���R���FF�V��W7\:&��6���W6F�P�'F�f�6����6V�V�"��F"��2��7F��L:�GV��&��6��R&VGW��"V�F�FFRFRV�V�V�F�26��WF��F���&��V�&F�'&ࠢ222�VF�:v0����vR�G7��&V��f�F�2�FW�F�(	�6W'f�:v�2R&�GWF�2F�v�F�2V�V�<;2�Vv.(	�R7V&'&�FV6�&F�f���W&�v�&6��\:vF�&WF�V�FRV��L:�GV��R��L:��&��7F6���WF��FW�F�FR�����v�&����6V�W&FW"��f�&�:|:6�gV�6����ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BR'V��BFR&�G\:|:6�F23�&�F26��6�\:�F�26V�W'&�2��'W66�"6�&W27'V2V��vR�G7�6V��6�',:��6�2��fW'<:6�V&Ɩ6F��7V6���FV��fVvF�#��,;7GV���:6�&V6R��2��L:�GV��7V&�R3b���&��V�&F�'&R:v��6��F��V6V��fW&f��r��&����F��RW'&�2FƖ6:|:6�ࠢ22##b���#(	B6&G2FR6W'f�:v�26��7F�2����P��222�&�WF�f��Wf�F"VR6F6W'f�:v��7WRV6RV�FV���FV�&��6V�V�"R�VƆ�&"�&�F��FR�V�GW&�F6\:|:6�(	�6W'f�:v�2FRVV�6&Rf�W.(	�ࠢ222�VF�:v0���6����V�G2�v�t6&B�G7��F�6���FV�&W6V�F:|:6�6��7F�6��������&��R�6��֖�GW&��FW&��6��F\;�F���W&'V��F�R&\:v���FVw&F��6&\:vƆ�F�6&BV�fW�FR6�'&W�7F�: ���vV��V�FV�2���&W2��6&B&WF�&�WF��F�6�V�FR�f�&�F�fW'F�6�Fw&FR���vR�G7��f�G&��R��6��76�RF�f"&W6V�F:|:6�6��7F�W���&"R:v��0�FR6FVv�&�&W6W'f�7Vw&FRV�GV2�R��26��V�2RF�F22:|;VW26��F��V�W6�F���W6��6����V�FRR��W6��f�W��FR6�Ɩ6�F:|:6�ࠢ222fƖF:|:6��U4Ɩ�BRG�U67&�B6��6�\:�F�26V�W'&�2��'V��BFR&�G\:|:6�6��6�\:�F�6��7V6W76��23�&�F2W6�F�7&VFV�6��2f�7L:�6�2FRfƖF:|:6��V�V�7&VFV�6��&V�f���V6W7<:&��R��6�\:�F��'W66�"6�&W27'V2��26����V�FW2�FW&F�26V��6�',:��6�3��6&BW66��V�FRF��V�2F�FW6�v�7�7FV���fW'<:6�V&Ɩ6F��7V6���FV��fVvF�#�6&G2�&\:v��WF�"�L:�GV��R5D&V�FW&��&�6�Т�GW&26��6�7FV�FW2�6V��fW&f��r��&����F�R6V�W'&�2FƖ6:|:6���6��6��R���&�W �V&Ɩ6F�F�,:��6��f�&����F���&����F�&���FR6�R�&WF�&��:w&FRfW'F�6�6��ࠢ22##b���#(	B�W&�&W'F�R�FV�F�FFRg&�&�W6��,:���222�&�WF�f��FV�FW"�&WF�&��F�W7\:&��&V��fV�F��f���WF�F�F�w&F�V�FRR�w&�FRVG&�6���&�F�VRV�f��f�'W66�:v����6������FW"V�W&v�6��W&6��W6�F�6�"6����2&V6�<:6��6V�G&�6f�&�"6\:|;VW2��FV�&2VТ&��6�2&VV�6��F�2ࠢ222�VF�:v0����v��&�2�776�f���WF��,:�7V'7F�G\:�F�V�f�:�Ɩg&�&�W6��,:��66V�BR��v�Ɩv�@�v�&6��'F�Ɔ��W6�F�&\:|:6�7&��:F�6�FV�W67W&�GVƗ�F�V�6��V�F����vR�G7���W&�f��F�R6W"&W'F�6�'&R��&f���6V�w&F�V�FRR6V�6��F��W �&VV�6��F��76��GW&W&FWR�f�&�F�FR6����6&B�FW&�f�&�RV�2V�:&V�6W&F�"F�f�6�#�f��FR&V�Vl:�6��2F�,:��FV���RFRW6"G,:�26��2��4�TDR��FRF�72���U�$TDU4�t���F�&Vw&2R6��F��V�FFRf�7V�GVƗ�F2ࠢ2226��G&7FP���'&�6�6�'&Rg&�&�W6�B�cS���g&�&�W6FW�GV�6�'&R�&f�Ӣr�#3��6�'&RgV�F�7VfS�b�#S�ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BR'V��BFR&�G\:|:6�6��6�\:�F�26V�W'&�2��6��G&7FW2F�2F��V�2�VF�F�2R6����V�FW2�FW&F�26V�6�&W27'V2��E5���fW'<:6�V&Ɩ6F��7V6���FV��fVvF�"FW6�F��6���6�:|:6�&W'F�'W66�5D�F�f�6�&W0�R6�"FR�&6&V�FW&��&�6V��fW&f��rR6V�W'&�2FƖ6:|:6���6��6��Rࠢ22##b���#(	Bf���WF��,:�R�W&�6��&W6V�:vFR�&6��222�&�WF�f��F�&"6V�6:|:6�f�7V�FR:v��6V�V�W&v�R7&�"V�6�"��VF�F�V�FR&V6��V<:�fV��6���'FRF�FV�F�FFRF���,:���F"��2&W6V�:v6��W&6��:&��V�&F�'&6V�67&�f�6"�V�GW&�RFW6V�V��ࠢ222�VF�:v0����v��&�2�776��fW&FR��F�2f��7V'7F�G\:�F�V��f���WF��,:���2F��V�2FR�&6����v�Ɩv�B6��W&6��76�R6�&�fV6�F��FV�26�&�RW67W&�f�&��W7FF�2�V�F�2���vR�G7���W&�f�&�RV����f���WFFR�F���7F��6��w&F�V�FR6��G&��F���F��w&f�6�&�5D'&�6�R6&BFR6��&&W6W'fF�6�'&R7WW&l:�6�R�V|:�fV���4�TDR��FRF�72���U�$TDU4�t���F�F�&\:|:6�f�7V�R&Vw&2FRW6�F�WFGVƗ�F2ࠢ2226��G&7FP���'&�6�6�'&Rf���WF��,:��R�3���f���WFFW�GV�6�'&R�&f�Ӣ�����6�'&Rf���WF7VfS�r����6�&�FW�GV�6�'&R�&f�ӢR�Sc��6�'&R6�&�7VfS�BÓC�ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BR'V��BFR&�G\:|:6�6��6�\:�F�26V�W'&�2��6��G&7FW2F�2F��V�2�VF�F�2R6����V�FW2�FW&F�26V�6�&W27'V2��E5���fW'<:6�V&Ɩ6F��7V6���FV��fVvF�"FW6�F���W&��'W66�5D2�6&B�FW&�Rf���FR&V�Vl:�6��2&V�FW&��&�6V��fW&f��s��V�V�W'&�FƖ6:|:6�&V6WR��6��6��Rࠢ22##b���#(	B&WfW'FR�:V��FRW67&WfW"F��W&�222�&�WF�f��VF�F�W��:�6�F�F�W7\:&��&WfW'FW"��:|:6�FR�:V��FRW67&WfW"��L:�GV��F���P����G&�GW��FV�GV2�VF�:v2�FW&��&W2R�W7FFFW��2�"F��2&�&�V�2FR���WB�P�f��F"�FW�F�W7L:F�6��&�v���ࠢ222�VF�:v0����vR�G7��L:�GV��F��W&�f��F6W"�FW�F�f���$V�6��G&R�6��&R�f:v6��FV6W"�"���wV��FW2FRV�VW"V�F2�VF�:v2F�:V��FRW67&WfW"�&V��f�F�2����'BFP�G�Ww&�FW$�VFƖ�VR6��7F�FR�W&��&6W6��6����V�G2�G�Ww&�FW$�VFƖ�R�G7��&V��f�F�(	B6V���2�V�V�&VfW,:��6���&��WF�ࠢ222fƖF:|:6��w&W�"�W�V��vR�G7���V�V��6�',:��6�����W6Ɩ�B�vR�G7��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR�6V�&V�:|:6�ࠢ22##b���#(	B&V��fR�&Vf���f���F��W&�RW7F&�Ɨ��GW&F�L:�GV��222�&�WF�f���VF�:v�FW&��"�f��F�7"���ǖ��:W7Ff6�'&WFR��"��2�W7\:&����F�RV�&��@���7G&�F�VR�&�&�V�&V�W&�WG&�6��g&6R%V&ƗVR6WW26W'f�:v�2�"�L:�GV��VV'&fV�2Ɩ�2��F�F��$V�6��G&R�6��&R�"f����"Ɩ�2Fg&6R��F��f�V�F��GW&F��W&�V�"6FG&�6(	B�VRƖ6���&�FW�F�76�F�F�&vV�"�֗7GW&"�&Vf���f���vV�:�&�6�6��g&6W2f��FF2�&VV�6��G&F��&VV�fV�FR�F�,:�Т6�fW7G&���g&6W2FR7&�F�"'V�GW&F2"�V�g&6RVR6��\:v6��$V�6��G&R�6��&R�"�ࠢ222�VF�:v0����vR�G7� ���ƃ��:6�FV���2�&Vf���f���$V�6��G&R�6��&R�"(	Bv�&�G�Ww&�FW$�VFƖ�V:��L:�GV����FV�&��6��6Fg&6R6V�F�V�6V�FV�:v7W'FR6���WF�"6�<;2��:6�FWV�FRFP��V�V�FW�F�f����FW2FV�����W&��&6W6�W7FF2&6&W"�V�Ɩ�<;2����&��S�$V�6��G&RVV�f��"�%fV�F�VR6&R�"�%\:v6�"�VF�F�"�%V&ƗVRV�6W'f�:v��"�$W66�Ɔ6��6��f��:v�"�%6WP�F�V�F�f�&&V�F� ��ƃ�v��R֖�ւճW&V��6Ӧ֖�ւճb�W&V���s�֖�ւճ��W&V��(	B&W6W'f�GW&FRL:��GV2Ɩ�2V�6F'&V����B�V�L:6��W6��6RV�g&6RgWGW&VV'&"Ɩ���&W7F�F�:v���'W66�&�L;VW2��:6�V�FR�6�:|:6�ࠢ222fƖF:|:6��w&W�"�W���2'V�f�2�FW&F�3��V�V��6�',:��6�����W6Ɩ�B�vR�G7�6����V�G2�G�Ww&�FW$�VFƖ�R�G7��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR�6V�&V�:|:6���67&VV�6��G2&V�2V�f�Ww�'B��&��R�C,9s����w&�v�B�6�&�֗VҒ6GW&F�2V�R���V�F�0�F��:|:6��g&6W2F�fW&V�FW2���6�V��F���2���v�%V&ƗVRV�6W'f�:v��"��6V�&RV��Ɩ�<;2�F�7V�V�B�F�7V�V�DV�V�V�B�67&���v�GF��wV�:�&wW&Ff�Ww�'B�6V��fW&f��p���&����F�R�&W7F�FRF:v���'W66�&�L;VW2�$W�W&��V�FS�"�6V�V�"FR�6�:|:6�ࠢ22##b���#(	B6�'&�vRFW�F�GWƖ6F��W7F�W&�F����W&�R�W7F�F��F2g&6W0��222�&�WF�f���W7\:&��&W�'F�RF��2&�&�V�2��:V��FRW67&WfW"F��W&��F�6���F��VF�:v��FW&��"���FW�F�76fF�&vV�F:&V6��gV�F�fW&FR6�&�F��W&��R�f�V�FW�F�f���&V6V�F�V�6��F�FW�F���F��F�,:��VF�RV�Ɩ�wVvV���2�V��P�&�f�76�����2g&6W2��6W6&����f��&6�FR6W76�&�ƖFFR�7"���ǖ�W7Ff6��6FV��F�2bg&6W2��FV�&0��V�;��66V�FV�:vv�v�FR�$V�6��G&RVV�f���fV�F�VRf�<:�6&Rf�W"�����&�FV�G&�F��W6��ƃ�F�FW�F���F�(	B6��f�&�F���7V6����F���D��&V�FW&��F���W6��6���552�7"���ǖ6�'&WF���6�F���'6��WFS�v�GF�����V�v�C����fW&f��s���FFV���W76P�&��6�FRFW�F�FW6�V6W76&��V�FRw&�FRFV�G&�F�L:�GV��W&'&�66F�R�:6�FWfW&�W��7F� �F��V�F�VRW7Ffࠢ222�VF�:v0���6����V�G2�G�Ww&�FW$�VFƖ�R�G7��&��&6W6v�&Ɩ�V�F<;2��:|:6����f&� ��'&�vL;7&�7%FW�F&V6V&RV�g&6R7W'FRf��&��V�F�"FRFV�����Vv"F�6��6FV�:|:6�FRF�F22g&6W2���7��&��v��R��Ɩ�R�&��6����r�gV��'&V��v�&G0�Ɩv��&�GF��&v&�F�"VR�FW�F�6V�&RVV'&FV�G&�F�6��L:���W"F�L:�GV���V�fW�FP�'&�66"W7F�W&"�&wW&V�FV�2WVV�2���vR�G7��g&6W2F��W&�&VW67&�F2�V�F����2�V����&�f�76�������27W'F2�W'F�F�F���F�$f:v6��FV6W"�"�&�v��&6&W"&V�V�V�Ɩ��W6��V�FV�2WVV�3��$V�6��G&RVV�f��"�%fV�F�VRf�<:�6&R�"�%\:v6�"�VF�F�"�%V&ƗVR6WW26W'f�:v�2�"��$W66�Ɔ6��6��f��:v�"�%6WRF�V�F�f�&&V�F�"(	B��FV�F��FW&�:&�6�V�G&RVV�'W66�RVV��fW&V6R�7%FW�C�$V�6��G&RVV�f��RfV�F�VRf�<:�6&Rf�W"�&ࠢ222fƖF:|:6��w&W�"�W���2'V�f�2�FW&F�3��V�V��6�',:��6�����W6Ɩ�B�vR�G7�6����V�G2�G�Ww&�FW$�VFƖ�R�G7��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR�6V�&V�:|:6�����7\:|:6�F��D��&V�FW&��F����'V�FWf�fWF6���6��f�&�F�VR�7"���ǖv�&6��L:�Т<;2g&6R7W'Ff����:6�6��6FV�:|:6�F2b��67&VV�6��B&V�V�f�Ww�'B��&��R�3�9s�CB�f���w&�v�B�6�&�֗VҒV�F��2��7F�FW2F���:|:6�FW�F�FRV�Ɩ�<;2�6V�6�'&W�6�:|:6��FV�G&�F:&VF�w&F�V�FR�6V�W7F�W&"��&wW&FFV�ࠢ22##b���#(	B�:V��FRW67&WfW"���W&�F���P��222�&�WF�f��VF�F�F�W7\:&��V���:|:6�F��'6V�F�vF�RF�v�FF�"�G&�6�F��g&2�g&6W2��&�F�F���2&��V�&�26VwV�F�2�V�G&"��6�FR�6��FW�F�2f��FF�2F�F�&VV�6��G&F��W7\:&��V�F�&VV��fW&V6R�7&�F�"��W&wV�FV���FRFWfW&�f�6#�W66�Ɔf�����W&�F���R����Vv"F�L:�GV��f���$f:v6��FV6W"�"ࠢ222�VF�:v0���6����V�G2�G�Ww&�FW$�VFƖ�R�G7����f��6ƖV�B6����V�B��F�v�F6Fg&6R6&7FW&R� �6&7FW&R�W6�vR76&,;7����V�����W6W6U7��4W�FW&��7F�&V&6�V6 �&VfW'2�&VGV6VB���F���6V�vW&"֗6�F6�FR��G&F:|:6��55"6V�&R'FRFR'6VТ��:|:6�"L:��6ƖV�B6��f�&�"&VfW,:��6�&V(	BVV�&VfW&R�V��2��f��V�F�l:�<;2�&��V�&g&6R�&F�6V�7W'6�"�66�F���FW�F���F�f�6&�ֆ�FFV��6��VТ7"���ǖ��F�Ɨ7F�F�F�F22g&6W2�"W�FV�6�&�V�F�"FRFV����vR�G7��6VwV�FƖ�F�L:�GV��F��W&��$f:v6��FV6W"�"�f�&�P��G�Ww&�FW$�VFƖ�R�&6W3׶�W&��&6W7�����FW&��F�g&6W2&W7\:&��R&7&�F�#��$V�6��G&RVV�f��"�%fV�F�VRf�<:�6&Rf�W"�"�%\:v6�"�VF�F�"�%V&ƗVR6WW0�6W'f�:v�2�"�$6��&R&��F��6V�V�&��:|:6��"�%G&�6f�&�RF�V�F�V�&V�F�"�&��V�&Ɩ���$V�6��G&R�6��&R�"�6��F��Vf����6�"W6F<;2��7W'6�"�66�F��&r҂��6���"�66V�B�FW�B����V�V�F��V���f�ࠢ222fƖF:|:6��w&W�"�W���2'V�f�2�FW&F�3��V�V��6�',:��6�����W6Ɩ�B�vR�G7�6����V�G2�G�Ww&�FW$�VFƖ�R�G7��6V�W'&�2�6�'&�v�F�V�W'&�&V��FR&V7Bֆ���2�6WB�7FFR֖��VffV7F�G&�6"W6U7FFV�W6TVffV7F��V�� �W6U7��4W�FW&��7F�&V&�W"&VfW'2�&VGV6VB���F��������'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR�6V�&V�:|:6�6��W7F�VF�:v�����'V�FWf�fWF6�F���S��EE#�6��f�&�F����D��VR�L:�GV��W7L:F�6��$V�6��G&R�6��&R�"�R�f��&6�7"���ǖ6��2g&6W26���WF2W7L:6�&W6V�FW2ࠢ22##b���#(	B5DFR7&VF�"��W7F���&VfW,:��6��6&B6��F�f�6�"���222�&�WF�f���W7\:&����F�RV�&��BFRV�6��6�'&V�FR�f��FU���6���&VfW,:��6�FRW7F���&�FW�F�FR6��F�6&B'&�6��L:�GV��w&�FRRF�&WF�6��W�6��:|:6��%G&�6f�&�R6WRF�V�F�VТ&V�FW�G&���R"��,:w&f�FR����Ɩ�F�f�<;7&�R&�L:6�fW&FR&���(	BVF�R��W6��W7F���&���,:�ࠢ222�VF�:v0����vR�G7�(	B6\:|:6�FR5D&7&�F�&W2����R�&VW7G'WGW&F&6VwV�"W76&VfW,:��6����gV�F��VF�RFR&r҂��6���"�66V�B�6�gB��6&B6���&�F��FW�F�R&�L:6��F��F�&�&r҂��6���"�7W&f6R�6��&�&FW"҂��6���"�&�&FW"��6&B'&�6��6�����W�V�����L:�GV��F�&WF�6��W�6��:|:6�%G&�6f�&�R6WRF�V�F�V�&V�FW�G&���R"��6�'�&VW67&�F����W6��F���FV��F&V��W&|:��6���$����,:��W76�2W7L:6�&�7W&�F�W�F�V�FR�VRf�<:�6&Rf�W"�V&ƗVR6WW26W'f�:v�2���7G&R6WRG&&Ɔ�&VVТ&V6�6R6��V6RfV6�"VF�F�2�6��V6Rv�&RfV�6WW2v��27&W66W&V�"�����WB�VF�RFRGV26��V�2�FW�F���F�F�&�L:6�&V��ƆF�6��V�Ɩ�F�f�<;7&���&�&FW"�B&�&FW"҂��6���"�&�&FW"��V�G&R�FW�F�R�&�L:6���wV��&��BFR&VfW,:��6���&�L:6�6��F��V%VW&��fW&V6W"�WW26W'f�:v�2"���F�F�F�VF�:v�FW&��"�ࠢ222fƖF:|:6��w&W�"�W�V��vR�G7���V�V��6�',:��6�����W6Ɩ�B�vR�G7��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR�6V�&V�:|:6�6��W7F�VF�:v�ࠢ22##b���#(	B6����2f�'FR6��f�F�F�&�fW&V6W"6W'f�:v�0��222�&�WF�f��VF�F�F�W7\:&��V�FW�F�f�'FR�W'7V6�f��6���F�2W76�2&�fW&V6W"6WW26W'f�:v�0���Ff�&���2G,:�2��F�2��FR���,:�6��f�F�w\:��f�&"7&�F�"F���6��g&6�P�W&�V�FR��f�&�F�f�%f�<:���F�:6�:�V�7&�F�"�W7F�Ff�&��"��6V�V��ࠢ222�VF�:v0����vR�G7�(	B6\:|:6�FR5D&7&�F�&W2����S���6V��%&VV�f�6��FV6W""(i"%&RFRFV��"6WRF�V�F�&F�"��L:�GV��%6WR,;7����6ƖV�FR�FR6��\:v"V��"(i"$�w\:��W7L:&�7W&�F�W�F�V�FR�VP�f�<:�6&Rf�W"� ��6�'�&Vf�,:vWF���֖�&\:v�,;7&���6V�FWV�FW"FR��F�6:|:6�V�fW�FR<;2Ɨ7F �gV�6���ƖFFW2��&�L:6�$6��\:v"�fW&V6W""(i"%VW&��fW&V6W"�WW26W'f�:v�2"�:|:6�V�&��V�&W76����6����V�G2�&V6��T7&VF�%&��B�G7��FV�W��&�F��,;7&��W&f��FRVV���F�:6�:��7&�F�"����L:�GV��%f�<:���F�:6�:�V�7&�F�"�W7F�Ff�&��"(i"%6WRF�V�F�W7L:&F��f��0��VF"�76�� ��6�'�&VW67&�F�6����W6��v�6����w\:��&�7W&�F��VRW76�6&Rf�W"�&\:v�,;7&����&�L:6�%F�&�"�6R7&�F�""(i"%VW&��fW&V6W"�WW26W'f�:v�2"��6����V�G2�&V6��T7&VF�$&��W"�G7��f��6��7F��F��F�fVVB��%F�&�R�6R7&VF�"�6��V6RfGW&"���R�"(i"%6WRF�V�F�f�RF��V�&��6��V6RfV�FW"���R�"(	B�W6�W7G'WGW&�f�7V��6����2F�&WF���V�V�6�"��f�<;2FW�F���26����V�FW2�:W6f��2F��V�2F�FW6�v�7�7FV�ࠢ222fƖF:|:6��w&W�"�W���2'V�f�2�FW&F�3��V�V��6�',:��6�����W6Ɩ�F��2G,:�2'V�f�3�6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR�6V�&V�:|:6�6��W7F�VF�:v�ࠢ22##b���#(	B&V��fR;��F��6�"VV�FR���6���"ֆ�v�Ɩv�F���222�&�WF�f���W7\:&����F�RVR��W6��FW��2FRF�F"֖Ʒ����F�2���F&W7FfV�6�"VV�FR��6�FS��FW'&6�F���6���"ֆ�v�Ɩv�F�63#C�V�6fc�SF��W6F�V�&\:v�2&���6����2���&FvR$�dU%D"RV�'FW2FV6�&F�f2F���R�w&F�V�FRF��W&��&FvR$W66�Ɔ6���6��\:v""�&'&��2FR6FVv�&����W&wV�FV�6���G&F"�76�W66�Ɔf��7V'7F�GV�"�FW'&6�F�"V�F��F�,;7&��fW&FP���F�2V�F�F��6�FR���FV�F���6���"ֆ�v�Ɩv�F6���V�F����F�7F��F�F���6���"�66V�F�&&�fW'F"�'&\:v�&���6����"6��F��V"6RFW7F6�F�FRV�5D6��VҒ��<;2VRFV�G&�Ff�:�ƖfW&FR�6V��V�V�6�"VV�FR6�'&�F�ࠢ222�VF�:v0����v��&�2�776 ��FV�6�&���6���"ֆ�v�Ɩv�F63#C�V(i"33VcC��fW&FR�W6�W&�FW67W&��F��F�fW&V�FP�F���6���"�66V�F3S�3sC�����6���"ֆ�v�Ɩv�Bֆ�fW&(i"3SCs3f���6���"ֆ�v�Ɩv�B�6�gF �(i"6ScFS��F��F6�&6���WfRf�:�2�V�F��&F�7F��wV�"f�7V��V�FRF���6���"�66V�B�6�gF���FV�W67W&���6���"ֆ�v�Ɩv�F6fc�SF(i"3CvC3f�fW&FR��V�F�f�f��F�7F��F�F���6���"�66V�F33V3������6���"ֆ�v�Ɩv�Bֆ�fW&(i"3sF&C&���6���"ֆ�v�Ɩv�B�6�gF(i �3�C36f���6���"���ֆ�v�Ɩv�F(i"33##F�FW�F�W67W&�6�'&R���f���v�Ɩv�B6�&����V�V�6����V�FR&V6�6�R�VF#��vR�G7��6����V�G2�&�6UFr�G7�P�6����V�G2�&�GV7D6&B�G7��:W6f�<;2�2F��V�2�&r҂��6���"ֆ�v�Ɩv�B�6�gB���FW�B҂��6���"ֆ�v�Ɩv�B���V�L:6�G&�6FRf��"6R&�v�R6������4�TDR��F�FW67&�:|:6�F�F��V��F&V�GVƗ�FFR'FW'&6�F"&'fW&FR�W6�W&�F�W67W&��F��F�7F��F�F�66V�B�"��F�72���U�$TDU4�t���F���F6�'&R���v�Ɩv�BFW'&6�FGVƗ�F&&Vv�7G&"G&�6ࠢ222fƖF:|:6��w&W�"�W�f�&FR�v��&�2�776��V�V��6�',:��6�����W6Ɩ�B��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR��"f�FFR5U$4U�4U%d�4U�$��U��U���6����:6�&V�6���F�����'V�FWf���7\:|:6�F�552vW&F�6��f�&�F�VR��6���"ֆ�v�Ɩv�F��6�gF6V�6���0���f�2f��&W2��2F��2FV�2�6�&�33VcC��6ScFS��W67W&�3CvC3f�3�C36f���6��G&7FR�t4r�&V6�7V�F���6���"ֆ�v�Ɩv�F6�'&R��6���"�&v���6���"�7W&f6V�6�&�(��r�#����6���"���ֆ�v�Ɩv�F6�'&R��6���"ֆ�v�Ɩv�F�W67W&�(����(	B6��F��:����FP�B�S�ࠢ22##b���#(	B�WF֖Ʒ����F�2R��f�F��V���6���"�66V�B�FW�F ��222�&�WF�f���W7\:&��V�f��RV�7vF6�FR�&66��GV26�&W2W�F2(	B��֖Ʒ����4dddDc�R����F�2����3S�3sC��(	BVF��F�&Ɩ<:��26�����f�WFf�fF���,:���֖Ʒ�:�&F�6�V�FR���6���"�&vGV��7&V�R6�&��V�L:6�f�&�R���f�f��"W�F�FW76P�F��V����F�2:�&V���26�&��6GW&F�VR�fW&FR�<:�f��FW&��"R�:6�FW&�6��G&7FP�7Vf�6�V�FR��"���6RW6F�F�,:��6���6�"FRFW�F�6�'&RgV�F�6�&�(	B&���F��:����FP�B�S�F�t4r��VRVV'&&��V�GW&FR&\:v�2�Ɩ�2�&FvW2WF2��W&wV�FV��W7\:&��6���&W6��fW"W76R6��fƗF�&W7�7FW66�Ɔ�Ff��$��F�2<;2VТgV�F�2�6��V�f&��FRW67W&&�FW�F�"��W6��F�����2W67W&�<;2&v&�F�"�V�GW&�ࠢ222�VF�:v0����v��&�2�776�FV�6�&����6���"�&v�6fffFc�֖Ʒ��f��"W�F�F�7vF6������6���"�66V�F�3S�3sC����F�2�f��"W�F�F�7vF6��(	BW6F�<;26�����&VV�6���V�F򢠢�&rҦ��&�L;VW2�5D�W7FF�F�f��V�V�V�F�2FV6�&F�f�2����6���"�66V�Bֆ�fW&�3C&C3&���F�2W67W&V6�F���W6��F�������6���"�66V�B�6�gF�6SFcFS�F��F6�&FR��F�2�����6���"����66V�F�3�3CF�fW&FR&V�W67W&��FW�F�6�'&R�gV�F���F�2(	B'&�6��:6�F��6��G&7FR7Vf�6�V�FS��"�#���W67W&�L:�b�3��������f�F��V���6���"�66V�B�FW�F�3#Sf##��(	B�W6��F��F���F�2�W67W&V6�F�7Vf�6�V�FR&gV�6���"6���FW�BҦ�&�&FW"Ҧ�&��rҦ��WFƖ�RҦ�66V�BҦ6�'&P���6���"�&v���6���"�7W&f6V�6��G&7FR(�RS���2&W2FW7FF�2����v��&�2�776�FV�W67W&�F�6���F���6���"�66V�B�FW�F��F�F�&��W6��f��"FP���6���"�66V�F�33V3���(	B��W67W&��gV�F��::�W67W&��V�L:6��fW&FRf�f�gV�6���&VТ6���FW�F�F�,:���6��G&7FR(����3����:6�&V6�6FRV�6VwV�Ff&��FR����6V�V7F���V��v��&�2�776�6�"F�FW�F�6V�V6���F�G&�6FFR��6���"�66V�F&���6���"�66V�B�FW�F�V���W6����F�f�FR6��G&7FR����C�'V�f�2��V��R6����V�G2��F�F�6�',:��6�FRFW�B��&�&FW"���f�7W3�&�&FW"����fW#�&�&FW"����fW#�FW�B��w&�Wֆ�fW#�FW�B��f�7W2�v�F���&�&FW"���f�7W2�v�F����WFƖ�R�Rf�7W2�f�6�&�S�&��r���F�F�&���6���"�66V�B�76�R���F"&���6���"�66V�B�FW�B���6�',:��6�2FR&r����6�V��F���fW#�&r�Rf��S�&r���6��F��V�V����6���"�66V�B���:VR&W&W6V�F�&VV�6���V�F��9��6��W7FR��V�FW��0�F�&W�6RV��76�66V�B҂��6���"�66V�B��F�f�F�6�V6�&��VТ6����V�G2�&W7V�U6V7F����G7�f��F�R&���F�2f�f��:�V�&VV�6���V�F���:6�FW�F���4�TDR��F�F&V�FRF��V�2RF�F�2�2G,;VW2FR6����V�FR�&FvW2�6��2��b��&��R��GVƗ�F�2&W6"��6���"�66V�B�FW�FV�6��FW�F�2FRFW�F��&�&F���f6\:|:6�W�Ɩ6�F�F�7F��:|:6�V�G&R��6���"�66V�F�gV�F�R��6���"�66V�B�FW�F�FW�F�R�"VRV��W��7FRࠢ222fƖF:|:6��w&W�"�W�f�&FR�v��&�2�776��2'V�f�2�FW&F�3��V�V��6�',:��6�(	B<;2�'V�f�FRF��V�2FV�f��"ƗFW&�����W6Ɩ�B��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR��"f�FFR5U$4U�4U%d�4U�$��U��U����&�V�FR��6���:6�&V�6���FW7F�VF�:v�����'V�FWf�fWF6�F���S��EE#�6��fW&�F���552vW&F�VR��6���"�66V�B�FW�FP���6���"�66V�F6V�6���2f��&W26�'&WF�2��2F��2FV�2�6�&�3#Sf##�3S�3sC���W67W&�33V3����2F��2���6��G&7FR�t4r�&V6�7V�F�&�2&W2��f�3���6���"�66V�B�FW�F6�'&R��6���"�&v �(��R���6�'&R��6���"�7W&f6V(��R���6�'&R��6���"�66V�B�6�gF(��R�s�����6���"����66V�F6�'&R��6���"�66V�F(��b�3��6�&�R(��rÓ��W67W&�(	BF�F�26��F��:����FRB�S��FW�F��3��&�&F2R��F�6F�&W2FRf�6�ࠢ22##b���#(	B�WF��2f�f�F��V�2FR6�"���222�&�WF�f��VF�F�F�W7\:&���FV��",;7&��WFFR6�&W2��2f�f���26GW&F���:6�<;2����WBF���R(	B�VF�F��2f��&W2F�2F��V�2V��v��&�2�776��VR&�v�WF��F�6�V�FR&F�FƖ6:|:6��Ɩv�BRF&���6����FW6�v�7�7FV�&Wl:�ࠢ222�VF�:v0����v��&�2�776��&��FR�&��E�FF�F�V�S�&F&�%������6���"�66V�F���6���"�66V�Bֆ�fW&���6���"�66V�B�6�gF�fW&FR�<:�f���26GW&F��FR3CSf3S�&3Cf#C���6�&�FR3vfS�f&33V3����W67W&����FV�F���FV�F�FFR&fV6�F"F�&6�26��&V���2f�f6�FFR����6���"ֆ�v�Ɩv�F���6���"ֆ�v�Ɩv�Bֆ�fW&���6���"ֆ�v�Ɩv�B�6�gF�FW'&6�F��0�f�'&�FR�FR3��S33F&63#C�V��6�&�FR6C3�ff&6fc�SF��W67W&�����6���"�fW&�f�VF��V���26GW&F��3Fcs��(i"3csF3F��6�&�3�6�C(i �3Ff�S���W67W&�����6���"�7V66W76���6���"�v&��v���6���"�F�vW&��W6��;6v�6FR6GW&:|:6�Ɩ6F��2W7FF�26V�:&�F�6�2���FV�F���6���"�7V66W76f�7V��V�FRF�7F��F�F�66V�B����6���"����66V�F��W67W&��W7FF�FR3#�&3s#6&&W6W'f"6��G&7FP�6�����f�fW&FR��26�&��6GW&F����V�V�6����V�FRf��F�6F�6���F�F�2�:W6��2F��V�2�&r҂��6���"�66V�B�WF2����VF�:vFR�WF6R&�v�R6����&F�FT�ࠢ222fƖF:|:6��w&WV��2�W��F�v�2V��G7���G6��776�f�&FR��W�F���FU���GV�W6���V�V���6�',:��6�(	B6��f�&�VRGVF�&VfW&V�6��2F��V�2��:6�f��&W2f���2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR��"f�FFR5U$4U�4U%d�4U�$��U��U����&�V�FR��6���:6�&V�6���FW7F�VF�:v���6��G&7FR&V6�7V�F��t4r�&�2&W2��2W6F�3���6���"����66V�F6�'&P���6���"�66V�F(��R�3���6�&�R(��rÓ���W67W&���6���"�66V�F6�'&P���6���"�66V�B�6�gF(��R�C���6�&���6���"���ֆ�v�Ɩv�F6�'&R��6���"ֆ�v�Ɩv�F �(��BÓ���6�&�(	BF�F�2FV�G&�F��:����FRB�S�&FW�F���&��V�6����V�FW2�6�fP��5D2�&FvW2�ࠢ22##b���#(	B��26�"f�f�:v����6����222�&�WF�f��FV��":v����6����2f�ff�7V��V�FR�6V�6�"F�WF�&f���<:�f��VТ��G&�GW��"6�"f�&F�2F��V�2W��7FV�FW2ࠢ222�VF�:v0����vR�G7� ���W&�w&F�V�FR&F��76�R6��&��"��6���"ֆ�v�Ɩv�B�6�gF�6�F�7WW&��"F�&V�F�6����6���"�66V�B�6�gF�6�F���fW&��"W7VW&F��V�fW�FRV�;��6�F���WWG&���f��FRFW7FVW2�%&\:v�f�<:�fV�"�$6��fW'6�FW2FRfV6�""�$6��&V�V�<;0��Vv""��G&�6�RF�f�<;7&�2f��2V�gV�F��WWG&��"G,:�2:��V�26���&�F0����6���"�66V�B�6�gF���6���"�66V�FR��6���"ֆ�v�Ɩv�B�6�gF���6���"ֆ�v�Ɩv�F ��FW&�F�2��F�F���2W6�f�7V�:6\:|:6���6FVv�&�3�6F6&Bv��RV�&'&��6���&�F6��F�L:�GV����FW&��F���6���"�66V�FR��6���"ֆ�v�Ɩv�F�"�FV���$6���gV�6���#��2�;��W&�2FR76���"�2�76&�FRFW�F�6���W2&V�<:�&7V��&VV�6��F�6����6���"�66V�B�6�gF���6���"�66V�F���V�V�F��V���f�f���V6W7<:&��F�F226�&W2W6F2�:W��7F��V��v��&�2�776ࠢ222fƖF:|:6��w&W�"�W�R�"6�76W2FR�WFf��F�F��v��BV��vR�G7���V�V��6�',:��6�����W6Ɩ�B�vR�G7��6V�W'&�2����'V�'V��F�6����:|:6�R6�V6vV�FRG�U67&�B6��6�\:�F26��7V6W76��fƆFP�,:��&V�FW&��:|:6�FR�F֖�:�,:��W��7FV�FR��"f�FFR5U$4U�4U%d�4U�$��U��U����&�V�FR��6��R�:6�&V�6���FW7F�VF�:v�ࠢ22##b���#(	B���R6��&W6V�:v6��W&6����222�&�WF�f��F"::v����6��,:��6�6�&FR�&�WG�6R���FV�F��WF6��f�'L:fV�R��FV�F�FFR�V��F���,:���W��&�"�fW'F2&V�2�FW2FR6FVv�&�2R6��F\;�F�W�Ɩ6F�f�ࠢ222�VF�:v0����vR�G7� ���W&��&�V�FF�'W66�6��&:|:6�R6��G&F:|:6��6��5D&W���&"R&fV�FW"��&��6��FW&�F�fW&V�6�6W'f�:v�2�&�GWF�2F�v�F�2R��wVR6�֖v���f�G&��R&V���f�F&6���6FVv�&�2�6���gV�6���R6��V�FFRl:��FW��2��f�G&��RR6��V�FFR6W&F2V�7W7V�6R,;7&��2R6��'F�Ɔ�V��V�GW&�V����F���6W'f�F�"�Wf�F�F�6��7V�F2GWƖ6F2R�f67&�BF�6�������fVvF�"��FƆ�2v�&�f�&�F�FR:|:6�R6�V�WF��2W7V<:�f�6�2&6FG&V6�����v��&�2�776R4�TDR��F ��F�6���F�2F��V�2FW'&6�FFR��v�Ɩv�B&�fW'F2RV�W&v�6��W&6���6V�7V'7F�GV� ��fW&FR�<:�f�F�25D2&��6��2��6����V�G2�&�GV7D6&B�G7�R6����V�G2�&�6UFr�G7� ���fW'F2R&\:v�2&���6����2W6����f���v�Ɩv�BVV�FR��F�72���U�$TDU4�t���FGVƗ�F�6����f��W&'V�RFV6�<:6�FR6�"ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BR'V��BFR&�G\:|:6���6�V6vV�FR6�&W2f��2�F�fbR&WWF�Ɨ�:|:6�F6��7V�F��6W'f�F�"��6��G&7FRF�FW'&6�F6�'&RgV�F�7VfS�B�Sc��FW�F�'&�6�6�'&RFW'&6�F�R�ss���6���RFW7BF���RV�6W'f�F�"FR&�G\:|:6��6��f�&��F�&W7�7F�D��R5D2&��6��2ࠢ22##b���#(	B�WF�&f���<:�f���222�&�WF�f��7V'7F�GV�"�fW&FRf�f��"V��FV�F�FFR��26���֖|:fV�R6��f�'L:fV�&�V�GW&��v&�F�"6��G&7FRFWVF���2FW�F�2�&�L;VW2RW7FF�26V�:&�F�6�2F�FV�6�&���&W&"�FV�W67W&�&W6"FW�F�,;7&��6�'&R�66V�B�6V�&W7V֗"'&�6�ࠢ222�VF�:v0����v��&�2�776 ��gV�F��&f���7WW&l:�6�W2�WWG&2�FW�F�2w&f�FRW7fW&FVF�2RfW&FR�<:�f�fV6�F���W7FF�2FR7V6W76��FV�:|:6��W'&�RfW&�f�6:|:6�f�6&��V��26GW&F�2��7&�F��F��V���6���"����66V�F�'&�6���FV�6�&�RW67W&�&�gV�F���FV�W67W&���6����V�FW2R:v��26��5DfW&FR76&�FRFW�B�v��FV&�FW�B҂��6���"����66V�B��&W6W'f�F��Vv�&�ƖFFR��2F��2FV�2��4�TDR��FRF�72���U�$TDU4�t���FGVƗ�F�2&F�&�"�&f���<:�f�&VfW,:��6��F�&��WF�R��VF�"VR�WF�FW&��"f��FRV��FW&:|;VW2gWGW&2ࠢ2226��G&7FR�VF�F��FW�F�&��6��6�'&R�gV�F�"�C3���FW�F�6V7V�L:&��6�'&R�gV�F�R�s3���FW�F�7WF��6�'&R�gV�F��&f�ӢB�c��6�'&R7WW&l:�6�R'&�6�R�3���FW�F�F�5D6�'&R�fW&FR�<:�f��RÓ3���fW&FR�<:�f�6�'&R�gV�F�7VfRFR66V�C�BÓ#�ࠢ222fƖF:|:6��U4Ɩ�B�G�U67&�BR'V��BFR&�G\:|:6���6�V6vV�F�2F��V�2RF�25D2VRW6�gV�F�FR66V�B��6��fW,:��6�6��G&6�&W2f��2f�&F�'V�f�6V�G&�FRF��V�2ࠢ22##b���#(	B���R�&�V�FF:FW66�&W'FR6��G&F:|:6�222�&�WF�f��FF"&��<:���2;�FV�2FRf��FU���v�&��R6����::v����6����&W6W'f�F��fVVB�2gV�:|;VW2W��7FV�FW2R�WF֖Ʒ����F�2ࠢ222�VF�:v0����vR�G7��'W666��,;7GV��6W7<:�fV��7VvW7L;VW2�FƆ�2�"�&�WF�f����fVv:|:6��":&�6�&2�6FVv�&�26��7F2�f�G&��R6��F�6�����&�f�76����0�&V�2�fVVBW��<:�fV��6���gV�6����6��F&7&�F�&W2Rd�F�f���&V��f�FFWV�L:��6�FRW&f�2��6�F���R�WF�&W2FR&�GWF�2R6W'f�:v�0�<:6�&W6��f�F�2V�V�6��7V�FV���FR�6V�&涖�r'F�f�6������F�F�2�5"FRc2R6����V�FW2W��7FV�FW3�6L:��v��6��F�6��7W7V�6R��6�V�WF��RG&F�V�F�FRfƆ2&6��2�6��7V�F2Ɩ֗FF2R&�V�2��F�72���U�$TDU4�t���F�&VfW,:��6�2�FV6�<;VW2�Ɩ֗FW2�&�FV�&�FRfƖF:|:6�R�76�&�ƖFFW2gWGW&2��V�V�֖w&F����R�FW&:|:6�FRv�V�F�2ࠢ222fƖF:|:6��Ɩ�B�G�U67&�BR'V��B6���WF�&�fF�26��f&�:fV�2f�7L:�6�2FRFW7FR���V�GW&;�&Ɩ6&V�FR&�GWF�2�6W'f�:v�2RW&f�2&�fF���D��vW&F�fW&�f�6F����6�V��F��W7FF�FR��F�7��&�ƖFFR��6VwV�F�'V��B6��6�fRV&Ɩ<:fV�&V�&�fF��D��F���R6��L:��6W'f�:v�0�RfVVB&V�2�6V�f�6�FRfƆ�6W'f�6R&��Rf�7L:�6�V�2&6F�6f�W �6��f�wW&:|:6�FR'V��B&VW��7FV�FS��V�V�W67&�F�RFW7FRF֖�7G&F�f���&Wf�<:6�FR6�&W2RF�fc��V�V���fFWV�L:��6�F�&��WF���fƖF:|:6�f�7V�RFR6ƗVW2V�FV�FS��fVvF�"��F�7��:�fV��"fƆ2FP���7F�:|:6��6W'F�f�6F��F��V�WB���:6�f�&��VF�F�26�&RvV"f�F�2ࠢ22##b���#(	B�WFFVf��F�f�֖Ʒ����F�0��222�&�WF�f��FW��2FR2�WF2FW7FF2�W7F6W7<:6���W7\:&��W66�ƆWR��֖Ʒ����F�2����:F���6�F�FW7FF�FW2�fW"V�G&F%FW7FRFR�WF�֖Ʒ����F�2"�6����WFFVf��F�fF���,:��F�fW&V�FRF2V�G&F2�FW&��&W2FW7F6W\:��6��F�F2�&6F26���'FW7FR��7V'7F�G\:�fV�V�VW"���V�F�"��W7FfV6��FV�F�FFRf�7V�(	B�"�76�F�,:��GVƗ�V���4�TDR��F�VR��FFW67&Wf��6�7FV��F�v���&��6����:�f��ࠢ222�VF�:v0����v��&�2�776�FV�6�&�RW67W&�f��F�W�F�V�FR�2f��&W2F�WF֖Ʒ����F�0��gV�F�7&V�R6fffFc�66V�BfW&FR3S�3sC��(	B�W6��2�W��:fƖFF�2�V�G&F�FW&��"��&VƖ6F�2�"6��F;��F���WFFRFW7FR�&&�W�v��FR�֖�F��V���r���4�TDR��F���G&�6F�&�&�6���6�"FR�&6"�&gV�F�6����:�f�g&��"V�FW67&�:|:6�&V��fW&FP���F�2�7&V�R֖Ʒ����W�V���FR�W�&7'R"F&Vw&FR�W&�GVƗ�F�FR6cS�#f��&��F�v�&3S�3sC� ��fW&FRGV����F6�'&R��6���"�7V66W76&VW67&�F��W7F�f�6F�f�F�v�'fW&FRFW7F�F�WF��&��6��"��:6�f����26V�F�F�6���66V�B6V�F�fW&FR�&Vw&V�6�6��F��V�f�V�F��&FvR�6�F�f�W6&r҂��6���"�66V�B�6�gB�FW�B҂��6���"�66V�B���V�6���6���"�7V66W76�(	B<;2&�:6��VF�S���6���"�7V66W76:�V�fW&FR��F�fW&V�FR��F�66V�B��R�2F��2�F��F�6��gV�F�&��GV26V�:&�F�62F�7F��F2�&�fF�g2��V�6vV�FP�7V6W76���&FvRFRfW&�f�6F�'6W&F�F���6���"�66V�F�&�"(i"'6W&F�F���6���"�66V�F �fW&FR"ࠢ222��F�VR6��F��VV�&W'F���:6�&W6��f�F��W7FV�G&F������6���"�7V66W76�3c�CSV�R��6���"�66V�F�3S�3sC��6��F��V�6V�F�F��2fW&FW0�&V6�F�2��W6��6��&Vw&F�4�TDR��B֖�֗��F��W6�FR��6���"�7V66W76V�&FvW2�6P��wV�F�W76W2F��2F��2&V6�6&V�&V6W"�V�F�2��W6�FV��f�R&Wf�6�F"6RV�F�0�F��2FWfW&��VF"FR�F��(	B�:6�f���76�v�&�'VR�W7\:&��<;2VF�R&f��"�WF���:6�&&W6��fW"W76R��F�ࠢ222fƖF:|:6��G62����V֗F�6V�W'&�2��w&W�"&�&�"�&6����:�f�"��4�TDR��F��V�V��6�',:��6�&W7F�FRࠢ22##b���#(	BFW7FRFR�WF�&&�W�v��FR�֖�F��V���p��222�&�WF�f��L:�6���FW&6V�&�FW7FRFR�WF6VwV�F�&&�W�v��FR4ddcD46R֖�F��V���r4dd$S�7V'7F�GV��WF6�GF���V�V7G&�2&�VR������W72�v�BFV�G&F�FW&��"ࠢ222�V�V�F�&�2F��V�0�����&&�W�v��FR��(i"��6���"�&v��FV�6�&�&V&�fV�FF�6�����6���"�FW�F��W67W&�����֖�F��V���r��(i"��6���"�66V�F���6���"�66V�Bֆ�fW&��W6���W���2F��2FV�2�:�6�&��&7F�FR&gV�6���"6���FW�F��:�6��R6�'&RgV�F�W67W&�����6���"�FW�F��6�&�f��&V��'&��&V�W67W&��3&##�V�fW�F��WWG&���W6��f�:�ƖF��&V�����6���"�7W&f6R�&���6���"�&�&FW&���6���"�66V�B�6�gFFW&�fF�2VТF��2FR:&�&"���{h��춻�q�^u���((����Q�х��]��є����H��������ȵ�������ѕ������ɼ�ɕ��ɽٕ�х���������������ȵѕ�р����ѕ��(���͍�ɼ����͵������Ք����͕��ɔ聍�ȁ���Ʉ�٥Ʉ�ѕ�Ѽ��Յ�������չ����͍�ɕ����(����ɽ��́A���������H��������ȵ�����р��������ȵ�����е��ٕɀ��P����̈́�ٕ聼���͵�������չ�����(����́���́ѕ��͕́���ɕ��ͅȁ���ɕ�ȁ�ɼ��͍�ɼ������ɕ�є���́�Յ́���Ʌ��́��ѕɥ�ɕ́���(��I�兰�	�Ք��ɽ��́A��������������ɼ������х�є��Ʉ�͕�٥ȁ���ѕ�Ѽ���������ɕѼ�ͽ�ɔ�մ(���չ����͍�ɼ�(����������䨨��H��������ȵѕ�р����ѕ������ɼ��������ԁ���������ѕ�Ѽ��ɥ������������Ք���մ(��ɽἁ�����͍�ɼ�����������ȵ�����������ȵ��ə��������ѕ����͍�ɼ�(���������ȵ��ə����ɀ��������ȵ��ɑ�ɀ��������ȵ�����еͽ�р���ɥم��́�����͵���������(����م����ɽἰ���́���́ѕ��̸(���������ȵ�Ս���̀��������ȵ݅ɹ������������ȵ�����ɀ��������ȵٕɥ�����������Ց�Ʌ��((����5Ց�����((�������������̹��̀�ѕ������ɼ����͍�ɼ���Յ��酑�́����������ф�������((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ��((������ش���ă�P�Q��є��������ф�I�兰�	�Ք���1���Ёɕ��((����=���ѥټ((��M��Ѽ�ѕ�є��������ф�͕�ե���I�兰�	�Ք������	����1���Ёɕ�����������P��́�Յ́��ɕ�(�����ф�ٕ耡�ɥ�Ё������Ё�����ͥ��������ɕ��������������ɽ��Ѽ���MՉ�ѥ�դ�������ф�I�兰(��	�Ք�1���Ёɕ�M��	�Ք�������Ʌ�����ѕɥ�Ȁ���͵��������I�兰�	�Ք������������Ʌ���є(������ɕ�є��P������	�����ٕ聑������������((����5�������Ѽ��ɽ́ѽ����((����1���Ёɕ������H��������ȵ�������ѕ������ɼ�(����I�兰�	�Ք����H��������ȵ�����р��������ȵ�����е��ٕɀ����ѕ������ɼ쁀������ȵ�����еͽ�р(�������ԁմ���հ��������ɼ���ɥم���������������饄����є�����ɥ�а���͕́�Ք�����͵���ɥ������(���������Ʌ�є���́���Ʌ��́��ѕɥ�ɕ�聅����Ё�͍�ɼ��ɕ��̈́����մ�ѽ�����ɼ��Ʉ��չ�����ȁ����(���չ�������������(��Q�����͍�ɼ聵�͵��ͽ������������Ʌ�����ѕɥ�ȃ�P�I�兰�	�Ք����͍�ɼ������́�Ʉ�٥Ʌȁѕ�Ѽ(����ɕѼ�ͽ�ɔ��չ�������͍�ɼ���������������Ё����͍�ɼ��̈́�յ��ٕ��������́���Ʉ������͵����հ�(���������ȵѕ�р�����͍�ɼ�ɕ�̈́���1���Ёɕ���(���������ȵ�Ս���̀��������ȵ݅ɹ������������ȵ�����ɀ��������ȵٕɥ�����������Ց�Ʌ��((����5Ց�����((�������������̹��̀�ѕ������ɼ����͍�ɼ���Յ��酑�́����������ф�������((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ��((������ش���ă�P�Q��є��������ф�I�兰�	�Ք���1���Ёɕ䀬�M��	�Ք((����=���ѥټ((��Eե�Ѽ�ѕ�є��������ф�͕�ե������͵�����ѕ�Ѽ��������ɑ������́���Ʌ��́��ѕɥ�ɕ̤�I�兰(��	�Ք�����������1���Ёɕ䁀�			���M��	�Ք������倃�P�͕������������(���������є�͕�չ��ɥ�������Ё���ф�ٕ谁���������́������ɥ�Ё���́�����́�����ȸ((����5�������Ѽ��ɽ́ѽ����((����1���Ёɕ䨨��H��������ȵ������Յ͔�����͵��م��ȁ������鄵��ٽ���ɥ���������)�������ѕ́��(��ѽ�����̈́�͕�����������ѕ�ѕ̤��P�ٽ�ф���͕ȁմ��չ�������ɼ����ɼ����������ɥ�����������(�����Ʌ��́��ѕɥ�ɕ̸(����I�兰�	�Ք����H��������ȵ�����р��������ȵ�����е��ٕɀ����ѕ������ɼ��P�Q̰��ɗ��̰���х��(���ѥټ�(����M��	�Ք����H��������ȵ�����еͽ�р����ѕ������ɼ���չ������������������ѥټ������ѕ�Ѽ�������(��I�兰�	�Ք���ȁ������P�����Ʌ�є��������հ��͍�ɼ�ͽ�ɔ���հ����ɼ��(���������ȵ��ə����ɀ��������ȵ��ɑ�ɀ���ɥم��́�յ�������������鄵��ձ������ٔ�����ɔ����չ����(�����Ʌ������́��ɑ̸(����Q�����͍�ɼ��Օ�Ʉ������������̀Ё���Ʌ��́��ѕɥ�ɕ̨�聹���̰��������ȵ�����р��Ʉ(������ѥ�����́���́ѕ��̸��դ���������P�I�兰�	�Ք����͍�ɼ������́�Ʉ��չ�����ȁ�������ȁ��(��ѕ�Ѽ���������ɕѼ�ͽ�ɔ�մ��չ�������͍�ɼ������ɥ�������ٕ�������������͍�ɼ(���������ȵ�����р�٥Ʉ�յ��ٕ��������́���Ʉ������͵����հ����ф�Րـ�����M��	�Ք����̈́���͕ȁ�(���������ȵ�����е��ٕɀ�����́���ɼ�����������ٕ聑��ͽ��쁀������ȵѕ�р����ѕ����͍�ɼ�ɕ�̈́��(��1���Ёɕ䀡��͵������Ք���́���Ʌ��́��ѕɥ�ɕ̰���ȁ���Ʉ�٥Ʌ����ѕ�Ѽ�����͍�ɼ��(���������ȵ�Ս���̀��������ȵ݅ɹ������������ȵ�����ɀ��������ȵٕɥ�����������Ց�Ʌ���P���є��Ք(���������ȵٕɥ���������͈�ɘـ������Ʉ�մ���հ�����Ʉ���ɕ������������������������ټ�������쁻��(������ѕ����ȁ�������ȁ���є��������ф��������((����5Ց�����((�������������̹��̀�ѕ������ɼ����͍�ɼ���Յ��酑�́����������ф�������((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ��((������ش���ă�P�Q��є��������ф�5���䀬�5��ѥ�((����=���ѥټ((��EՅ�Ѽ�ѕ�є��������ф�͕�ե������͵�����ѕ�Ѽ��������ɑ������������������ɥ����́���Ʌ���(����ѕɥ�ɕ̤�5���䁀�ŀ���ɕ������5��ѥ́������倀�ٕɑ��٥�Ʌ�є������ɕ�є���́�Յ�(����ѕɥ�ɕ̰���̈́���յ������ф������Ʉ����P�ٽ�ф���ͥє�����ɥȁ�����չ������ɼ���ȁ�������((����5�������Ѽ��ɽ́ѽ����((����5���䨨��H��������ȵ������չ����ɕ��������͔�����������ȵѕ�р����ѕ����͍�ɼ��ٕȁ����ἤ�(���������ȵ��ə��������ɑ̤�����ԁ�Ʌ������ɼ��մ�ѽ������������ɕ������͵���ɥ���������(��͕��ɇ������ɐ��չ�����́���Ʌ��́��ѕɥ�ɕ̸(����5��ѥ̨���H��������ȵ�����р��������ȵ�����е��ٕɀ��P�Q̰��ɗ��̰���х����ѥټ�(���������ȵѕ�р����ѕ������ɼ������Ʉ�մ�ٕɑ�������͍�ɼ���������倰��Յ͔��ɕѼ�������ٔ(����ѥ�ٕɑ������ٕ聑������ɼ���ѕɥ�Ȱ��Ʉ����ѕȁ�Ց�������͵���������������ȸ(���������ȵѕ�е��ѕ����������ȵѕ�е�Չѱ�����������ȵ��ə����ɀ��������ȵ��ɑ�ɀ��(���������ȵ�����еͽ�р�������ɥم��́�����͵�����������ٕɑ�����ɼ��ɕ����(��Q�����͍�ɼ聥�ٕ�є����͝������չ��������͍�ɼ�������ٔ���ѥ�ٕɑ���ѕ�Ѽ����ѽ��5���䤸(���������ȵ݅ɹ������������ȵ�����ɀ��������ȵٕɥ�����������Ց�Ʌ��((����A��Ѽ�����ѕ����((���������ȵ�Ս���̀����Ř��Հ���ͅ�����������ɵ��Օ̃�P���Ս����ɍ�х����������������ٕȁɕ�Ʉ(�����1U����ͽ�ɔ��ɕ��ɥȁ��Ʌ���������Ё�Ʉ���ͥѥټ�������ɼ�ѽ�������ٕɑ��������Ʉ����(����ɕ�������������ټ��������ȵ�����р��5��ѥ̤��M�����մ��՝�ȁ������������ͅȁ�́�Յ́��ɕ�(������������������������ȁ�����ͼ����ͼ����Ս��ͼ��ԃ���������������������;����Ց��(���������ȵ�Ս���̀�����Ք�������饄����є��������ф��������((����5Ց�����((�������������̹��̀�ѕ������ɼ����͍�ɼ���Յ��酑�́����������ф�������((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ��((������ش������P�Q��є��������ф�5������Ё	�Ք���9����A��������%���]��є((����=���ѥټ((��5��́մ��ɥ�Ё�������ф��Ʉ�ѕ�хȀ�͕�չ���ѕ�є�͕�ե������͵���ɽ���ͼ���������Ʌ�(��1U������ȁ���Յ�Ѽ��������Ʌ�����ѕɥ�Ȥ�5������Ё	�Ք���������9����A����������	ɀ�(��%���]��є��������MՉ�ѥ�դ�������ф��ɬ�A������]��ѕɥ��Mչ���܁���ѕ�є���ѕɥ�ȸ((����5�������Ѽ��ɽ́ѽ����((����5������Ё	�Ք����H��������ȵ�����������ȵ��ə�������չ�����Ʌ������ɑ̰���������ɐ�մ�ѽ�(�����́���ɼ��Ք����չ����Ʉ���ȁ͕��ɇ������P����ѥ�Մ���ɬ�����а��������ѕ�є���ѕɥ�ȸ(����9����A���������H��������ȵ�����р��������ȵ�����е��ٕɀ��P�Q̰��ɗ��̰���х����ѥټ����(���՝�ȁ������Ʌ���(����%���]��є����H��������ȵѕ�р��ѕ�Ѽ��ɥ����������ͅ������������Ѽ������(���������ȵѕ�е��ѕ����������ȵѕ�е�Չѱ�����������ȵ��ə����ɀ��������ȵ��ɑ�ɀ��(���������ȵ�����еͽ�р���Ʌ����ɥم��́�Ʉ����ѕȁ����͵����͍��������������Ʌ�є���́���Ʌ���(����ѕɥ�ɕ̀�ѕ�Ѽ����ɼ�ͽ�ɔ��չ����͍�ɼ���չ������ɼ�ͽ�ɔ����ɼ��(���������ȵ�Ս���̀��������ȵ݅ɹ������������ȵ�����ɀ��������ȵٕɥ�����������Ց�Ʌ��((����5Ց�����((�������������̹��̀�ѕ������ɼ����͍�ɼ���Յ��酑�̀����͍�ɼ���յ��ٕ��������������́�ɽ�չ��(�������͵�����Օ������͵���͝������́�Յ́���Ʌ��́��ѕɥ�ɕ̤�((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ��((������ش������P�Q��є��������ф��ɬ�A��������]��ѕɥ����Mչ����((����=���ѥټ((��U���ɥ�������ԁ�ɥ�Ё���յ������ф����́��ɕ̀��������є�͕�չ��ɥ�������Ф��Ʉ�ѕ�хȁ��(��ͥє��ɬ�A����������������������є���]��ѕɥ����	��ـ��͕�չ��ɥ����Mչ���܁����ـ(��������Ф��MՉ�ѥ�դ�������ф���Ʌ������հ������������Ʌ�����ѕɥ�ȃ�P��ɽ����������ф������յ�(���������((����5�������Ѽ��ɽ́ѽ����((�����ɬ�A���������H��������ȵ�����������ȵ��ə�������չ�����Ʌ������ɑ̰��մ�ѽ����ٕ���є�����(�����ɼ��Ք����չ����Ʉ���ȁ͕��ɇ������P���ͥє����̈́�����ɥȁ�����չ����͍�ɼ���ȁ����������ٕ�(��������ɼ�����������������ф��������ɥ���Ʉ���є�ѕ�є쁁����ȵ͍����聽��䁱���р���ɵ�����(���������хل���������ф�������ѥ�����́�����Ё���ݥ����́��ѥٽ́�����ٕ����Ȥ�(����Mչ���ܨ���H��������ȵ�����р��������ȵ�����е��ٕɀ��P�Q̰��ɗ��̰���х����ѥټ������՝��(�������Ʌ����(����]��ѕɥ�����H����ٕ聑��٥Ʌȁ�չ���������������������ȵ��ə����ɀ���٥ɽԁ����ȁ�����ѕ�Ѽ(��͕�չ��ɥ������������ȵѕ�е��ѕ�����5�ѥټ聍�������չ������Ʉ��������͍�ɼ�����ѕ�Ѽ(���ɥ��ɥ�����Յ͔��Ʌ������ͅȁ]��ѕɥ������ɼ��������չ�����������������ɥ���Յ��Օȁѕ�Ѽ(�����ɼ�������������������ٕ������ɼ�ͽ�ɔ����ɼ���������ȁ���ѕ�Ѽ���ɕѼ�ͽ�ɔ����չ���ɽ�(���͍�ɼ��������Ʌ�є����ѥ���������ȁ���ɕ������ٕɑ�����������́�������ɥ����������̰(������ɥ�̃�P��եѼ����́٥��ٕ������Ք�������������մ���������Ք��Յ͔��������ɕ������ѕ���(���������ȵѕ�е�Չѱ��������ԁյ��ٕ��������́�͍�Ʉ����ͅ��Ʌ��������͵��]��ѕɥ������ѕ�����(�����Ʌ��ե�����ѕ�Ѽ�(���������ȵ��ə����ɀ��������ȵ��ɑ�ɀ�����Ʌ���յ�������������ɽἁ��ѕɵ����ɥ����������(���͍�Ʉ��Յ�Ѽ����չ�����������Ʉ��������]��ѕɥ����P��������������̽��ٕȽ��٥ͽɕ́����ٕ��(��������ѕ�Ѽ����ɼ��Ք�������є����ѽ���������(���������ȵ�Ս���̀��������ȵ݅ɹ������������ȵ�����ɀ��������ȵٕɥ�����������Ց�Ʌ��((����5Ց�����((�������������̹��̀�ѕ������ɼ����͍�ɼ���Յ��酑�́����������ф�����������͍�ɼ���յ��ٕ����(�����������́�ɽ�չ��������͵�����Օ��������Ք�������ф����ͤ������͍�ԁ�͍�Ʉ��((����A��Ѽ�����ѕ����((���������ȵ݅ɹ���������Ʌ�������х������������Ņ�������ԁ٥�Յ����є����᥵�������ټ(���������ȵ�����р��Mչ���ܰ��������ـ���P��́���́��������������Ʌ�����;����Ց�������Ք�������饄(�����є��������ф�����������͔́����ͅȁ������������ɔ���٥ͼ����������Ѽ���ѥ����������ѥ�����(���������Ѽ�������є�((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ���P���յ���Ց������������ѥ������������́Ʌ�����(���Ք�����ѕɥ�Ȁ�ͥє���ѕ�ɼ����̈́���ѕȁ�չ����͍�ɼ��((������ش������P�I���͕�����������ф�%���ɕ���	�Ք��������ɕ͕����ɕ��((����=���ѥټ((��U���ɥ������ԁ�������х���є��Ʉ��ԁɕ��͕���ȁ������ф���������ɑ����ѽх���������������ȁ��(�����Ѽ��Ք�����ȁ�����Ȱ����������Ʌȁ��1U�������͔������Ѽ����P�ɕ����ф���ɕф�������Ѽ���(���ѕ������Ք��ԁѥ������م�х���������Ʌ�����ѕɥ��聱�Ʌ����ͽ�ɔ�����հ��������ͅ����́����(���������ȵ�����еͽ�р��ѥ��������Ʌ�є����ἁ�����́�Ʉ�ѕ�Ѽ�����������������հ��������ɕ���(�����ɕ�Ѽ����ͥє�((����������������ͥ��((����ѽ����=Ʌ�������ѥ�Մ�����ȁ�����ɍ������������ȵ�����р���P�Q̰��ɗ��̰���х����ѥټ�(������������хل�(����%���ɕ���	�Ք����̈́���ѕȁ�ɕ͕�������ٕɑ�������ͥє�������ٕ聑������ȁɕ��ɥѼ���մ(��ѽ�������Օ���٥Ʉ�����͔�����չ�����Ʌ����������ȵ������մ�ѽ���������ɼ������́����ɛ�����(��͕�չ��ɥ�̽��ٕȀ��������ȵ��ə����ɀ����́���́ѕ��̸��ɑ́���ѥ�Յ���Ʌ����(����������ȵ��ə�������P�������Ʌ�є����ɔ���ɐ��Ʌ�������չ�����ձ���������Ք������͕�͇������(���ͽ�ٕє����ɕ�������Ʌ��������ٕ聑�����鄵��ٽ������ɼ�(�����������ȵ�����еͽ�р�ٽ�ф���͕ȁմ�ѽ�����ɼ��������ɥ����Ʌ��������������́����հ���P��ɽ��(���Ք�ɕͽ�ٔ����ɽ�������������Ʌ�є�ѕ�Ѽ���Ʌ������������������͕������ɼ�ѕ������͵�(���Յ������������������������Ք������Օ����ɥ��������́�Ք���������ټ�ѽ�������Ʌ����(���������ȵٕɥ�������͕�����հ����ٕɥ�����������́��ɕ͕́���ѥ��̀��Ս���̽݅ɹ���������Ȥ(�������Ց�Ʌ��((����5Ց�����((�������������̹��̀(����Q�������ɼ聀������ȵ��耍���ᙍ����Ʉ����՘٘ူ����鄁����ɼ�쁀������ȵ��ə�����耍��͙��(������Ʉ��������ɀ�����鄁����ɼ��P����Ʉ�����%���ɕ���	�Ք���ɼ�쁀������ȵ��ɑ��耍��ɕ��(������Ʉ����єݕ��������х����Ʉ��������ȁ��������ټ��չ�������ɛ�����쁀������ȵ�����еͽ���(����Őɀ�����͕������ɼ���ɥم��������ټ���Ʌ������Ʉ�����հ������������Ʌ�����ѕɥ�Ȥ�(����Q�����͍�ɼ聀������ȵ��而��ň������������ȵ��ə���而����ɍ����������ȵ��ə�����而Ő�����(������������́�͍�ɽ́�����͵������������հ�����ͱ�����Չ�ѥ�ե�����́����́����ɽ́��ѕɥ�ɕ̤�(�����������ȵ��ɑ��而Ʉ�����쁀������ȵ�����еͽ��而������������ɽ�����͕����͍�ɼ����͵�(�����͝����������ɼ��(�����������ȵ�����р��������ȵ�����е��ٕɀ������Ʌ�������ͤ�������Ց�Ʌ�����ф����Ʌ����P��́�(�������Ʌ�����ѕɥ�ȁ���ѥ�����ɽ�������Ʉ�����Ռ�̀�((����Y��������((����͌�������р�͕����ɽ̸(��Q��є�٥�Յ��������є���������ɵ������������ɥ���P��������ͼ��Ց�����չ�����Ʌ�����ѽ��(���������������́մ�ѽ�����ͽ�������م��������ɥȁ��ɥ�́ѕ��̀���������͡���ɐ�����ٕ�̈́����ѕ�(��������ͥ��Ʌȁ��������((������ش������P�9�ل�����ф�ѽ����=Ʌ������%���ɕ���	�Ք((����=���ѥټ((���Յ���ȁ����ȁ�����ɍ�����)��������������������ɥ�耉ѽ����=Ʌ����������̀�����%���ɕ��(��	�Ք����������(��������������ɵ��������������ɥ����ѕ́������Ȁ������Ѽ�٥�Յ�����ѽ�����ͥє��ѽ����=Ʌ���(���Չ�ѥ�դ��������ȵ�����р��͉٥���P�������ل���ȁ�����ɍ���%���ɕ���	�Ք��Չ�ѥ�դ(���������������є��������ȵ�����еͽ�р���չ�����́����̽�����́�ѥٽ̤�������������ȵٕɥ�����(������մ�ѽ���������є�((����5Ց�����((�������������̹��̀(����Q�������ɼ聀������ȵ������耍��Ռ�̀���Ʉ�������ř��쁀������ȵ�����е��ٕ�耍��ф�Հ(�����ٕ��������́�͍�Ʉ����͵��ɕ�������������Ʌ�є��Ք�������ѥ��쁀������ȵ�����еͽ���(���͙�����Ʉ�մ����͕����������ɼ���ɥم��������Ʌ������ѥ����P����Ʉ�������հ�������(����Q�����͍�ɼ聀������ȵ������耍��Ռ�̀쁀������ȵ�����е��ٕ�耍��ݐљ���ٕ��������́���Ʉ�(������͵��ɕ�������Ք�������ѥ������͍�ɼ�쁀������ȵ�����еͽ��而������������������͍�ɼ���(������հ�������P��ͅȁ����͵��ѽ�����ɼ��������͙���������չ�������͍�ɼ�����ɥ����ѽ�Ʌ����l(���������������ѥ谁����ф��յ���ͥ������ɼ�ѕ����(�����������ȵٕɥ�������͕�����հ����ٕɥ�����������́��ɕ͕́���ѥ���(������Ս���̽݅ɹ���������Ȥ������Ց�Ʌ���P����ѥ�Յ�������́م��ɕ́��ѥ��̰�����������ɵ����(������ɕ�����ȁ������ѥ���������ř������٘�����������ـ������������̈́���ɀ�����ɕ�����ѕ�ɼ�(��������յ���������������Ʉ�����������̹��̀��P�������ф�����Ʉ����������Ʌ��酑�����ѽ���̰�͕�(������ȁ��ɑ�����������������є�����մ�����������ɽ��������ᥝ�ԁѽ��ȁ������́����մ����եټ�((����A��Ѽ�����ѕ������������������х����P��������������ͥ���������՜�((���������ȵ�����еͽ�р������͙�������ͅ���������չ�����������������ѕ�Ѽ�������(���������ȵ�����р���������������ȵ�����еͽ�Ф�ѕ�д�������ȵ�����Х��������������������(���ѥټ���ͥѥټ����)������9��ѕ������ɼ����Ʌ��������Ռ�̀�ͽ�ɔ���հ����������͙���ѕ�(������Ʌ�є����ἀ�����ἁ����������ɕ�����������Ʉ�ѕ�Ѽ����Օ�����P�����ٕ�����́����́��ѥ��(���Ք����������������ѕɥ�Ȁ���Ʌ����ͽ�ɔ����͕������͵���������������Ȥ��M�����մ������(�����������������ȁ�������������ȁ������ѥ���������ɗ����������хȁ�́��ѽ�������հ�����́�͍�ɼ�(���ԁ����ȁ���ѕ�Ѽ����Օ�����������є������ɕٕ�ѕȁ�����������������ф�((����Y��������((����͌�������р�͕����ɽ̀�ML��������̈́���ȁQ���M�ɥ�нM1��а�م�������٥�Յ����є�����(���������������Յ��Օȁ���Ʉ��������������ɑ���������ɕ����(��Q��є�٥�Յ��������є���������ɵ������������ɥ��((������ش������P���ɗ���聍���Ʌ��ȁ��ɑ�������ͼ�����ɽ��Ѽ�����Չ������((����=���ѥټ((��I����х������������ɥ�聼��ɽ��Ѽ�ͽ������������ѕ����������Ʌ��ȁ�����́�Ք����ɥ����(������Չ���������鹍���((������̈́((��I1L������ɽ�Ս�̀��́ѥ�����Յ́�������́����M1Q���鉱���������х��̀􀝅��ɽٕ������������(���́����ɥ�́�����̸�9���յ������́���ɔ������Ʌ��ȁ������ɽ�Ս�}��ѥѱ�����̀��ѥټ����́�(���ɽ��Ѽ����������́����ɽٕ�����P������������=ݹ��Aɽ�Ս����U͕ɀ��������ѕ����ͥ����͵��є(����Ʌل�������ɝ�ȁ����������ͥ���Ք����ɥ���ȁ����Չ����ل����х��̀�٥Ʉ���Ʌ�р���<�����ͼ(�����ѥ����ͥ�������������������쁄�����Ʉ�������ٕɥ���������ȁ�����鹍������ѥ�Յȁ�Չ�������(��9����͵���������聁����ѕ}�ɽ�Սр�����ѥ��������յ���ɽї��������Ʉ������ȁմ��ɽ��Ѽ��Ք���(��ѥٕ�͔���ɽ�Ս�}��ѥѱ�����̀��P��������Ʌ��Ё������ٔ����Ʌ����Ʉ��͕���=8�1Q������(�������������1Q�����́����մ���ɼ���ԁ���A��ѝɕ́���ٕ聑��յ�����ͅ�����Ք�����͔�͕�ѥ���((����5Ց�����((��M�����͔聹�ل������䁁�ɽ�Ս��}͕����}��ѥѱ��}���ɀ��P��Օ��ѕ����ѥѱ����Ё�ѥټ��ɼ(���ɽ��Ѽ����ѥ�Մ����ɝ�����������������������ѕ���є������х��̀���Յ��(�������ѕ}�ɽ�Սр��IA�����Ʉ����Ʉ��������х���є����፱��������մ��ɽ��Ѽ��������������́մ(����ɽ�Ս�}��ѥѱ�����̀���������ͅ�����ɥ��х����������Չ����ȁ���ٕ聑���፱եȸ((����Y��������((������}��٥ͽ�̀��͕��ɥ�䤁�������������́��́�Յ́�Ց�����聹���մ�����ф���ټ�(��I��ɽ���������Յ��������є���������ɵ������������ɥ��((������ش������P���ɗ���聕�ɼ����͕�٥��ȁ�����ɥȁ��ə�������ɥ���ȁ����((����=���ѥټ((��I����х������������ɥ�耉Q��́�������ձ���Ё�������͕�ٕȁ��ɽȁ�����ɕ����������Ʌȁ�յ�(�����ф��������ȁ��Ʉ��ȁ��մ���ə�������ɥ���ȸ((������̈́((�������������������Ʉ��ɥ���ɕ́ɕ��́�����ɥ���ɕ́��������́����������ɇ���(�����͕�I���ͥѽ�乙���ɕ�ѽ�̠��������ѕ�����ɽ����̀�ɕ��́��������Ʌ䁵������(���������ф��͕�̹�̀�������ɥȁ����ə������մ��ɥ���ȁ��������������Aɽ����	�U͕ɹ��������(��������Ʉ�������ɕ������������ɥ���ɕ̽m�͕ɹ���t��������ခ���������������(����͕�I���ͥѽ�乙���	�U͕ɹ������P��Ք���ٽ�ٔ�մ���ɕ�ѽȹ������������͕ȵ��ĉ�������մ��ե��(���ѕ̰��́�ɽ��ѽ́���͔��ɥ���ȁ٥��������մ���Ʌ䁕������ɥ�����Ʌ乙��ѕɀ���չ��������(����ɼ���Ʉ�մ�����Ք�������є�������������������ѥ����ѕɥ�Ȁ��ɽ��ѽ́ɕ��̤������͵����͍�(��٥ɽԁյ������ձф�A��ѝɕ́����Ʉ�յ�����չ����ե����P���մ�م��ȁ��������͕ȵ��ĉ����聼(������ɥ��������ɕ���хȁ������ձф����ɼ�������Ф��������ٽ�ٕȁյ�����ф�م饄��%�ͼ�����Չ�ل(�������������ѕ�Ʉ�������ɼ�����((����5Ց�����((��������ɥ���ɕ̽m�͕ɹ���t�����������ɽ��ѽ̰��م����Օ̰����ћͱ�����������ձ��ɕ��́�́���(����͍���́�Յ�������є������Ѽ�մ���ə���ɕ�����ɕ��Aɽ���������ȁ���̃�P��ɥ���ȁ��������(����ɕѼ���́�Յ�ɼ����х́م饅̰���Յ�����������х���Ѽ���ѥ���(�������������͔��ɽ�Ս�̹�̀聁����Aɽ�Ս����ɕ�ѽɀ������AՉ���Aɽ�Ս�	�%����(������Aɽ�Ս�=ɑ��	�%��������Ʌ��յ����������������ɵ�Ѽ�����ե����ѕ́�������ձхȁ��A��ѝɕ̃�P(���Յ��Օȁ����Ք�����͕���մ��ե�����������ɥ���ȁ������UI0���ձѕɅ�����ь�����ٽ�ٔ(��م饼���ձ������ٕ聑���ɽ����ȁմ���ɼ��	�����������̈́�Ʌ�谁�����́�����Ѽ��Ք��Օ�ɽԁ���ф(��ٕ胊P��ɽѕ����Յ��Օȁ�������ȁ����ɼ��Ք������������ɔ���́�������������́ɕ��̸((����Y��������((����͌�������р�����ͱ��р���́���եٽ́��ѕɅ����͕����ɽ̸(��I��ɽ���������Յ��������є���������ɵ������������ɥ��((������ش������P���ɗ����I1L�����Օ�ل��Չ����ȁ�ɽ��Ѽ((����=���ѥټ((��I����х������������ɥ�����ѕ�хȁ����ѥ����ѕɥ��聁��܁ɽ܁٥���ѕ́ɽܵ��ٕ��͕��ɥ��������)��ȁх������ɽ�Ս�̉����������ȁ����AՉ����ȁ�ɽ��Ѽ���������͡���ɐ��ɽ��ѽ̽��ٽ��((������̈́((������ɇ������ɽ�Ս��}�ɑ���}��ѥѱ������}͍�������ѥٽԁI1L������ɽ�Ս�̀�����ɽ�Ս�}�ɑ��̀(����́�́�ɥ�ԁ�������́����M1Q�����ɕ�ѕ}�ɽ�Սр������ѕ}�ɽ�Սр������ѕ}�ɽ�Սр��(����ɕ�ѕ}�ɽ�Ս�}�ɑ�ɀ������͕��ɥ�䁥�ٽ��ɀ��ɽ�����������ɥ٥����������Օ�����������Յ����(��IA́�������̀���P�͕�������䁑���%9MIQ���UAQ���1Q����Ʉ����ѡ��ѥ��ѕ����������ɥ�(��%9MIP�����ɼ�����ջ�����Ʉ����������ȁ������������̀����ѥ������͔�����չѼ�������Ѽ(�����ɕ�ѽ�}��͕���}���̀���ɕ�ѽ�}����ѕ�}���̀���ɕ�ѽ�}����ѕ�}���̀�쁄����ɇ��������ɽ��ѽ�(�����Օ��ԁ���ɕ�����ȁ����͵���������((����5Ց�����((��M�����͔�����ɇ������ɽ�Ս��}���}�ɽ�Ս�}�ɑ���}�ɥѕ}�������̀�聅�������(����ɽ�Ս��}��͕��}�ݹ����ɽ�Ս��}����ѕ}�ݹ����ɽ�Ս��}����ѕ}�ݹ�����ɕ�ѽ�}�����Ѡ�ե�����(������ɽ�Ս�}�ɑ���}��͕��}�ݹ��������}�����Ѡ�ե�������P���͵����������������̀�(����ɽ�Ս�}��ѥѱ�����̀����ѥ�Մ�����ɽ��ͥѼ�͕������յ�������䁑���͍ɥф���Ʉ(�����ѡ��ѥ��ѕ����́��͕�٥���ɽ����ݕ�������������������ͼ�(��9���յ���Ց���������͑�����P����́���ɗ������������䁹�������������������Ʌѥ��ٕ́�ͥ�����́��(�����եټ����є�ɕ����ٕȁ��ф�������Ʌ��́��ѕɥ�ɕ̤������Ѽ�������Ѽ�͕����ټ�������((����Y��������((������}��٥ͽ�̀��͕��ɥ�䤁�������������́������ɗ���聹���մ�����ф���ټ�(��I��ɽ���������Յ��������є���������ɵ������������ɥ����Չ����ȁմ��ɽ��Ѽ����ѕ�є���ٔ(���չ�����ȁ���Ʉ��((������ش������P�Aɽ��ѽ́����х��聍�������������Ʉ���������ѕ���ɕ���((����=���ѥټ((��M��չ�����ѥ������ٽ���������)�������ɥ���Ʉ������͔��ٕȁ���Ʌ�����ѕɥ�Ȥ�����ѥ����ԁյ�(��٥���������ɥ���������ɥ��ɕ�Ʉ�������ͥ�����������1U���耨��ɽ��ѽ́����х�̨���P������(����ٕ�ѥ����������ٕɑ����մ�����ͥ�ѕ�����ѕ�ɼ���Ʌ�������Aɽ�Ս�I���ͥѽ�倰��=ɑ��I���ͥѽ�倰(���A�嵕��I���ͥѽ�倰���ѥѱ�����I���ͥѽ�倰��M���I���ͥѽ�倰��]�����M��٥����(����ѥѱ�����M��٥������=ɑ��M��٥������A�嵕��M��٥������P�٥٥�����ѕ�Ʌ���є���(��������MѽɅ����٥���5���M��ͥ��Aɽ٥��ɀ��<��������Ѽ����ͤ�����Ʉ�ɕ����5�ɍ����A�����(�����嵕��}�����ɵ�ѥ��̀�����������耉�ɽ�ՍЉ������ɕ٥�Ѽ����͍���������́������ͼ����������(���������Ʌ��Ȁ�������ѕ�����չ����Ʉ聙���ل��ɕͼ������ٕ����ȁ����Օ������ɽ԰�͕�(��ͽ�ɕ٥ٕȁ��ɕ����������ͥѥټ��P��ԁ͕����������ɼ�ɕ�����ȁմ������ͼ���Ք��́���ѥ�(����������є�(��U���ɥ�������ɵ�ԁ�͍����������Ѽ聍��������������Ʉ���������ѕ�������ф������ф��ɕ��ɽٕ�х���(�������᥵�������Ʌ�������Ʉ�ɕ���������ѕ�є��5�ɍ����A��������嵕��}�����ɵ�ѥ��̀���݅���р��((����5Ց�����((��M�����͔���ɽ��Ѽ�������Հ������ɇ������ɽ�Ս��}�ɑ���}��ѥѱ������}͍�����(������ɽ�Ս�̀聍��������ɕ�������ձ�����͍ɧ�������ѕ��ɥ���х�̰�ѥ�����ɗ����ɗ����ɽ��������(����������хٽ̰�����������ɥ��������}�ɱ���P������եټ�ɕ������ɕ�Ք��P���х��̰�Ʌѥ���ٕ���̤�(����I1L��鉱�����́�������ɽٕ��쁑��������Ց���IA́��ɕ�ѕ}�ɽ�Սр������ѕ}�ɽ�Սр�(���������ѕ}�ɽ�Սр����͵����͍��������������̀聁͕��ɥ�䁥�ٽ��ɀ���͕�ɍ�}��ѡ��م饼�(����ͅ��ѥ����������Ʌ�́����������(������ɽ�Ս�}�ɑ��̀���������������Ʉ������ɗ������Ʌم�����������Ѽ�����ɥ������(�������ɕ�ѕ}�ɽ�Ս�}�ɑ�ɀ��IA���P�٥Ʉ�����ɑ��}������م������5�ɍ����A�����I1L���(��������Ʌ��Ƚ�ɥ���ȁ�����������ɥ�������쁹���յ�������䁑������є���Ʉ����ѡ��ѥ��ѕ������(����͕�٥���ɽ����٥��ݕ�������(������ɽ�Ս�}��ѥѱ�����̀聅���ͼ������������P��́�Ʌم��������͕�٥��Ȁ��չ�������(��������Ʌ��Ȥ���չ��Ք��ɽ�Ս�}��������}�����(��������}��٥ͽ�̀��͕��ɥ�䤁�������������́������ɇ���聹���մ�����ф���ټ�(���������嵕��̽��ѥمѕAɽ�Ս�=ɑ���ѕ�A�嵕�й�̀����ټ����͵����ɵ����(�����ѥمѕ��ѽ�M��٥��=ɑ�ȹ�̀�聍������������ݕ�������Յ�������嵕��}�����ɵ�ѥ��̀������ɵ�(������������������耉�ɽ�ՍЉ���P���ɍ����������������������������������ѥѱ����а����ɕ���ф(���ͅ���}��չр����ѥ������́���́����̸�%�����ѕ�є�(����1��������������������ɍ��������ݕ������ɽ�є��̀�������ɵ�����������ɽ�����(���������������ɍ���������х��̽ɽ�є��̀��ɕ�������������ѥل����ɕѽɹ�����������ЁAɼ��(�����������������х���є����������ѽ�}͕�٥��������չ�����ل�(���������������͕��Ʌ�������ɥ�����������������聁����������ɍ���������������нɽ�є��̀(����������ل��մ���ɑ��%�����ٕ�х����������ٕ����ȁ��ɕ����ձ�ل���م��ȁ�����ѥȁ����ɽ��Ѽ����(����٥ټ��������������������Ʉ��ᥝ��մ���ɽ�Ս�}�ɑ��̀�ɕ�����ɥ������ѕ́�����IA���ɗ�����(�����Ʌم�������́�����ɔ��Ք��������ѕ�����������Ʌ��ȁ��ѕ�ѥ������P��չ������́��������������(����٥������������є���Ʉ�������ȁم��Ƚ�ɥ���ȸ(��������ɕ�ѽ�	��������������������͔�݅���й�̀�����ͽ��ل����嵕��}�����ɵ�ѥ��̀����(������ɕ�ѽ�}����͕������Ʌȁ��ȁ��������P����ѕ�Ʉ�ͅ�Ք�����ɥ���ȁ���ͅ����ɕ���ѥȁٕ���́��(�����ɽ��Ѽ���ѽ��ѥ�����є����͕������յ���Ց����������̈́��ջ����(�������������͔��ɽ�Ս�̹�̀����ټ����͵����������������̹�̀�聱����Ʌ́�鉱����(����������ɽٕ�Aɽ�Ս�̀���������ɽٕ�Aɽ�Ս��	��ѕ���倰��͕�ɍ���ɽٕ�Aɽ�Ս�̀�(������AՉ���Aɽ�Ս�	�%�����չ���͕��������������}�ɱ���P��́�����Aɽ�Ս����ɕ�ѽɀ�����������(���������������=ݹ��Aɽ�Ս����U͕ɀ��������ѕ�������Օ������ɽԤ��Ʌ镴���̈́����չ���%�ͼ��٥ф(���Ք�������������ݹ�����م锁��Ʉ��Օ����������԰�����Ք�I1L�����ȁ�������������ȁ���չ��(������������������ɽ�є��̀������������������̀聑��́�U�����-�������ٽ̃�P(����ɽ�Սе����������͵�́ɕ�Ʌ́�������љ�����������������ɽ�Սе��������Յ��Օȁ���եټ����(������5���́��Ʉ��ɥ���ɕ̤��P��������ɕ���٥��Y�ɍ���	�������͵��������͵������ͅ���������ɕ��(���������������ћͱ���(���������͡���ɐ��ɽ��ѽ̽��ټ���������聅�ͥ�ѕ�є�����Չ������������ԁ���͕ȁյ��ͥ�ձ����(��������Ʌѥ��M��٥����Չ�����I�٥�ܠ�����ͥ�ձ�ȁ��٥��������եټ����P����Ʉ���٥�����եټ���(��ٕɑ�������Չ�����٥����ɕ�ѕAɽ�Սр��IA�����ɕѼ����������ɽٕ����͕��������������ɇ����(����͵������ѥ���͕���͕�ٔ��������̀��(���������͡���ɐ��ɽ��ѽ̽��������聱��х����ɕ�����Չ����Ƚ����Չ����ȁ���፱եȁ٥��IA�(������������̽Aɽ�Ս�A�ɍ��͕ɕ����ူ�����������̽���������ܹ��ူ(��������������нm�ɽ�Ս�%�t��������ူ�������������нɕѽɹ�����������ɕ�͍ɥѽ͕́�(����͕5���M��ͥ������͕�������M��٥��̀��P��ɥ����������ɕ��������������������Ёɕ��������(������Ʌ����ѕ��������������Յ������������ɍ���������х��̀������ɵ����Ք����Օ�����������(����ѥѱ����Ё���ٕɑ�������5�ɍ���A���A��A��������ɑ�ԁ�����������Ѽ����ѥ�������ɕѼ(���A�嵕��M��٥��������Ʉ��́�ᥝ��մ���幍Mх��̀��͕��ɕ��ͥ��ɥ�����������մ���ȁ���̤�(�������������ѕ�����������聳����ɽ�Ս�}��ѥѱ�����̀����ٕɑ�����٥����͕��ɕ��U͕�%���ɕ����(�������������	���Ȉ���Ʉ��������}�ɱ�����������ɽ��Ѽ�����Ʌ���(��MՉ�ѥ�է�Օ́��ɕх́�����ɽ�Ս�I���ͥѽ�倀���������ȁ�����������͔��ɽ�Ս�̹�̀����(��������������ူ�������ɽ��Ѽ�m��t��������က���ɑ�ԁ�����ɅѕMхѥ�A�Ʌ�̀��P��ɽ��Ѽ����Ʉ��(�������ɕ���������������٥ɽԁ%MH������ɕم����є���������Յ������������������ѕ��ɥ�̽mͱ՝t��������ူ(��������ɥ���ɕ̽m�͕ɹ���t��������ူ��������͍��ɥȽ�������ူ��������ٽɥѽ̽�������ူ(��������������������က����х����ɕ���٥���͕�٥����̀����������͡���ɐ���хѥ�ѥ��̱�����ٕ��������း(��I���٥��́��ȁ����ɕ��͕������մ�����յ���ȁɕ��聁����ɕ��ͥѽɥ�̽Aɽ�Ս�I���ͥѽ���̀�(�������ɕ��ͥѽɥ�̽A�嵕��I���ͥѽ���̀�������ɕ��ͥѽɥ�̽�ѥѱ�����I���ͥѽ���̀�(�������͕�٥��̽��͕�������M��٥��̱A�嵕��M��٥���=ɑ��M��٥���]�����M��٥����ѥѱ�����M��٥�����̀�(��������������н�������������й�̀������������̽���ѕ�еɕ���͔��̀���������ф��ɽ�Ս�̹�̀�((�����Ʉ�����͍�������ф���ѥ�����ɵ���������������յ��х�����Ʉ���������չ��ȁ�����̤((���������͡���ɐ�ٕ���̽�������ခ���������͡���ɐ���хѥ�ѥ��̽�������ခ����������(���=ɑ��I���ͥѽ�倽�M���I���ͥѽ�倁�������Ʉ����������ɥ��������ٕ���̀����ф�����������P��(�����є����ٕɑ������������Ʉ�ɕ�����������嵕��}�����ɵ�ѥ��̀���ͅ�����ȁ�݅���й�̀�쁵��Ʌ�(����́ͅ�Յ́ѕ��́��Ʉ�����ձхȁ���嵕��}�����ɵ�ѥ��̀���ɕх���є��������᥵�����ͼ�����Ʌ��(���������Ѽ����Ʉ���Ʉ�����������ȁ���������́��ф��Ց�����(���ٽɥѽ̀���ٽɥѕI���ͥѽ�値�������̀�������I���ͥѽ�値���م�����������ɽ��Ѽ(����I�٥��I���ͥѽ�倰�����ɕ�є��������ѽ�}�ɑ��}ɕ٥��̀�������鹍��́����ɽ��Ѽ(����I�����I���ͥѽ�値����ѥ�Յ��������P�����մ����͕́��������������ф���ѥ��(��9���յ��������������ɇ������Ʉ��ɽ��Ѽ����������}ɕ٥�݀��ɕ���ѕ�����������������Չ���������(��͕���͕�ٔ����Յ��������̀��́���չ�̽م��ɕ́���ѥ�Յ�����ѥ���������������Ʉ�����������Ք(����ͼ���ȁ�����������((����Y��������((����͌�������р�����ɽ��Ѽ���ѕ�ɼ�͕����ɽ̸(����ͱ��Ѐ�������ɽ��Ѽ���ѕ�ɼ�͕����ɽ̀�ȁ�٥ͽ́����͕е�хє���������р�������Ʌ��́�(�����ɥ����́��������������ѕ����������ခ������������̽Aɽ�Ս�A�ɍ��͕ɕ����ဤ�(����������Ё�ե���聍������������������������ѥ��́����������쁄���ɇ��������ѥ��������ԁ�(�������������́��镹����������́ɕ��́���M�����͔���ѕ́���͕ȁ����Օ�������������ѥ������ɕ��(�����є�ͅ����������Ё��������Ʌ����������ݱ��Ф��P������ɵ���Ք����͑���������������ȁɕ�Օ���(��ɕ��̰�������մ���ɼ�����͝�������ф�م����ȁ���ե���������ф��������ἁ�������Ʉ����ф��(�����ф��A���ɕ�����մ�������є�����ɕ�������Ʌ���������ع��������������Ʌ���(��5��ɇ������IA́��������́��ɕх���є�����ɽ��Ѽ�M�����͔�ɕ���٥��5@쁁���}��٥ͽ�̀(���͕��ɥ�䤁�����ɥ��聹���մ�����ф���ټ��������́������յ��х��̸(���������������ɕ́���́��́���եٽ́��ѕɅ���聹���յ�������������((������ش������P�=���х́����ɕ٥�Օ́������Ք�����������ͼ�((����=���ѥټ((��Aɥ���Ʉ���ѥ�����յ���ٽ����������ȁ���)�������ɭ�����������͕�٧��́�ɽ�ѽ̰��������(�����ͽ����酑�̰��ɽ���х̰������̰��ɽ��ѽ́����х�̰�ɕ����Ʉ���ɕ��ч�����������Ʌ�����(��������ѽ́�����9����̽]�ɭ����Y��ѕA����A���饸�͕�������ȁ����ѥ������ԁ�չ�����������̃�P(�����������ͽ�ɔ����������Ʉ�������ѕ�є��͕��ɕ�ɥ�ȁ���������ɼ�(���ѕ́����Ց�聵�������Ѽ�������Ѽ�����Ք�������є�����̰�������́���ͽ����酑�̰����а(����ѕ��ɥ�̰��م����Օ̰����ћͱ�������������Ʉ�ɕ��ɽٕ�хȁ���ٕ聑���������ȸ�<����ἁ��(������������ͽ����酑���������͕��������є���ā��ɕ����������մ��ɥ���Ȁ�������������������Ѽ��(����ɥ�́�ɽ���ͥ����̤��P���������������ѕȁ��ͥ����ȁ�Ʉ�(��9��ф���ѥ�聑�ȁ�������Ʉ�����Ք�������Ʉ��́ѕ�Ѽ����ɔ������͍ɧ�����������������ɽ���ф��P(���Յ�х́ɕ٥�Օ́��������������̰����Ք�����������ͼ�����ф����յ������ɥ�����������́�������(����������������$�����͔��Ʌ́���᥵�́��ѥ�̀������́ɕ��ɽٕ�х���́��͵�́������쁉ɥ���������(����ѕ��ɥ����ɕ����Ʉ���������Ʉ������̤�((����5Ց�����((��M�����͔���ɽ��Ѽ�������Հ�(����5��ɇ��������}���}�ɽ��ͅ�}���Ս��ɕ�}�����}�����̀聁���̀��������ɕ٥ͥ��}��չр�(���������Ց��}�ѕ�̀���ѕ��mu�������������}�ɱ̀���ѕ��mu��쁁���ѽ�}�ɽ��ͅ�̀������(�����ɕ٥ͥ��}��չр��������Ց��}�ѕ�̀������́��Ʌ�ѕ���ɕ٥ͥ��}��չЀ������Յ��������ɵ����(������ɕ�ѕ}����������ѕ}�������ɕ�ѕ}���ѽ�}�ɽ��ͅ���ɕ�ɥ���́�����́��ٽ́�������ɽ�(���������������́������������������ձа��ɕ͕�م��������ͥ����Ʉ������ɕ�������P������ٕɱ�����(����M���ѥ酴��́��Ʌ�́����������ɥ���ɕ��ٔ��ѕ�́م饽̰����ф�������ѕ�����������Ʌ�ѕɕ́�(��������ф������ѕ�̸(��������}��٥ͽ�̀��͕��ɥ�䤁�ᕍ�х������́�����ɇ���聹���մ�����ф���ټ��P��́�́�٥ͽ�(�����������ѕ�ѕ́������յ��х��̀��ջ�Օ́�͕��ɥ�䁑�����ɀ�����������}�ɕ�ѽɀ��(������Չ���}���ѽ�}�ɑ��}ɕ٥�݀���ɽї�������͕����م酑���(�����������̽�����̀�������������͔����̹�̀(������������%���р���������ɕ٥ͥ���չ����������Ց��%ѕ�����ɥ��mu�����������Uɱ����ɥ��mu��(����9�ټ�������	�%����P��ͅ�����Ʉ������ɕ�����ȁ���ɽ���ф������ѥȁ�����������ɥ����(�����������̽���ѽ���ɽ��ͅ���̀�����������̽���ѽ��ɕ�Օ�й�̀�������������͔����ѽ�I��Օ��̹�̀(�������ѽ�Aɽ��ͅ����������ɕ٥ͥ���չ���������Ց��%ѕ�̀쁁�ɕ�ѕ��ѽ�Aɽ��ͅ�������ф��(������٥���́���́�����̸(�������ѽ�I��Օ�р����̈́�������ȁ�ͽ�ɍ���%���������չ��������ѥ��������������́������хل(���������������ѥ��������Ȥ��P���ɵ�є�����ȁ���ɽ���ф������鹍����Ք��ɥ����ԁ���������(���������͡���ɐ�͕�٥��̽��������(�����ɵճ�ɥ�������鹍����������I�٥�Օ́��������̈���鵕ɼ�������������<��Ք�����������ͼ�(��������ф��յ����������ȁ�ѕ������5��́������̈������ɥ���ɕ��ɽٕ�х��������͵�����������(��������������ф����UI1́����ͅ�������A��љ����M��ѥ�����ဤ�(������������̽���ɐ���ူ�����������̽������ɐ����(����᥉������Յ�ѥ��������ɕ٥�Օ�쁼���ɐ���������х���������Ʉ��̀́�ɥ���ɽ́�ѕ�́�����ͽ̸(������������̽��ٕ�ͅѥ��Y��ܹ���(�����ɵճ�ɥ������ɽ���ф��������́��͵�́���́�����̀�ɕ٥�Օ̰����Ք�����������ͼ��(��������ɥȀ�ɥ�ȁ�ɽ���ф���մ���������Ք���͍�ԁ���մ�������ͽ�ɍ���%���������ɵճ�ɥ���(���������ɕ�������������ѥȁ�����鹍����������	�%�����P����ɥ���ȁ�́�����ɵ���ԁ����ф�(�����ɐ�����ɽ���ф�������ٕ�̈́����̈́����᥉�ȁɕ٥�Օ́���ѕ�́�����ͽ́�Յ��������ɵ���̸((����Y��������((��M1��Ё����͌�������р�͕����ɽ́��́���եٽ́��ѕɅ��̸(����������Ё�ե���聍������������������������ѥ��́���������́�����Ս��ͼ쁄��х�����(������ɕ���ɥ��������������є�ͅ��������ȁ���ф��������ع��������͕���9aQ}AU	1%}MUA	M}UI1��(���P�����ч�����������ѕ�є����������є������ɕ��������������ф��Ց�����(���������������ɕ́���̀���ɕ�����ȁ����������͕́�������ф�Q���ݥ������́���եٽ́��ѕɅ����(������յ�������������(��5��ɇ������IA́��������́��ɕх���є�����ɽ��Ѽ�M�����͔�ɕ���٥��5@쁅�٥ͽ�́���͕��Ʌ���(�������ɥ��́���́���Ց�����((����A��᥵�́���ͽ́�՝�ɥ��̀�������������х��́���ф���ѥ��((��Aɽ��ѽ́����х�́ɕ��̀�������́���������������ф��ɽ�Ս�̹�̀��٥������ɕ�Ʉ�������ͥ���������(������̽����ѕ́���͕�٧��̸(��Aɽ���х́����х́����ѥ���́�ɽ���ͥ����́��Ʉ�����͵���������(��	ɥ�����������������ȁ��ѕ��ɥ����̵����є�(��I�����Ʉ�������Ʌхȁ��م���є��������ѥȁ��������ɥ������������̸((������ش������P���������Ѽ���́����ɽ��́������������((����=���ѥټ((����ɥ��ȁ����ͅ��������Ѽ�٥�Յ�����ɔ���ͥ��������ѥ�����Օ́�����مхȁ����������((����5Ց�����((������������̽9�ѥ����ѥ��	�������(����9����������ͥ������مхȁ�ͅ����ɍձ�́����ѥ��́�������ఁ�����̃�����́����Ʌ��酑�̸(����<����х��ȁѕ��Յ���Ք���͕�ե���Ʌل������������Ѽ���ѥ��������Չ�ѥ��������ȁմ����Ѽ(������͍ɕѼ쁄��Յ�ѥ��������ѥ�Մ�����ɵ�������ѕ�Ѽ�������ٕ����������(������������̽!����ȹ���(�����������ȁ����������ͥ������ͽԁ��������ѥ���ȁ����͵������Ʉ�����ἁٕ�ѥ��������مхȸ((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ������(���������������ɕ́���́��́���եٽ́��ѕɅ��̸((������ش������P��������������ٕ����������������́��ٕ�((����=���ѥټ((��%�ѕ�Ʌȁ�����ȁ������������������ї鑼���ɕ���ȁ����ͼ�٥�Յ�������ٕ����������ɥ�ȸ(��٥хȁ�Ք�����ɽ��́ɕ�չ���ѕ́���չ��́�Ʌ���́�����͕�͇���������ѕə��������ɥ�����(�����ՉɅ�������ї鑼�������ձ�ȸ((����5Ց�����((������������̽!����ȹ���(����������������ͽԁ���ͅȁ����ɛ������Ʌ�ͳ鍥�����������ф��������ͥ����Ʉ���Ʌ������͍ɕф(����ͽ������ɍ����͕������������٥��ɥ������������(����I���٥������х����ɕ�չ���є��������ɅȰ�����ɕ͕�є������ٕ����������ɥ�ȸ(����9�ѥ�����Օ́��Ʌ����م��́����������������������������ͼ������ф���ɑ�ԁ��ɑ����͹������ɥ��(����5��ԁ�������٥ɽԁմ������������Յ�є�������Ѽ����������́����Յ́���չ�́���ɕ��ɽ��ٕ��(����5���́ɕ����Ʌ����ɥ��������������Ʉ����չ���ȁ���ɕх���є�����х��������ѽɕ́���ѕ���(������������̽5�����9�ع���(������������ԁ���́���ἁ��������յ����ɝ�Ʉ��ɕ٥��ٕ������������́�����ȁ����ɥ�����̸(�����х����ѥټ�����ԁ����ͅȁմ���ɍձ���ɕ���������Ʌ���쁅��Ʉ��̈́���ȁ��մ��ɇ������Ѽ�(�������������́�����������ٕ�������ٕ����������ɥ�����ɕ�р����ɽф��ѥل�(������������̽A���5�������(����I�͕�ل�����ɥ�ȁ����х�����Ʉ�������ȁ�Ք���������ՉɄ�������������ї鑼�((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ������(��I�٥�����������ͥ������������х��́�ѥٽ́���ɕ�́���ѽ�Ք�����������(���������������ɕ́���́��́���եٽ́��ѕɅ��̸((������ش������P��ѕ��ɥ�́��������)��Ք�������((����=���ѥټ((��ɥ�ȁ�Յ́��ѕ��ɥ�́����ȁ������х́����ɼ�������ἁɕ������͕�٧��̸(��A�ɵ�ѥȁ�Ք��ɗ������ɇ�������������ɽ�ɕ������������͕����������Ʌ��́�����ͥ�ѥ��̸((����5Ց�����((��M�����͔�����̀(�������������́�́���չ�́���ѕ���倰�������������љ�ɵ����͕�ͥ��}����ѕ̀������ɕ��}Ʌ�����(�����хɝ��}Ʌ������������Ʌѥ�������}������}͕�٥��}��ѕ��ɥ�̀�(����IA́��ɕ�ѕ}������������ѕ}�����ɕ�ɥ���́������͕��ɥ�䁥�ٽ��ɀ�������͕�ɍ�}��ѡ��م饼�(��������ͼ��፱�ͥټ������ѡ��ѥ��ѕ�����م�����Օ́����������́��ȁ��ѕ��ɥ��(����)��Ք���������ᥝ���������͕����������������ԁ����ѽ���������ᥝ��������������Յ������(������͕��������Ʌ鼸(���������͡���ɐ�͕�٥��̽��������(����<���ɵճ�ɥ�������ԁ͕��ѽȁ�����ѕ��ɥ���������́�����������́��Ʉ��́���͕́�٧��́����ȸ(����)��Ք��������������Ʉ��ɗ�����ȁ͕���������ɇ�����������ѽ̸(����������������Ʉ��ɗ�������������х��ɵ��͕�٥��Ȱ�������Յ���������͕��������Ʌ鼸(�����������̽�����̀��������������͔����̹�̀(����Q���̰���������Ѽ�������Ʉ������ե̈́�����ч�Օ́��Յ��酑�́��Ʉ��́��ٽ́����̸(���������ф���ѕ��ɥ�̹�̀���������͍��ɥȽ�������ခ������������̽����ɕ��ѕ�̹���(������������)��Ք������������������̃�́��ѕ��ɥ�́������х�Ք���������������Ʌȸ(����<�����ɼ����Ʉ��᥉�������́�͕́�٧��́�����ѕ��ɥ������ȁ͕����������(���������ѕ��ɥ�̽mͱ՝t���������(����́�Յ́��ѕ��ɥ�́�����Ʌ��������́����ɥ�́����͕�٧��́ɕ��́���M�����͔�(������������̽���ɐ���ူ�����������̽������ɐ���ခ������������̽I��Օ����	��ѽ�����(�����ɑ́����Ʌ��������͕������ԁ�ɽ�ɕ������������(�����ͽ����ч������٥������Ʉ������ٕ�̈́�����դ���ѽ��ѥ�����є��́��х���́����ȸ((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ������(��5��Ʌѥ�����������������չ�́�����ɥ��́����ɽ��Ѽ�M�����͔�������Հ�(��IA�ѕ�х�������Ʌ�͇��������ɽ���������Ʉ�)��Ք����������������(���٥ͽ�́���͕��Ʌ��������͕��������ᕍ�х���쁹���մ���ټ�����ф���������́���չ�́�ԁIA̸(��A�ɵ��������٥ͽ́��ѕɥ�ɕ́����ɽ��Ѽ�ͽ�ɔ��Յ́�ջ�Օ́�͕��ɥ�䁑�����ɀ���ɽї������(��͕���́م酑�̰�������́������ѥ��́I1L�����ɕ���������́����ф��Ց�����((������ش������P��ɑ́����ɽ��ѽ́ɕ�ɝ���酑��((����=���ѥټ((��5����Ʌȁ�������Ʉ�������ե���ɥ��٥�Յ����́��ɑ́����ɽ��ѽ̰��ɥ���������є�����Ʌ�����(���Յ́���չ�́����������((����5Ց�����((������������̽Aɽ�Ս��ɐ����(����<��ɗ���ͅ�ԁ��������������ͽԁ��Ʉ�յ���ɕ������ɥ������ἁ������ձ��(����Aɽ���Օ́���Ʉ�����Ʌ��մ����������Օ����������ф���ɗ�����ѕɥ�ȁ��͍ɕѼ����ɗ�����Յ����(�������х�Ք��͕�����������Ʌ�����Ք��Օ�Ʌل�������и(������ɕ����������������ԁ���́���ᄁ�����ͽԁ���ͅȁմ��չ���չ���ɵ������Ʌ���(����ɥ���Ȱ����ձ����ɗ������م�������ɕ����Ʌ�����������Ѽ������Ʌ��ե�����ͥ�ѕ�ѕ̸(����<���������ɍձ�ȁ����͕ф�����ɕ��٥��쁼���ɐ���ѕ�ɼ����ѥ�Մ�͕���������������ɽ��Ѽ�(������������̽5����A���������ȹ���(�������������������������ѕ�����Ʉ��Ʌ��́�Ք��ɕ��ͅ����������������́�����չ���չ���ɵ��(������������̽Aɥ��Q������(�������ɵ��	I1�����ͽԁ��͕ȁ�����х�����Ʉ����ѕȁ����͵����ɵ�ч��������ɗ��������ټ���ɐ�((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ������(���������������́��х��́�����ɗ�����ɵ�����ɽ������������������͕���م����Օ̸(���������������ɕ́���́��́���եٽ́��ѕɅ��̸((������ش������P�A���ե̈́����ѕ����ɕ�����ͭ���ѽ��������ɕ�����Ѽ((����=���ѥټ((���Յ���ȁ�́ɕ�ձх��́��������������Ʌȁ��Ʌ�є�������ч��������������������ե̈́�(���ȁ���������٥�Յ��������Ѽ����Յ�Ѽ�յ����ل�����ձф������͕�����ɽ���ͅ���((����5Ց�����((������������̽1�ٕ����ɕM��ɍ�����(����9�ټ�����������ɽ�����������Յ���������ѽ��ѥ������̀�����͕́������ч����(�����ѕ�����ѕȁ��ѕ���������͍��������������������ȁɕ��ٔ���ѕɵ��������х���є�(�����UI0����ѥ�Մ�ɕ���ѥ������ѕɵ������եͅ���͕��ɽ��ȁ�����������Ʉ���ѽ���(����U��ͭ���ѽ�����������ɕ������Յ�Ѽ�����ٕ���������́��ٽ́ɕ�ձх��́������������ѕ̸(���������͍��ɥȽ��������(����<���ɵճ�ɥ���Ʌ�������������������	�͍�ȁ�����Չ�ѥ���������������ե̈́����٥ټ�(���������͍��ɥȽ�����������(����<���������ȁ����ɥ��������Չ�ѥ��������ȁմ�ͭ���ѽ��ɕ����ͥټ��Ք���������������͕������(���������������Ʌȸ((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ������(��Y�ɥ���������������չ���������鄰��ѕȁ��ͥ��ɽ����������ѕɵ�����UI0�(���������������ɕ́���́��́���եٽ́��ѕɅ��̸((������ش������P�����Ʌȁ����٥�Յ�����́����Ѽ������ѽɥ��((����=���ѥټ((��I���ٕȁ�������������ፕ�ͥم���є���͕�����������́������Օ́��������������Ʌȸ(���ȁ�����������������́���ձ�́���͗����յ�������ͧ�������́����Ʌ���������������́����ɥ���((����5Ց�����((���������͍��ɥȽ��������(����<���������������ԁ���͕ȁմ���ɐ���������������ɵ�́����Ʌѥم́��٥ɽԁյ��������Ʉ����ɔ�(�����������х�Ք�ѥ��������������͍����ѕ�Ʌ���(����́��͍�́���ձ�ɕ́���Ʉ���������́���ѕ�Ѽ��͕��յ�����������������́������ɑ��(����S��ձ�́����ɽ���ͥ����́��͕�٧��́��ɑ�Ʌ�������́�������́�����ͅɅ�����ͅȁ���Ʌ��ե�(����ѥ��������������������յ����������٥��ɥ����͍ɕф�(����<���х���م饼�����ԁ�������ȁ����ɼ�������ɼ���ɐ�(������������̽����ɕ��ѕ�̹���(�����ѕ��ɥ�́���ɑ����������ͅɅ���������́���ѽɹ���́��Ʉ����́���ѕ�Ѽ�������х̸(����<�����������ɑ���������ɑ�ԁ����ɐ���ѕɹ����������������Ʌѥټ�(����<�ɕ�յ�������͍��٥ɽԁյ��������������ѕɅ����͍ɕф�(����<����ձ������ɽ��ѽ́����ԁ����ͅȃ����������ɼ�������ᄸ((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ������(�������������ɕ����ͥل�������ἁ��ɥ齹х�������ѕ��ɥ�́���ɑ�������(���������������ɕ́���́��́���եٽ́��ѕɅ��̸((������ش������P��ѕ��ɥ�́������х́������ե̈́�ɕ٥ͅ��((����=���ѥټ((��I����ȁ���������������������́��ѕ��ɥ�́��������������Ʌȸ(��I���ٕȁ�̃�����́����Ʌѥٽ́��́��ѕ��ɥ�̸(��Y�ɥ����ȁ�������Ʌȁ��������х���Ѽ��������ե̈́�����������((����5Ց�����((������������̽����ɕ��ѕ�̹���(����=́��Ѽ�����Օ́�Ʌ���́�����ѕ��ɥ�́����͕�չ������ᄁ�������́��Ʌ���Չ�ѥ�����́��ȁյ�(����鹥������ᄁ��ɥ齹х��������ф�(����Q���́�́��ѕ��ɥ�́���ѥ�Յ��������ٕ�́��ȁɽ��������ɥ齹х��������́���ձ�ɕ́�ɥ���ɼ�(����<�����ɼ����ѥ�Մ����х��������������ٕ����ȁѕ��������ͥ��ɽ��酑��������UI0�(�������ɕ��ͥѽɥ�̽Aɽ�Ս�I���ͥѽ���̀(���������ե̈́�����������ɽ��ѽ́���ͽԁ������Ʌȁ����ɕ���́��������Շ���������ᄁ������ձ��(������͍ɧ������х�̸(���������͍��ɥȽ��������(�������͍������ɽ���ͥ����́х��������ͽԁ������Ʌȁ����ɕ���́��������Շ���������ᄁ���������(�������������������ɥ��(����<����ἁ���������ɥ����ɽ��ѽ́�ͅ�����ձ����͍ɧ����х����ɽ���ͥ����́�ͅ�����������ɥ��(����͕�٧��́�ѥٽ́�ͅ�����ձ����͍ɧ�������M�����͔�(���1U����(������������������ɥ�����������Յ���ȁ��є������ɥ������ѽ����Ց���������Ʉ����ͥє�((����Y��������((��M1��и(��	ե�������ɽ��������ٕɥ�����������Q���M�ɥ�и(��	�͍��ѕ�х�������ѕɵ�́�����Յ��́��͕������Ѽ�(���������������ɕ́���́��́���եٽ́��ѕɅ��̸((������ش������P��ɑ́������ɽ́��������������Ʌ�((����5Ց�����((������������̽Aɽ�Ս��ɐ����聍�ɐ�ɕ��͕�������������������́م��ɥ酑����ɗ���ͽ�ɕ���Ѽ�(������ѥ�����������������������ȁ���Ʌ��ե���������٥�Յ��(������������̽����ɕ��ѕ�̹���聍�ѕ��ɥ�̰��ɑ�������������х́���Ʌ��́��Ʉ���х���������(��ɕ��ٕ������ɕ���ɕ�����Ѽ���ɍ����ٕ���������͕�����������ѕ������UI0�ͥ��ɽ��酑��(���������͍��ɥȽ��������聥�ѕ�ɇ���������ټ����ἁ�������ɽ͕́����ѕɅȁ����͍���ɥ�������((����Y��������((��M1��а�Q���M�ɥ�Ё���ե�������ɽ���������������̸((�����ش���̃�P����ɕ�����Ѽ���Ʌ����������((�������ɼ����Ʉ��ᥝ��͕��������ȁ��������Ʌ�ѕɕ̰������ɵ��������͕����������Օ���͕���́���չ́�ԁ�Ք����ѕ�����������ѥ������������ɥ��(����������������������ɥ��������ɵ���酑��쁵��ͅ���́�����ѕ�ѥ�������������Օ����х���́��ѕɹ�́���������ɵ�������������������х̸(������́�����ѕ�ѥ������ɕ����Ʌ����х����́���ɕѽ́����ɕ��������Ѽ���ѽ��ѥ���������ѕ́������Ʌ���(��1����Ё���ͽԁ��ɕٽ��ȁѽ��́�͕́��Օ́�ѥم́������ф�(���Ʌ������������́���������́����Ʉ���������������͹��������م酵��Ѽ����ɕ���������������ͼ�����٥�����ɕ���ͽ́�����ٕ����ȸ(�����ͼ���ѹ������ɑ�ԁ�ɥ٥�����́����͍ɥф����ᕍ��������ɽѥ��́������͍���I1L����ѥ�Մ��������������ɥ�������(��<���ѥ��������ɥ����������ə������ͽԁ���ͅȁ�͕�ɍ�}��ѡ��م饼������������͕ȁ�������������A$�((�����ش���̃�P�Aɽї�����������́٥��ٕ�́�������ٕ�����((��UI1́��́���եٽ́����ɽ��ѽ͇́�Ʌ���������������鉱��������Ʌ�����Ʌ��́��Ʉ���ɽ�Ս�}����̀���ɽѕ�������ȁI1L���Ʉ������������Ʌ��ȁ��������ͼ��ѥټ�(��=́���́����́������եټ�������ѕ�ѕ́��Ʌ���ɕ͕�م��́���х������ɥم����������չ���ɥ��������ɑ�ԁ�Յ��Օȁ��ɵ��������������Ʉ��������ٕ����ȸ(��U����ѥ������ѕɹ����������Ք�����Ʌ́�ɥ��Օ́�ԁ����Օ́ٽ�ѕ�����Ʌمȁ�����եټ����х������鉱����(����ɽ�Ս�̀����Ʉ��������������Ʉ������́��յ�����ф��������ф�������չ�͕́��Ʌ̰��٥х��������ͧ����������х�������م́���չ�̸(��A%́����������Ѽ��������������Ʌ�������ٽ�ٕȁ���ͅ���́��ѕɹ�́����������ԁ͕�٧��́��ѕɹ�́�����ٕ����ȸ(������������������ѕ�ЁM���ɥ��A�������Ʉ�ɕ��ɥ���ȁ͍ɥ��̰������Օ̰���ɵճ�ɥ�̰�����ѽ́���������ɇ��������������(