update time_slots
set max_pizzas = 6
where event_date in ('13/06', '14/06')
  and round in ('Almoço', 'Saída')
  and pickup_time in (
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15',
    '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
  );

delete from time_slots
where event_date in ('13/06', '14/06')
  and (
    (round = 'Almoço' and pickup_time = '13:30')
    or (round = 'Saída' and pickup_time = '19:00')
    or (round = 'Saída' and pickup_time = '18:45')
  )
  and current_pizzas = 0;
