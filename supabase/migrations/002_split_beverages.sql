update products
set active = false
where name in ('Refrigerante lata', 'Refrigerante 2L');

insert into products (id, name, category, price, description, pizza_count, active) values
('d1111111-1111-4111-8111-111111111111', 'Coca-Cola lata', 'bebida', 6.00, 'Coca-Cola gelada em lata.', 0, true),
('d2222222-2222-4222-8222-222222222222', 'Coca-Cola Zero lata', 'bebida', 6.00, 'Coca-Cola Zero gelada em lata.', 0, true),
('d3333333-3333-4333-8333-333333333333', 'Pepsi lata', 'bebida', 6.00, 'Pepsi gelada em lata.', 0, true),
('d4444444-4444-4444-8444-444444444444', 'Guaraná Antarctica lata', 'bebida', 6.00, 'Guaraná Antarctica gelado em lata.', 0, true),
('d5555555-5555-4555-8555-555555555555', 'Fanta lata', 'bebida', 6.00, 'Fanta gelada em lata.', 0, true),
('d6666666-6666-4666-8666-666666666666', 'Coca-Cola 2L', 'bebida', 15.00, 'Coca-Cola 2 litros para compartilhar.', 0, true),
('d7777777-7777-4777-8777-777777777777', 'Coca-Cola Zero 2L', 'bebida', 15.00, 'Coca-Cola Zero 2 litros para compartilhar.', 0, true),
('d8888888-8888-4888-8888-888888888888', 'Guaraná Antarctica 2L', 'bebida', 15.00, 'Guaraná Antarctica 2 litros para compartilhar.', 0, true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  description = excluded.description,
  pizza_count = excluded.pizza_count,
  active = excluded.active;
