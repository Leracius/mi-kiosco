-- Optional demo data. Prices and barcode associations are for testing only.
insert into public.products (id, name, price, barcode, category, presentation, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Coca-Cola Original', 1500.00, '7790895000997', 'Bebidas', '500 ml', now() - interval '0 seconds'),
  ('00000000-0000-4000-8000-000000000002', 'Agua mineral Villavicencio', 1000.00, null, 'Bebidas', '500 ml', now() - interval '1 seconds'),
  ('00000000-0000-4000-8000-000000000003', 'Alfajor Guaymallén', 800.00, null, 'Golosinas', 'Triple', now() - interval '2 seconds'),
  ('00000000-0000-4000-8000-000000000004', 'Papas Lay’s clásicas', 2200.00, null, 'Snacks', '95 g', now() - interval '3 seconds'),
  ('00000000-0000-4000-8000-000000000005', 'Chicle Beldent menta', 600.00, '96385074', 'Golosinas', '10 g', now() - interval '4 seconds'),
  ('00000000-0000-4000-8000-000000000006', 'Sprite lima-limón', 1500.00, null, 'Bebidas', '500 ml', now() - interval '5 seconds'),
  ('00000000-0000-4000-8000-000000000007', 'Fanta naranja', 1500.00, null, 'Bebidas', '500 ml', now() - interval '6 seconds'),
  ('00000000-0000-4000-8000-000000000008', 'Soda', 1850.50, null, 'Bebidas', '1,5 L', now() - interval '7 seconds'),
  ('00000000-0000-4000-8000-000000000009', 'Jugo de manzana', 950.00, null, 'Bebidas', '200 ml', now() - interval '8 seconds'),
  ('00000000-0000-4000-8000-000000000010', 'Galletitas Oreo Original', 2400.00, '7790310981214', 'Golosinas', '118 g', now() - interval '9 seconds'),
  ('00000000-0000-4000-8000-000000000011', 'Bon o Bon clásico', 700.00, null, 'Golosinas', '15 g', now() - interval '10 seconds'),
  ('00000000-0000-4000-8000-000000000012', 'Oblea Tita', 750.00, null, 'Golosinas', '18 g', now() - interval '11 seconds'),
  ('00000000-0000-4000-8000-000000000013', 'Bocadito Marroc', 850.00, null, 'Golosinas', '14 g', now() - interval '12 seconds'),
  ('00000000-0000-4000-8000-000000000014', 'Chocolate con almendras', 2500.00, null, 'Golosinas', '50 g', now() - interval '13 seconds'),
  ('00000000-0000-4000-8000-000000000015', 'Maní salado', 1700.00, null, 'Snacks', '80 g', now() - interval '14 seconds'),
  ('00000000-0000-4000-8000-000000000016', 'Palitos salados', 1400.00, '036000291452', 'Snacks', '80 g', now() - interval '15 seconds'),
  ('00000000-0000-4000-8000-000000000017', 'Pochoclo dulce', 1300.00, null, 'Snacks', '60 g', now() - interval '16 seconds'),
  ('00000000-0000-4000-8000-000000000018', 'Nachos con queso', 1900.00, null, 'Snacks', '85 g', now() - interval '17 seconds'),
  ('00000000-0000-4000-8000-000000000019', 'Grisines clásicos', 1550.00, null, 'Snacks', '120 g', now() - interval '18 seconds'),
  ('00000000-0000-4000-8000-000000000020', 'Bolsa reutilizable', 500.00, null, null, null, now() - interval '19 seconds')
on conflict do nothing;
