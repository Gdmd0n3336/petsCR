-- RLS smoke test. Run against a database that has the initial schema applied.
-- The block ends with a deliberate exception so that ALL test data is rolled back.
-- Expected result message:
--   RLS_TEST_RESULT a_sees_own_requests=1 a_sees_b_requests=0 a_messages=1 a_venues=1 b_sees_requests=1
--   anon_venues=1 anon_hidden=0 | insert_for_other_user=blocked forged_status=blocked hidden_venue=blocked
--   update_status=blocked read_line_links=blocked anon_requests=blocked
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  v uuid;
  vh uuid;
  a_sees int; a_sees_b int; a_msgs int; a_venues int; b_sees int;
  anon_venues int; anon_hidden int;
  ins_foreign text := 'blocked';
  ins_forged_status text := 'blocked';
  ins_hidden_venue text := 'blocked';
  upd_status text := 'blocked';
  read_line_links text := 'blocked';
  anon_requests text := 'blocked';
  tmp int;
begin
  insert into auth.users (id, aud, role, email)
    values (a, 'authenticated', 'authenticated', 'a@test.invalid'), (b, 'authenticated', 'authenticated', 'b@test.invalid');
  insert into public.users (id, telegram_id) values (a, 1001), (b, 1002);
  insert into public.venues (category, name_en, is_published) values ('vet_clinic', 'Test Published', true) returning id into v;
  insert into public.venues (category, name_en, is_published) values ('vet_clinic', 'Test Hidden', false) returning id into vh;
  insert into public.requests (user_id, venue_id, service) values (a, v, 'checkup'), (b, v, 'checkup');
  insert into public.messages (request_id, direction, text_ru) select id, 'client_to_venue', 'hi' from public.requests;
  insert into public.venue_line_links (venue_id, line_user_id) values (v, 'Utest');

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into a_sees from public.requests;
  select count(*) into a_sees_b from public.requests where user_id = b;
  select count(*) into a_msgs from public.messages;
  select count(*) into a_venues from public.venues;
  begin insert into public.requests (user_id, venue_id, service) values (b, v, 'x'); ins_foreign := 'ALLOWED'; exception when others then null; end;
  begin insert into public.requests (user_id, venue_id, service, status) values (a, v, 'x', 'booked'); ins_forged_status := 'ALLOWED'; exception when others then null; end;
  begin insert into public.requests (user_id, venue_id, service) values (a, vh, 'x'); ins_hidden_venue := 'ALLOWED'; exception when others then null; end;
  begin update public.requests set status = 'booked' where user_id = a; get diagnostics tmp = row_count; if tmp > 0 then upd_status := 'ALLOWED'; end if; exception when others then null; end;
  begin perform 1 from public.venue_line_links; read_line_links := 'ALLOWED'; exception when others then null; end;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into b_sees from public.requests;

  set local role anon;
  perform set_config('request.jwt.claims', '', true);
  select count(*) into anon_venues from public.venues;
  select count(*) into anon_hidden from public.venues where name_en = 'Test Hidden';
  begin perform 1 from public.requests; anon_requests := 'ALLOWED'; exception when others then null; end;

  raise exception 'RLS_TEST_RESULT a_sees_own_requests=% a_sees_b_requests=% a_messages=% a_venues=% b_sees_requests=% anon_venues=% anon_hidden=% | insert_for_other_user=% forged_status=% hidden_venue=% update_status=% read_line_links=% anon_requests=%',
    a_sees, a_sees_b, a_msgs, a_venues, b_sees, anon_venues, anon_hidden, ins_foreign, ins_forged_status, ins_hidden_venue, upd_status, read_line_links, anon_requests;
end
$$;
