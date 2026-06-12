create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('salgada', 'doce', 'bebida', 'combo')),
  price numeric(10, 2) not null,
  description text not null,
  pizza_count integer not null default 0,
  active boolean not null default true
);

create table if not exists time_slots (
  id uuid primary key default gen_random_uuid(),
  event_date text not null,
  round text not null,
  pickup_time text not null,
  max_pizzas integer not null default 5,
  current_pizzas integer not null default 0,
  unique (event_date, round, pickup_time)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  whatsapp text not null,
  event_date text not null,
  round text not null,
  pickup_time text not null,
  items jsonb not null,
  total_pizzas integer not null,
  total_amount numeric(10, 2) not null,
  payment_status text not null default 'pendente' check (payment_status in ('pendente', 'pago', 'confirmado')),
  order_status text not null default 'recebido' check (order_status in ('recebido', 'em preparo', 'pronto', 'entregue', 'cancelado')),
  notes text,
  created_at timestamp default now()
);

create index if not exists orders_schedule_idx on orders (event_date, round, pickup_time);
create index if not exists orders_status_idx on orders (payment_status, order_status);

insert into products (id, name, category, price, description, pizza_count, active) values
('11111111-1111-4111-8111-111111111111', 'Calabresa', 'salgada', 35.00, 'Massa artesanal de longa fermentação natural, molho de tomate, muçarela, calabresa selecionada, cebola e orégano.', 1, true),
('22222222-2222-4222-8222-222222222222', 'Marguerita', 'salgada', 35.00, 'Massa artesanal de longa fermentação natural, molho de tomate, muçarela, tomate cereja, manjericão ou orégano e fio de azeite.', 1, true),
('33333333-3333-4333-8333-333333333333', 'Frango com Catupiry original', 'salgada', 40.00, 'Massa artesanal de longa fermentação natural, molho de tomate, muçarela, frango temperado e Catupiry original.', 1, true),
('44444444-4444-4444-8444-444444444444', 'Lombo canadense com Catupiry original', 'salgada', 40.00, 'Massa artesanal de longa fermentação natural, molho de tomate, muçarela, lombo canadense e Catupiry original.', 1, true),
('55555555-5555-4555-8555-555555555555', 'Bacon, brócolis e Catupiry original', 'salgada', 40.00, 'Massa artesanal de longa fermentação natural, molho de tomate, muçarela, bacon dourado, brócolis e Catupiry original.', 1, true),
('66666666-6666-4666-8666-666666666666', 'Vegetariana da Casa', 'salgada', 40.00, 'Massa artesanal de longa fermentação natural, molho de tomate, muçarela, tomate cereja, brócolis, milho, azeitona, orégano e fio de azeite.', 1, true),
('77777777-7777-4777-8777-777777777777', 'Brigadeiro artesanal', 'doce', 35.00, 'Massa artesanal de longa fermentação natural com brigadeiro artesanal da casa e raspas de chocolate.', 1, true),
('88888888-8888-4888-8888-888888888888', 'Doce de leite com banana e canela', 'doce', 35.00, 'Massa artesanal de longa fermentação natural, doce de leite cremoso, banana e toque de canela.', 1, true),
('d1111111-1111-4111-8111-111111111111', 'Coca-Cola lata', 'bebida', 6.00, 'Coca-Cola gelada em lata.', 0, true),
('d2222222-2222-4222-8222-222222222222', 'Coca-Cola Zero lata', 'bebida', 6.00, 'Coca-Cola Zero gelada em lata.', 0, true),
('d3333333-3333-4333-8333-333333333333', 'Pepsi lata', 'bebida', 6.00, 'Pepsi gelada em lata.', 0, true),
('d4444444-4444-4444-8444-444444444444', 'Guaraná Antarctica lata', 'bebida', 6.00, 'Guaraná Antarctica gelado em lata.', 0, true),
('d5555555-5555-4555-8555-555555555555', 'Fanta lata', 'bebida', 6.00, 'Fanta gelada em lata.', 0, true),
('d6666666-6666-4666-8666-666666666666', 'Coca-Cola 2L', 'bebida', 15.00, 'Coca-Cola 2 litros para compartilhar.', 0, true),
('d7777777-7777-4777-8777-777777777777', 'Coca-Cola Zero 2L', 'bebida', 15.00, 'Coca-Cola Zero 2 litros para compartilhar.', 0, true),
('d8888888-8888-4888-8888-888888888888', 'Guaraná Antarctica 2L', 'bebida', 15.00, 'Guaraná Antarctica 2 litros para compartilhar.', 0, true),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Combo Família', 'combo', 109.90, 'Inclui 3 pizzas salgadas. O cliente deve escolher 3 sabores salgados.', 3, true),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Combo Família Doce', 'combo', 139.90, 'Inclui 3 pizzas salgadas + 1 pizza doce. O cliente deve escolher 3 sabores salgados e 1 sabor doce.', 4, true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  description = excluded.description,
  pizza_count = excluded.pizza_count,
  active = excluded.active;

