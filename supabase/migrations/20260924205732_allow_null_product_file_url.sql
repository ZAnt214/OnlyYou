-- O arquivo entregue ao comprador vive em public.product_files.
-- products.file_url permanece apenas por compatibilidade com o schema legado
-- e precisa aceitar NULL para rascunhos e para não expor o arquivo na tabela pública.

alter table public.products
  alter column file_url drop not null;
