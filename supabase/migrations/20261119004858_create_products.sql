create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  price numeric(12, 2) not null check (price >= 0 and price <> 'NaN'::numeric),
  barcode text check (barcode ~ '^([0-9]{8}|[0-9]{12}|[0-9]{13})$'),
  category text,
  presentation text,
  is_frequent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UPC-A and the same identifier represented as EAN-13 must not coexist.
create unique index products_barcode_unique on public.products (
  (case when length(barcode) = 13 and left(barcode, 1) = '0'
    then substr(barcode, 2) else barcode end)
) where barcode is not null;

create function public.set_product_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_product_updated_at();

revoke execute on function public.set_product_updated_at() from public, anon, authenticated;

alter table public.products enable row level security;
revoke all on table public.products from public, anon, authenticated;
grant select on table public.products to anon, authenticated;

create policy products_public_read on public.products
for select to anon, authenticated
using (true);
