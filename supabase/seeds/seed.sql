insert into public.users (name, role, is_active, balance) values
  ('Max Mustermann', 'admin', true, 20.00),
  ('Anna Beispiel', 'mitglied', true, 10.00),
  ('Lukas Einsatz', 'mitglied', true, 0.00),
  ('Mia Jugendwartin', 'mitglied', true, 15.00);

insert into public.drinks (name, price, stock, icon, category) values
  ('Wasser', 1.00, 48, '💧', 'getraenk'),
  ('Cola', 1.50, 36, '🥤', 'getraenk'),
  ('Spezi', 1.50, 30, '🧃', 'getraenk'),
  ('Radler', 2.00, 24, '🍺', 'getraenk'),
  ('Kaffee', 0.80, 80, '☕', 'getraenk'),
  ('Bratwurst', 2.50, 20, '🌭', 'essen'),
  ('Chips', 1.20, 30, '🥔', 'essen');

insert into public.settings (key, value) values
  ('app', '{"name":"Getränkekasse","lowStockThreshold":12}');
