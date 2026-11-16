-- =====================================================================
-- PermiBook — seed data (run AFTER supabase/schema.sql)
-- Demo school "Auto-École Atlas" (Casablanca) + super-admin's own school.
--
-- !!! NEVER insert users directly into auth.users with SQL !!!
-- A direct insert leaves token columns NULL where Supabase Auth expects
-- empty strings, and the login then fails with
-- "500: Database error querying schema". Always create users through
-- Dashboard -> Authentication -> Users (with "Auto Confirm User"
-- checked). The UUIDs below are the live Dashboard UUIDs (created
-- 2026-11-16) — do not change them unless the users are recreated:
--
--   DEMO_USER_UUID  (demo@permibook.ma)      = fdeb7b52-e3c2-47ff-9293-908668d2c159
--   ADMIN_USER_UUID (souhail@permibook.ma)   = ec625146-6248-43b1-90cf-37579899bb6e
--
-- Demo accounts (passwords are temporary — change after first login):
--   Demo owner:      demo@permibook.ma / Demo1234
--   Super-admin:     souhail@permibook.ma / Admin1234
--   >>> CHANGE THE SUPER-ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN
--   (Settings -> change password). Admin1234 is temporary only.
--
-- Fixed UUIDs used below (stable, re-runnable):
--  School Atlas:      aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa
--  School Souhail:    bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb
--  Instructors:       e1111111-1111-4111-8111-111111111111 (Youssef El Amrani)
--                     e2222222-2222-4222-8222-222222222222 (Karim Bennis)
--                     e3333333-3333-4333-8333-333333333333 (Sara Idrissi)
--  Vehicles:          f1111111-1111-4111-8111-111111111111 (Dacia Logan)
--                     f2222222-2222-4222-8222-222222222222 (Renault Clio)
--                     f3333333-3333-4333-8333-333333333333 (Peugeot 208)
--  Students:          d1111111-... (Mehdi Rami)   d2222222-... (Salma Bennis)
--                     d3333333-... (Youssef El Fassi) d4444444-... (Sara Idrissi)
--                     d5555555-... (Omar Tazi)   d6666666-... (Karim Haddad)
--
-- Seed totals: 6 students, 3 instructors, 3 vehicles, 9 lessons,
-- 5 exams (3 upcoming + 2 past), 11 payments = 14 000 DH collected.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profiles (users must already exist — created via Dashboard)
-- ---------------------------------------------------------------------
-- NOTE: school_id stays NULL here — schools do not exist yet, and the
-- profiles.school_id FK would fail. It is set by the UPDATE after §2.
insert into public.profiles (id, email, role, school_id) values
  ('fdeb7b52-e3c2-47ff-9293-908668d2c159', 'demo@permibook.ma', 'owner', null),
  ('ec625146-6248-43b1-90cf-37579899bb6e', 'souhail@permibook.ma', 'super_admin', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Schools
-- ---------------------------------------------------------------------
insert into public.schools (
  id, slug, name, city, phone, whatsapp, owner_id,
  plan, trial_ends_at, payment_status, paid_until, status
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'auto-ecole-atlas', 'Auto-École Atlas', 'Casablanca', '0661234500', '0661234500',
    'fdeb7b52-e3c2-47ff-9293-908668d2c159',
    'trial', now() + interval '14 days', 'trial', null, 'active'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'auto-ecole-souhail', 'Auto-École Souhail', 'Casablanca', '0600000000', '0600000000',
    'ec625146-6248-43b1-90cf-37579899bb6e',
    '99', null, 'paid', now() + interval '30 days', 'active'
  )
on conflict (id) do nothing;

-- Now that schools exist, link profiles to their schools.
update public.profiles set school_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  where id = 'fdeb7b52-e3c2-47ff-9293-908668d2c159';
update public.profiles set school_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  where id = 'ec625146-6248-43b1-90cf-37579899bb6e';

-- ---------------------------------------------------------------------
-- 3. Instructors
-- ---------------------------------------------------------------------
insert into public.instructors (id, school_id, full_name, phone, categories) values
  ('e1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Youssef El Amrani', '0661234567', array['B']),
  ('e2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Karim Bennis', '0662345678', array['B', 'A']),
  ('e3333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Sara Idrissi', '0663456789', array['B'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. Vehicles (one assurance + one visite technique expiring soon,
--     so the alerts show up in the demo)
-- ---------------------------------------------------------------------
insert into public.vehicles (id, school_id, brand_model, plate, assurance_expiry, visite_technique_expiry) values
  ('f1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Dacia Logan', '12345 | أ | 34',
   CURRENT_DATE + interval '20 days', CURRENT_DATE + interval '90 days'),
  ('f2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Renault Clio', '67890 | أ | 12',
   CURRENT_DATE + interval '200 days', CURRENT_DATE + interval '15 days'),
  ('f3333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Peugeot 208', '54321 | ب | 7',
   CURRENT_DATE + interval '300 days', CURRENT_DATE + interval '180 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. Students (6) — paid_amount must match the payments below
-- ---------------------------------------------------------------------
insert into public.students (
  id, school_id, full_name, phone, cin, category,
  price_total, paid_amount, status, instructor_id,
  documents, code_hours_done, driving_hours_done
) values
  ('d1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Mehdi Rami', '0611111111', 'AB123456', 'B',
   2500, 1200, 'conduite', 'e2222222-2222-4222-8222-222222222222',
   '{"cin": true, "photos": true, "visite_medicale": true}'::jsonb, 10, 6),
  ('d2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Salma Bennis', '0622222222', 'CD234567', 'B',
   2500, 2500, 'exam', 'e1111111-1111-4111-8111-111111111111',
   '{"cin": true, "photos": true, "visite_medicale": true}'::jsonb, 12, 18),
  ('d3333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Youssef El Fassi', '0633333333', 'EF345678', 'B',
   2500, 2000, 'conduite', 'e1111111-1111-4111-8111-111111111111',
   '{"cin": true, "photos": true, "visite_medicale": false}'::jsonb, 8, 4),
  ('d4444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Sara Idrissi', '0644444444', 'GH456789', 'A',
   1800, 1800, 'exam', 'e2222222-2222-4222-8222-222222222222',
   '{"cin": true, "photos": true, "visite_medicale": true}'::jsonb, 10, 12),
  ('d5555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Omar Tazi', '0655555555', 'IJ567890', 'B',
   2500, 2500, 'exam', 'e3333333-3333-4333-8333-333333333333',
   '{"cin": true, "photos": true, "visite_medicale": true}'::jsonb, 12, 20),
  ('d6666666-6666-4666-8666-666666666666', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Karim Haddad', '0666666666', 'KL678901', 'C',
   4500, 4000, 'conduite', 'e3333333-3333-4333-8333-333333333333',
   '{"cin": true, "photos": false, "visite_medicale": true}'::jsonb, 6, 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6. Lessons (9) — today, this week, and two from yesterday
-- ---------------------------------------------------------------------
insert into public.lessons (
  id, school_id, student_id, instructor_id, vehicle_id,
  type, date, time, duration_min, status
) values
  -- Today
  ('71111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd2222222-2222-4222-8222-222222222222', 'e1111111-1111-4111-8111-111111111111',
   'f1111111-1111-4111-8111-111111111111', 'conduite', CURRENT_DATE, '09:00', 60, 'scheduled'),
  ('72222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
   'f2222222-2222-4222-8222-222222222222', 'conduite', CURRENT_DATE, '10:30', 60, 'scheduled'),
  ('73333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111',
   null, 'code', CURRENT_DATE, '14:00', 90, 'scheduled'),
  ('74444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd5555555-5555-4555-8555-555555555555', 'e3333333-3333-4333-8333-333333333333',
   'f3333333-3333-4333-8333-333333333333', 'conduite', CURRENT_DATE, '16:00', 60, 'scheduled'),
  -- Tomorrow
  ('75555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd2222222-2222-4222-8222-222222222222', 'e1111111-1111-4111-8111-111111111111',
   'f1111111-1111-4111-8111-111111111111', 'conduite', CURRENT_DATE + interval '1 day', '09:00', 60, 'scheduled'),
  ('76666666-6666-4666-8666-666666666666', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
   null, 'code', CURRENT_DATE + interval '1 day', '11:00', 90, 'scheduled'),
  -- In 2 days
  ('77777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd4444444-4444-4444-8444-444444444444', 'e2222222-2222-4222-8222-222222222222',
   'f2222222-2222-4222-8222-222222222222', 'conduite', CURRENT_DATE + interval '2 days', '10:00', 60, 'scheduled'),
  -- Yesterday
  ('78888888-8888-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd5555555-5555-4555-8555-555555555555', 'e3333333-3333-4333-8333-333333333333',
   'f3333333-3333-4333-8333-333333333333', 'conduite', CURRENT_DATE - interval '1 day', '15:00', 60, 'done'),
  ('79999999-9999-4999-8999-999999999999', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd3333333-3333-4333-8333-333333333333', 'e1111111-1111-4111-8111-111111111111',
   null, 'code', CURRENT_DATE - interval '1 day', '09:30', 90, 'absent')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 7. Exams (5) — 3 upcoming + 2 past with results
-- ---------------------------------------------------------------------
insert into public.exams (id, school_id, type, date, location, candidates) values
  ('81111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'code', CURRENT_DATE + interval '3 days', 'Centre d''examen Casablanca',
   '[{"student_id": "d1111111-1111-4111-8111-111111111111", "result": "pending"},
     {"student_id": "d3333333-3333-4333-8333-333333333333", "result": "pending"}]'::jsonb),
  ('82222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'conduite', CURRENT_DATE + interval '5 days', 'Centre d''examen Casablanca',
   '[{"student_id": "d2222222-2222-4222-8222-222222222222", "result": "pending"},
     {"student_id": "d5555555-5555-4555-8555-555555555555", "result": "pending"}]'::jsonb),
  ('83333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'code', CURRENT_DATE + interval '10 days', 'Centre d''examen Casablanca',
   '[{"student_id": "d4444444-4444-4444-8444-444444444444", "result": "pending"}]'::jsonb),
  ('84444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'code', CURRENT_DATE - interval '7 days', 'Centre d''examen Casablanca',
   '[{"student_id": "d2222222-2222-4222-8222-222222222222", "result": "passe"},
     {"student_id": "d5555555-5555-4555-8555-555555555555", "result": "passe"}]'::jsonb),
  ('85555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'conduite', CURRENT_DATE - interval '3 days', 'Centre d''examen Casablanca',
   '[{"student_id": "d4444444-4444-4444-8444-444444444444", "result": "passe"}]'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 8. Payments (11) — total 14 000 DH collected
--    Mehdi 700+500=1200 · Salma 1000+1500=2500 · Youssef 1000+1000=2000
--    Sara 1800 · Omar 1500+1000=2500 · Karim 2000+2000=4000
-- ---------------------------------------------------------------------
insert into public.payments (id, school_id, student_id, amount, method, receipt_no, date, note) values
  ('91111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd1111111-1111-4111-8111-111111111111', 700, 'cash', 'RC-0001', CURRENT_DATE - interval '20 days', 'Acompte'),
  ('92222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd1111111-1111-4111-8111-111111111111', 500, 'cash', 'RC-0002', CURRENT_DATE - interval '10 days', 'Tranche 2'),
  ('93333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd2222222-2222-4222-8222-222222222222', 1000, 'transfer', 'RC-0003', CURRENT_DATE - interval '25 days', 'Acompte'),
  ('94444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd2222222-2222-4222-8222-222222222222', 1500, 'cash', 'RC-0004', CURRENT_DATE - interval '5 days', 'Solde'),
  ('95555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd3333333-3333-4333-8333-333333333333', 1000, 'cash', 'RC-0005', CURRENT_DATE - interval '18 days', 'Acompte'),
  ('96666666-6666-4666-8666-666666666666', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd3333333-3333-4333-8333-333333333333', 1000, 'transfer', 'RC-0006', CURRENT_DATE - interval '8 days', 'Tranche 2'),
  ('97777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd4444444-4444-4444-8444-444444444444', 1800, 'cash', 'RC-0007', CURRENT_DATE - interval '15 days', 'Paiement complet'),
  ('98888888-8888-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd5555555-5555-4555-8555-555555555555', 1500, 'transfer', 'RC-0008', CURRENT_DATE - interval '22 days', 'Acompte'),
  ('99999999-9999-4999-8999-999999999999', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd5555555-5555-4555-8555-555555555555', 1000, 'cash', 'RC-0009', CURRENT_DATE - interval '4 days', 'Solde'),
  ('91010101-0101-4101-8101-010101010101', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd6666666-6666-4666-8666-666666666666', 2000, 'cash', 'RC-0010', CURRENT_DATE - interval '12 days', 'Acompte'),
  ('92020202-0202-4202-8202-020202020202', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'd6666666-6666-4666-8666-666666666666', 2000, 'transfer', 'RC-0011', CURRENT_DATE - interval '2 days', 'Tranche 2')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 9. Settings (working hours + formation prices)
-- ---------------------------------------------------------------------
insert into public.settings (school_id, working_hours, language, prices) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '{"mon":["08:00","19:00"],"tue":["08:00","19:00"],"wed":["08:00","19:00"],"thu":["08:00","19:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb,
   'fr', '{"B": 2500, "A": 1800, "C": 3500}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '{"mon":["08:00","19:00"],"tue":["08:00","19:00"],"wed":["08:00","19:00"],"thu":["08:00","19:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb,
   'fr', '{"B": 2500, "A": 1800, "C": 3500}'::jsonb)
on conflict (school_id) do nothing;
