-- =====================================================================
-- PermiBook — Supabase schema (Postgres + Row Level Security)
-- Run this file in the Supabase SQL editor (free tier is enough).
-- Order: schema.sql first, then seed.sql.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'owner' check (role in ('super_admin', 'owner')),
  school_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial', '99', '199')),
  trial_ends_at timestamptz,
  payment_status text not null default 'trial'
    check (payment_status in ('paid', 'trial', 'unpaid', 'overdue')),
  paid_until timestamptz,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

-- profiles.school_id references schools(id) — added after schools exists
-- (circular reference: schools.owner_id -> profiles.id).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_school_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_school_id_fkey
      foreign key (school_id) references public.schools(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.instructors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  phone text not null,
  categories text[] not null default array['B'],
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  brand_model text not null,
  plate text not null,
  assurance_expiry date,
  visite_technique_expiry date,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  phone text not null,
  cin text not null default '',
  category text not null check (category in ('B', 'A', 'C')),
  price_total numeric(10, 2) not null default 0,
  paid_amount numeric(10, 2) not null default 0,
  status text not null default 'code'
    check (status in ('code', 'conduite', 'exam', 'licence')),
  instructor_id uuid references public.instructors(id) on delete set null,
  documents jsonb not null default
    '{"cin": false, "photos": false, "visite_medicale": false}'::jsonb,
  code_hours_done int not null default 0,
  driving_hours_done int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  instructor_id uuid references public.instructors(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  type text not null check (type in ('code', 'conduite')),
  date date not null,
  time time not null,
  duration_min int not null default 60,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'done', 'absent', 'cancelled')),
  created_at timestamptz not null default now()
);

-- No double-booking: one instructor / one vehicle per school/date/time
-- (cancelled lessons free the slot again).
create unique index if not exists lessons_unique_instructor_slot
  on public.lessons (school_id, instructor_id, date, time)
  where status <> 'cancelled' and instructor_id is not null;

create unique index if not exists lessons_unique_vehicle_slot
  on public.lessons (school_id, vehicle_id, date, time)
  where status <> 'cancelled' and vehicle_id is not null;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  type text not null check (type in ('code', 'conduite')),
  date date not null,
  location text not null default '',
  candidates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10, 2) not null,
  method text not null check (method in ('cash', 'transfer', 'cheque')),
  receipt_no text not null,
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists payments_school_receipt
  on public.payments (school_id, receipt_no);

create table if not exists public.settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  working_hours jsonb not null default
    '{"mon":["08:00","19:00"],"tue":["08:00","19:00"],"wed":["08:00","19:00"],"thu":["08:00","19:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb,
  language text not null default 'fr',
  prices jsonb not null default '{"B": 2500, "A": 1800, "C": 3500}'::jsonb
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index if not exists students_school_idx on public.students (school_id);
create index if not exists instructors_school_idx on public.instructors (school_id);
create index if not exists vehicles_school_idx on public.vehicles (school_id);
create index if not exists lessons_school_date_idx on public.lessons (school_id, date);
create index if not exists exams_school_date_idx on public.exams (school_id, date);
create index if not exists payments_school_idx on public.payments (school_id);
create index if not exists payments_student_idx on public.payments (student_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.students enable row level security;
alter table public.instructors enable row level security;
alter table public.vehicles enable row level security;
alter table public.lessons enable row level security;
alter table public.exams enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;

-- Security-definer helpers (bypass RLS internally, so policies can
-- check roles/ownership without recursion).
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.owns_school(p_school_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.schools
    where id = p_school_id and owner_id = auth.uid()
  );
$$;

-- --- profiles: a user sees/updates only their own row (super-admin sees all)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- --- schools: owners manage theirs; super-admin sees all
drop policy if exists "schools_owner_read" on public.schools;
create policy "schools_owner_read" on public.schools
  for select to authenticated
  using (owner_id = auth.uid() or public.is_super_admin());

drop policy if exists "schools_insert_owner" on public.schools;
create policy "schools_insert_owner" on public.schools
  for insert to authenticated
  with check (owner_id = auth.uid() or public.is_super_admin());

drop policy if exists "schools_update_owner" on public.schools;
create policy "schools_update_owner" on public.schools
  for update to authenticated
  using (owner_id = auth.uid() or public.is_super_admin());

-- --- school-scoped tables: owners + super-admin only
-- (No public/anonymous access: students never self-book, the school
-- manages everything. All writes go through API routes that verify
-- ownership and the suspension rule server-side.)

drop policy if exists "students_owner_all" on public.students;
create policy "students_owner_all" on public.students
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

drop policy if exists "instructors_owner_all" on public.instructors;
create policy "instructors_owner_all" on public.instructors
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

drop policy if exists "vehicles_owner_all" on public.vehicles;
create policy "vehicles_owner_all" on public.vehicles
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

drop policy if exists "lessons_owner_all" on public.lessons;
create policy "lessons_owner_all" on public.lessons
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

drop policy if exists "exams_owner_all" on public.exams;
create policy "exams_owner_all" on public.exams
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

drop policy if exists "payments_owner_all" on public.payments;
create policy "payments_owner_all" on public.payments
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

drop policy if exists "settings_owner_all" on public.settings;
create policy "settings_owner_all" on public.settings
  for all to authenticated
  using (public.owns_school(school_id) or public.is_super_admin())
  with check (public.owns_school(school_id) or public.is_super_admin());

-- Grants: authenticated users only. Anonymous visitors get nothing.
revoke all on public.profiles from anon;
revoke all on public.schools from anon;
revoke all on public.students from anon;
revoke all on public.instructors from anon;
revoke all on public.vehicles from anon;
revoke all on public.lessons from anon;
revoke all on public.exams from anon;
revoke all on public.payments from anon;
revoke all on public.settings from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.schools to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.instructors to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.exams to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.settings to authenticated;

-- Super-admin checks happen server-side (API routes verify the caller's
-- profile role with the service-role client). The service-role key is
-- NEVER exposed to the browser.
