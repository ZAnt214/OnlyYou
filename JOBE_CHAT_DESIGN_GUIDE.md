# Guia de design reaproveitável — Chat do Jobê

> Fonte de referência para reaproveitar, em outras páginas do Jobê, as decisões visuais e de UX
> aprovadas durante o redesenho da conversa em 2026-09-23.
>
> Este documento complementa `CLAUDE.md`. Quando houver conflito, os tokens e regras globais de
> `CLAUDE.md` e `app/globals.css` continuam sendo a fonte técnica de verdade.

## 1. Direção visual que funcionou

O chat chegou ao visual aprovado seguindo estes princípios:

- **Visual quente, comercial e humano**: laranja vivo da marca, marfim de fundo, branco para
  superfícies de trabalho e carvão para elementos de maior peso visual.
- **Contraste forte sem excesso de cor**: o laranja é usado para ação, preço e pequenos destaques;
  o carvão é usado para âncoras visuais como cabeçalho, botão de ação e cards especiais.
- **Sem gradientes**.
- **Sem excesso de cards grandes**: se a informação pode ser uma linha, aviso compacto ou ação no
  compositor, não deve ocupar um painel inteiro.
- **Sem aparência de template/IA**: evitar títulos genéricos, blocos decorativos sem função,
  ilustrações artificiais e textos excessivamente explicativos.
- **Mobile primeiro**: toda decisão deve preservar o máximo possível de área útil da tela.
- **Hierarquia clara**: o usuário deve entender primeiro quem está falando, qual o estado do pedido
  e qual é a próxima ação possível.

## 2. Paleta e tokens

Nunca usar hex, RGB/HSL literais ou classes fixas do Tailwind. Sempre usar os tokens de
`app/globals.css`.

### Estrutura principal

- `--color-bg`: fundo geral quente/marfim.
- `--color-surface`: cards, caixas de conversa e formulários.
- `--color-surface-2`: avisos neutros, hover, divisores visuais e superfícies secundárias.
- `--color-border`: bordas e separadores.
- `--color-text`, `--color-text-muted`, `--color-text-subtle`: hierarquia textual.

### Marca e contraste

- `--color-accent`: laranja vivo para CTAs sólidos, preço, pontos de atenção e estado ativo.
- `--color-accent-hover`: hover do CTA.
- `--color-accent-soft`: usar com moderação; não transformar blocos inteiros em laranja-claro
  quando uma superfície neutra já resolve.
- `--color-accent-text`: laranja escuro para texto/ícone/borda sobre fundo claro.
- `--color-on-accent`: texto sobre o fundo laranja.
- `--color-contrast`: carvão para cabeçalhos, menus escuros e ações estruturais.
- `--color-on-contrast`: texto sobre carvão.

### Regra aprendida no chat

**Laranja não deve virar “fundo padrão” de toda informação importante.** Quando a ação já é
destacada pelo CTA laranja, o conteúdo ao redor pode continuar neutro. Isso reduz ruído visual.

Exemplo aprovado: na tela “Finalizar trabalho”, o bloco de confirmação é branco/neutro com borda;
o laranja fica no botão principal e no checkbox ativo.

## 3. Hierarquia visual aprovada

### Cabeçalho

Padrão que funcionou:

- fundo `--color-contrast`;
- texto principal `--color-on-contrast`;
- altura compacta;
- avatar pequeno;
- nome na primeira linha;
- serviço + status na segunda linha;
- avaliação só aparece quando realmente existir;
- nunca mostrar “Sem avaliações” ocupando espaço;
- menu `•••` transparente em repouso, com fundo apenas no hover.

O cabeçalho é uma **âncora visual**, não um painel informativo. Evitar encher com badges, botões
e textos extras.

## 4. Área principal / conteúdo

- A superfície principal deve ser `--color-surface`.
- O fundo externo pode usar `--color-surface-2` ou `--color-bg`.
- Manter bordas discretas e sombra leve.
- Evitar “card dentro de card” sem necessidade.
- Quando um bloco pode ser transformado em aviso pequeno no fluxo, preferir isso.

### Avisos de sistema

Padrão aprovado:

