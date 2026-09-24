-- Mantém as mesmas regras de acesso, mas evita reavaliar auth.uid()
-- para cada linha nas tabelas mais usadas pelo dashboard.

alter policy "payment_confirmations_select_own"
on public.payment_confirmations
using (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = creator_id
);

alter policy "creator_select_own_withdrawals"
on public.withdrawals
using (
  (select auth.uid()) = creator_id
  or public.is_admin()
);

alter policy "products_select_own"
on public.products
using ((select auth.uid()) = creator_id);

alter policy "products_select_entitled_buyer"
on public.products
using (
  exists (
    select 1
    from public.product_entitlements pe
    where pe.product_id = products.id
      and pe.buyer_id = (select auth.uid())
      and pe.status = 'active'
  )
);

alter policy "products_insert_own"
on public.products
with check ((select auth.uid()) = creator_id);

alter policy "products_update_own"
on public.products
using ((select auth.uid()) = creator_id)
with check ((select auth.uid()) = creator_id);

alter policy "products_delete_own"
on public.products
using ((select auth.uid()) = creator_id);

alter policy "product_orders_select_own"
on public.product_orders
using (
  buyer_id = (select auth.uid())
  or creator_id = (select auth.uid())
);

alter policy "product_orders_insert_own"
on public.product_orders
with check (buyer_id = (select auth.uid()));

alter policy "product_entitlements_select_own"
on public.product_entitlements
using (buyer_id = (select auth.uid()));
