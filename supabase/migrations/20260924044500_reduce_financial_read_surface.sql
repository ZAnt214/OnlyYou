-- RLS já restringe estas tabelas, mas contas anônimas não precisam
-- nem do privilégio base de leitura sobre dados financeiros/entitlements.
revoke select on table public.payment_confirmations from anon;
revoke select on table public.withdrawals from anon;
revoke select on table public.product_entitlements from anon;

-- Saques agora entram exclusivamente por request_withdrawal().
-- A policy antiga de INSERT direto não tem mais utilidade.
drop policy if exists creator_insert_own_withdrawals on public.withdrawals;