- centralizados;
- largura máxima próxima de 80%;
- fundo `--color-surface-2`;
- sem ícone quando o ícone não acrescenta informação;
- texto de 11–12px;
- uma frase curta.

Exemplos:
- proteção da conversa;
- prazo da entrega;
- pagamento confirmado;
- marco de pedido.

Esses avisos não devem competir visualmente com mensagens e CTAs.

## 5. Cards especiais

### Proposta

Card aprovado:

- fundo `--color-contrast`;
- texto claro;
- título e descrição sem caixas internas;
- status inline pequeno;
- preço em `--color-accent`;
- prazo/revisões em texto secundário;
- divisor fino e discreto;
- botão principal laranja;
- ações secundárias com contorno/texto claro;
- `max-w-sm` para não esticar demais em telas grandes.

Princípio reaproveitável: **um card importante pode ser escuro para criar uma pausa forte na
timeline**, mas só se ele realmente representa uma decisão ou objeto importante.

## 6. Compositor e ações rápidas

O compositor deve ser a área de ação mais fácil de alcançar no mobile.

Padrão aprovado:

- input central branco;
- botão de envio escuro;
- botão `+` escuro à esquerda;
- altura aproximada de 44px;
- bordas arredondadas;
- sem rótulos longos no mobile;
- input com no mínimo 16px no mobile para evitar zoom automático do navegador.

### Menu do “+”

Versão escolhida:

- fundo `--color-contrast`;
- sem ícones nas opções;
- duas opções simples;
- texto principal curto;
- descrição de uma linha;
- divisor discreto;
- “Finalizar entrega”/“Finalizar trabalho” em laranja para diferenciar a ação definitiva;
- `+` vira `×` enquanto o menu está aberto.

Estrutura atual:

- **Enviar arquivo**
  - “Mandar para revisão”
- **Finalizar entrega**
  - “Informar que o trabalho foi concluído”

Princípio reaproveitável: **ações relacionadas devem ficar agrupadas no mesmo ponto de entrada**.
Não esconder ação importante no menu `•••` se ela pertence ao fluxo principal do usuário.

## 7. Arquivo para revisão ≠ entrega final

Esta separação é uma regra de produto e também de UX.

### Enviar arquivo

Serve para:

- mandar versão parcial;
- pedir revisão;
- receber feedback;
- enviar referência;
- compartilhar arquivo durante a produção.

Isso **não muda o pedido para entregue**.

### Finalizar trabalho

Serve para informar formalmente que:

- o que foi combinado foi concluído;
- a etapa de produção terminou;
- o cliente deve revisar e confirmar o recebimento ou relatar problema.

Não exige novo arquivo se os arquivos necessários já foram enviados no chat.

Princípio reaproveitável: não misturar **compartilhar conteúdo** com **mudar estado do pedido**.

## 8. Tela “Finalizar trabalho”

Versão aprovada: confirmação em duas etapas, visual neutro.

### Conteúdo

Título:
- **Finalizar trabalho**

Texto:
- “Antes de finalizar, confirme que o serviço está realmente pronto para o cliente.”

Confirmações:

1. “Concluí tudo o que foi combinado na proposta.”
2. “Os arquivos necessários já foram enviados na conversa.”

Rodapé:
- informar que o cliente será avisado;
- ele poderá confirmar recebimento ou relatar problema.

CTA:
- **Confirmar conclusão**

### Regras visuais

- fundo branco/neutro;
- borda `--color-border`;
- **sem fundo laranja-claro atrás das confirmações**;
- checkbox nativo usando `accent-(--color-accent)`;
- CTA desabilitado até as duas confirmações serem marcadas;
- ação secundária simples: “Cancelar”.

Princípio reaproveitável: quando uma ação muda o estado de um pedido, usar **confirmação explícita
e curta**, não um formulário desnecessário.

## 9. Comportamento mobile / teclado

A conversa foi ajustada para se comportar como mensageiro mobile:

