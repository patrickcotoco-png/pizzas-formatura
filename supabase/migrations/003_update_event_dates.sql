delete from time_slots
where event_date in ('16/05', '17/05');

insert into time_slots (event_date, round, pickup_time, max_pizzas, current_pizzas) values
('13/06', 'Almoço', '12:00', 5, 0),
('13/06', 'Almoço', '12:15', 5, 0),
('13/06', 'Almoço', '12:30', 5, 0),
('13/06', 'Almoço', '12:45', 5, 0),
('13/06', 'Almoço', '13:00', 5, 0),
('13/06', 'Almoço', '13:15', 5, 0),
('13/06', 'Saída', '17:30', 5, 0),
('13/06', 'Saída', '17:45', 5, 0),
('13/06', 'Saída', '18:00', 5, 0),
('13/06', 'Saída', '18:15', 5, 0),
('13/06', 'Saída', '18:30', 5, 0),
('13/06', 'Saída', '18:45', 5, 0),
('14/06', 'Almoço', '12:00', 5, 0),
('14/06', 'Almoço', '12:15', 5, 0),
('14/06', 'Almoço', '12:30', 5, 0),
('14/06', 'Almoço', '12:45', 5, 0),
('14/06', 'Almoço', '13:00', 5, 0),
('14/06', 'Almoço', '13:15', 5, 0),
('14/06', 'Saída', '17:30', 5, 0),
('14/06', 'Saída', '17:45', 5, 0),
('14/06', 'Saída', '18:00', 5, 0),
('14/06', 'Saída', '18:15', 5, 0),
('14/06', 'Saída', '18:30', 5, 0),
('14/06', 'Saída', '18:45', 5, 0)
on conflict (event_date, round, pickup_time) do update set
  max_pizzas = excluded.max_pizzas,
  current_pizzas = excluded.current_pizzas;
