-- O checkout cria pedidos por RPC. A tabela products permanece fechada para
-- leitura direta do comprador; a função lê apenas o produto solicitado,
-- valida auth.uid(), status publicado e impede compra do próprio produto.

alter function public.create_product_order(uuid) security definer;

revoke all on function public.create_product_order(uuid) from public, anon;
grant execute on function public.create_product_order(uuid) to authenticated;