insert into time_slots (event_date, round, pickup_time, max_pizzas, current_pizzas) values
('13/06', 'Almoço', '12:00', 6, 0),
('13/06', 'Almoço', '12:15', 6, 0),
('13/06', 'Almoço', '12:30', 6, 0),
('13/06', 'Almoço', '12:45', 6, 0),
('13/06', 'Almoço', '13:00', 6, 0),
('13/06', 'Almoço', '13:15', 6, 0),
('13/06', 'Saída', '17:30', 6, 0),
('13/06', 'Saída', '17:45', 6, 0),
('13/06', 'Saída', '18:00', 6, 0),
('13/06', 'Saída', '18:15', 6, 0),
('13/06', 'Saída', '18:30', 6, 0),
('14/06', 'Almoço', '12:00', 6, 0),
('14/06', 'Almoço', '12:15', 6, 0),
('14/06', 'Almoço', '12:30', 6, 0),
('14/06', 'Almoço', '12:45', 6, 0),
('14/06', 'Almoço', '13:00', 6, 0),
('14/06', 'Almoço', '13:15', 6, 0),
('14/06', 'Saída', '17:30', 6, 0),
('14/06', 'Saída', '17:45', 6, 0),
('14/06', 'Saída', '18:00', 6, 0),
('14/06', 'Saída', '18:15', 6, 0),
('14/06', 'Saída', '18:30', 6, 0)
on conflict (event_date, round, pickup_time) do update set
  max_pizzas = excluded.max_pizzas,
  current_pizzas = excluded.current_pizzas;

create or replace function create_order_safely(
  p_customer_name text,
  p_whatsapp text,
  p_event_date text,
  p_round text,
  p_pickup_time text,
  p_items jsonb,
  p_total_pizzas integer,
  p_total_amount numeric,
  p_notes text default null
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot time_slots%rowtype;
  v_round_total integer;
  v_order_number text;
  v_order orders%rowtype;
begin
  if p_total_pizzas <= 0 then
    raise exception 'O pedido precisa ter pelo menos uma pizza.';
  end if;

  perform pg_advisory_xact_lock(hashtext('pizza-pre-venda-orders'));

  perform 1
    from time_slots
    where event_date = p_event_date and round = p_round
    for update;

  select *
    into v_slot
    from time_slots
    where event_date = p_event_date and round = p_round and pickup_time = p_pickup_time
    for update;

  if not found then
    raise exception 'Horário de retirada não encontrado.';
  end if;

  select coalesce(sum(current_pizzas), 0)
    into v_round_total
    from time_slots
    where event_date = p_event_date and round = p_round;

  if v_slot.current_pizzas + p_total_pizzas > v_slot.max_pizzas then
    raise exception 'Este horário acabou de esgotar. Escolha outro horário.';
  end if;

  if v_round_total + p_total_pizzas > (
    select coalesce(sum(max_pizzas), 0)
    from time_slots
    where event_date = p_event_date and round = p_round
  ) then
    raise exception 'Esta rodada acabou de esgotar. Escolha outra rodada.';
  end if;

  v_order_number := 'PED-' || lpad((select (count(*) + 1)::text from orders), 3, '0');

  insert into orders (
    order_number,
    customer_name,
    whatsapp,
    event_date,
    round,
    pickup_time,
    items,
    total_pizzas,
    total_amount,
    payment_status,
    order_status,
    notes
  ) values (
    v_order_number,
    p_customer_name,
    p_whatsapp,
    p_event_date,
    p_round,
    p_pickup_time,
    p_items,
    p_total_pizzas,
    p_total_amount,
    'pendente',
    'recebido',
    p_notes
  )
  returning * into v_order;

  update time_slots
    set current_pizzas = current_pizzas + p_total_pizzas
    where id = v_slot.id;

  return v_order;
end;
$$;
