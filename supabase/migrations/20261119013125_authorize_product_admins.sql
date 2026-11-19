begin;

revoke insert, update, delete on public.products from anon;
grant insert, update, delete on public.products to authenticated;

create policy products_admin_insert on public.products
for insert to authenticated
with check ((select auth.jwt()) -> 'app_metadata' -> 'kiosk_admin' = 'true'::jsonb);

create policy products_admin_update on public.products
for update to authenticated
using ((select auth.jwt()) -> 'app_metadata' -> 'kiosk_admin' = 'true'::jsonb)
with check ((select auth.jwt()) -> 'app_metadata' -> 'kiosk_admin' = 'true'::jsonb);

create policy products_admin_delete on public.products
for delete to authenticated
using ((select auth.jwt()) -> 'app_metadata' -> 'kiosk_admin' = 'true'::jsonb);

commit;
