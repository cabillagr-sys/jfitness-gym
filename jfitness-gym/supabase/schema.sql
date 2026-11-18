-- JFitness Gym Management System - database schema
-- Run this whole file in Supabase -> SQL Editor -> New query -> Run.
-- If you already created your own tables, compare names/columns with this file
-- and adjust the app code or this schema so they match.

create extension if not exists "pgcrypto";

-- 1. Staff / admin accounts (linked to Supabase Auth) -------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

-- Every registered account is automatically saved to profiles
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- 2. Gym members ---------------------------------------------------------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  emergency_contact text,
  created_at timestamptz not null default now()
);

-- 3. Membership plans (session_limit NULL = unlimited sessions) ------------------
create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  duration_days int not null check (duration_days > 0),
  session_limit int check (session_limit is null or session_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Memberships (a member's purchased plan) ---------------------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid not null references membership_plans(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  sessions_remaining int,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  created_at timestamptz not null default now()
);

-- 5. Attendance / check-ins ---------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  membership_id uuid references memberships(id) on delete set null,
  checked_in_at timestamptz not null default now()
);

-- 6. Payments (used for the daily sales report) ---------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  membership_id uuid references memberships(id) on delete set null,
  amount numeric(10,2) not null check (amount >= 0),
  method text not null default 'cash',
  notes text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references profiles(id) on delete set null
);

create index if not exists idx_attendance_checked_in on attendance(checked_in_at);
create index if not exists idx_payments_paid_at on payments(paid_at);
create index if not exists idx_memberships_member on memberships(member_id);

-- 7. Automation: member check-in (validates + deducts a session) ---------------------
create or replace function checkin_member(p_member_id uuid) returns json
language plpgsql as $$
declare
  m memberships%rowtype;
  today date := (now() at time zone 'Asia/Manila')::date;
  already int;
begin
  select * into m from memberships
   where member_id = p_member_id
     and status = 'active'
     and start_date <= today
     and end_date >= today
     and (sessions_remaining is null or sessions_remaining > 0)
   order by end_date desc
   limit 1;

  if not found then
    return json_build_object('ok', false,
      'message', 'No valid membership: it may be expired, out of sessions, or not yet started.');
  end if;

  select count(*) into already from attendance
   where member_id = p_member_id
     and (checked_in_at at time zone 'Asia/Manila')::date = today;
  if already > 0 then
    return json_build_object('ok', false, 'message', 'This member already checked in today.');
  end if;

  insert into attendance (member_id, membership_id) values (p_member_id, m.id);

  if m.sessions_remaining is not null then
    update memberships set sessions_remaining = sessions_remaining - 1 where id = m.id;
    if m.sessions_remaining - 1 = 0 then
      update memberships set status = 'expired' where id = m.id;
    end if;
  end if;

  return json_build_object('ok', true,
    'message', 'Check-in successful.',
    'sessions_remaining', case when m.sessions_remaining is null then null else m.sessions_remaining - 1 end);
end; $$;

-- 8. Automation: mark memberships whose end date has passed as expired -----------------
create or replace function expire_memberships() returns void
language sql as $$
  update memberships set status = 'expired'
   where status = 'active'
     and end_date < (now() at time zone 'Asia/Manila')::date;
$$;

-- 9. Row Level Security: only logged-in users can touch the data ----------------------
alter table profiles enable row level security;
alter table members enable row level security;
alter table membership_plans enable row level security;
alter table memberships enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;

drop policy if exists "profiles read own" on profiles;
create policy "profiles read own" on profiles for select to authenticated using (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array['members','membership_plans','memberships','attendance','payments'] loop
    execute format('drop policy if exists "authenticated access" on %I', t);
    execute format('create policy "authenticated access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 10. Sample plans so the app is usable right away -------------------------------------
insert into membership_plans (name, price, duration_days, session_limit)
select * from (values
  ('Walk-in (1 session)', 100.00, 1, 1),
  ('Monthly Unlimited', 800.00, 30, null),
  ('12-Session Pass', 1000.00, 60, 12)
) as v(name, price, duration_days, session_limit)
where not exists (select 1 from membership_plans);
