# Oportunidades de serviço

Este documento descreve o fluxo em que uma pessoa publica o serviço que procura e profissionais
respondem pelo Jobê. Ele complementa o `AI_CHANGELOG.md` e deve ser mantido atualizado por qualquer
IA que alterar esta funcionalidade.

## Fluxo funcional

1. A pessoa autenticada acessa `/oportunidades/nova`, informa título, descrição, categoria e,
   opcionalmente, orçamento máximo e prazo desejado.
2. A publicação aparece em `/oportunidades` por até 30 dias. O autor acompanha e pode encerrá-la em
   `/oportunidades/minhas`.
3. Um profissional com perfil de criador ativo e verificado usa **Tenho interesse** e envia uma
   apresentação curta.
4. A resposta cria um `custom_request` em negociação, uma conversa e uma notificação para o autor.
   O profissional é levado ao fluxo já existente, onde envia proposta com valor e prazo.
5. Pagamento, entrega, confirmação e avaliação continuam usando o fluxo de pedidos personalizados;
   não existe um segundo sistema paralelo de contratação.

## Persistência e segurança

- Tabela pública: `public.service_requests`, com RLS ativa.
- Leitura anônima: somente publicações `open` e não expiradas.
- Escrita: somente usuário autenticado; autor controla apenas as próprias publicações.
- Vínculo: `custom_requests.source_service_request_id`, com índice único parcial por oportunidade e
  profissional para impedir respostas duplicadas.
- RPCs `security invoker`, todas com `search_path` vazio:
  - `create_service_request`
  - `close_service_request`
  - `express_service_request_interest`
- A RPC de interesse valida que o usuário não é o autor, possui perfil de criador ativo/verificado,
  que a publicação está aberta e vigente e que a mensagem tem entre 10 e 500 caracteres.
- Não há contador público de respostas: isso evita expor dados de negociação e elimina uma escrita
  cruzada desnecessária na publicação do comprador.

## Código da aplicação

- Tipos: `lib/types/service-request.ts` e vínculo adicional em `lib/types/custom-request.ts`.
- Acesso ao Supabase: `lib/supabase/serviceRequests.ts`.
- Publicação: `components/ServiceRequestPublisher.tsx`.
- Listagem e resposta: `components/ServiceRequestCard.tsx`.
- Rotas: `/oportunidades`, `/oportunidades/nova` e `/oportunidades/minhas`.
- Descoberta: link no cabeçalho, menu da conta e atalho na página inicial.

## Regras para alterações futuras

- Não criar propostas, pagamentos ou mensagens fora do fluxo de `custom_requests` existente.
- Não permitir resposta de comprador sem perfil profissional ativo e verificado.
- Manter filtros públicos limitados a dados não sensíveis; mensagens, propostas e valores
  negociados permanecem privados na conversa.
- Qualquer alteração de tabela, política ou função exige `get_advisors` de segurança após a
  migração e um teste real das RPCs dentro de transação com rollback.
