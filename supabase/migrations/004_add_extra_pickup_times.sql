insert into time_slots (event_date, round, pickup_time, max_pizzas, current_pizzas) values
('13/06', 'Almoço', '13:30', 5, 0),
('13/06', 'Saída', '19:00', 5, 0),
('14/06', 'Almoço', '13:30', 5, 0),
('14/06', 'Saída', '19:00', 5, 0)
on conflict (event_date, round, pickup_time) do update set
  max_pizzas = greatest(time_slots.max_pizzas, excluded.max_pizzas);

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
  v_round_capacity integer;
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

  select coalesce(sum(current_pizzas), 0), coalesce(sum(max_pizzas), 0)
    into v_round_total, v_round_capacity
    from time_slots
    where event_date = p_event_date and round = p_round;

  if v_slot.current_pizzas + p_total_pizzas > v_slot.max_pizzas then
    raise exception 'Este horário acabou de esgotar. Escolha outro horário.';
  end if;

  if v_round_total + p_total_pizzas > v_round_capacity then
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