- cabeçalho permanece visível;
- compositor fica imediatamente acima do teclado;
- área de mensagens é quem rola;
- ao abrir o teclado, a última mensagem deve continuar ancorada próximo do compositor;
- usar `visualViewport.height` para responder ao teclado móvel;
- não reintroduzir `position: fixed` no compositor sem necessidade;
- ao mudar a altura visível, rolar a área de mensagens para o final;
- inputs/textareas devem usar `text-base` no mobile e podem reduzir para `sm:text-sm`.

Princípio reaproveitável: em mobile, **não fazer a página inteira “pular” ou aparentar zoom**
quando o teclado aparece.

## 10. Texto e linguagem

Tom aprovado:

- humano;
- direto;
- profissional;
- frases curtas;
- verbos claros;
- sem linguagem “corporativa de IA”;
- sem explicações repetitivas.

Preferir:
- “Enviar arquivo”
- “Mandar para revisão”
- “Finalizar trabalho”
- “Confirmar conclusão”
- “Voltar”
- “Cancelar”
- frases que soem como fala normal do dia a dia, principalmente em páginas públicas de perfil.

Evitar:
- “Prosseguir com a conclusão da entrega”
- “Realizar submissão do arquivo final”
- “Ecossistema”
- “vitrine” e outros termos genéricos de marketplace quando um texto mais direto puder dizer o que acontece;
- frases longas que repetem a função já indicada pelo botão.

## 11. O que evitar em outras páginas

Os problemas encontrados no chat viraram anti-padrões gerais:

- card grande para uma única ação;
- banner permanente consumindo altura;
- muitas cores competindo;
- cor de destaque atrás de tudo;
- ícones onde o texto já é autoexplicativo;
- badges grandes para estados simples;
- informações vazias como “Sem avaliações” ocupando espaço;
- menus importantes escondidos em `•••`;
- repetir a mesma informação em card, aviso e mensagem;
- componentes mudando de tamanho quando input recebe foco;
- texto menor que 16px em input mobile;
- várias caixas internas dentro de um card;
- descrições longas em ações simples.

## 12. Padrões para reaproveitar fora do chat

Ao redesenhar outras páginas do Jobê:

1. Definir uma única âncora visual forte por seção.
2. Usar carvão para estrutura e laranja para ação.
3. Usar branco/marfim como base predominante.
4. Transformar ações secundárias em controles compactos.
5. Evitar cards quando uma linha/lista resolve.
6. Mostrar dados apenas quando existirem.
7. Colocar a ação principal no ponto mais natural do fluxo.
8. Separar ação reversível de ação que muda estado.
9. Para ação definitiva, mostrar confirmação curta com consequências.
10. Testar primeiro em mobile e depois expandir para desktop.

## 13. Checklist visual antes de aprovar uma nova tela

- [ ] Está usando apenas tokens do design system?
- [ ] Há gradiente? Se sim, remover salvo decisão explícita.
- [ ] Existe algum card que poderia ser mais compacto?
- [ ] O laranja está sendo usado só onde realmente precisa de atenção?
- [ ] O carvão está criando hierarquia sem dominar a tela?
- [ ] Algum texto vazio/irrelevante está ocupando espaço?
- [ ] Alguma ação principal ficou escondida em menu secundário?
- [ ] Há ícones redundantes?
- [ ] O CTA é claro sem precisar ler um parágrafo?
- [ ] Inputs têm pelo menos 16px no mobile?
- [ ] O layout funciona com teclado aberto?
- [ ] A informação se repete em mais de um lugar?
- [ ] O texto parece escrito por uma pessoa, não por um template?
- [ ] A tela respeita `--color-bg`, `--color-surface`, `--color-contrast` e `--color-accent`?
- [ ] A alteração foi registrada em `AI_CHANGELOG.md`?

## 14. Arquivos de referência

- `app/globals.css` — tokens oficiais.
- `CLAUDE.md` — regras gerais do projeto.
- `components/ConversationView.tsx` — implementação viva dos padrões descritos aqui.
- `components/StatusBadge.tsx` — status inline/badge.
- `AI_CHANGELOG.md` — histórico das decisões e mudanças.

Este guia deve ser consultado antes de qualquer novo redesenho importante para manter consistência
visual entre chat, pedidos, páginas de serviço, perfil, produto, comunidade e demais áreas do Jobê.
