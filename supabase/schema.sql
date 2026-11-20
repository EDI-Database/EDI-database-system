-- Employee Information Management System (EIMS)
-- Run this entire script in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'viewer' check (role in ('super_admin','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  full_name text not null,
  gender text,
  date_of_birth date,
  address text,
  email text,
  photo_url text,
  job_title text,
  employee_status text,
  date_hired date,
  job_level text,
  basic_salary numeric(14,2),
  de_minimis numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  contact_name text,
  contact_number text,
  address text,
  relationship text
);
create table if not exists public.government_details (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  sss_number text,
  philhealth_number text,
  pagibig_number text,
  tin_number text
);

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.government_details enable row level security;

-- Signed-in users can read employee records. Only super_admin can mutate them.
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "employees authenticated read" on public.employees;
create policy "employees authenticated read" on public.employees for select to authenticated using (true);
drop policy if exists "employees super admin insert" on public.employees;
create policy "employees super admin insert" on public.employees for insert to authenticated with check (public.current_user_role()='super_admin');
drop policy if exists "employees super admin update" on public.employees;
create policy "employees super admin update" on public.employees for update to authenticated using (public.current_user_role()='super_admin') with check (public.current_user_role()='super_admin');
drop policy if exists "employees super admin delete" on public.employees;
create policy "employees super admin delete" on public.employees for delete to authenticated using (public.current_user_role()='super_admin');

drop policy if exists "emergency authenticated read" on public.emergency_contacts;
create policy "emergency authenticated read" on public.emergency_contacts for select to authenticated using (true);
drop policy if exists "emergency super admin insert" on public.emergency_contacts;
create policy "emergency super admin insert" on public.emergency_contacts for insert to authenticated with check (public.current_user_role()='super_admin');
drop policy if exists "emergency super admin update" on public.emergency_contacts;
create policy "emergency super admin update" on public.emergency_contacts for update to authenticated using (public.current_user_role()='super_admin') with check (public.current_user_role()='super_admin');
drop policy if exists "emergency super admin delete" on public.emergency_contacts;
create policy "emergency super admin delete" on public.emergency_contacts for delete to authenticated using (public.current_user_role()='super_admin');

drop policy if exists "government authenticated read" on public.government_details;
create policy "government authenticated read" on public.government_details for select to authenticated using (true);
drop policy if exists "government super admin insert" on public.government_details;
create policy "government super admin insert" on public.government_details for insert to authenticated with check (public.current_user_role()='super_admin');
drop policy if exists "government super admin update" on public.government_details;
create policy "government super admin update" on public.government_details for update to authenticated using (public.current_user_role()='super_admin') with check (public.current_user_role()='super_admin');
drop policy if exists "government super admin delete" on public.government_details;
create policy "government super admin delete" on public.government_details for delete to authenticated using (public.current_user_role()='super_admin');

-- IMPORTANT: Create your first auth user in Supabase Dashboard > Authentication > Users.
-- Then replace the UUID and name below and run this insert ONCE to make that user Super Admin.
-- Never allow the browser to choose or change its own role.
-- insert into public.profiles (id, full_name, role)
-- values ('PASTE-FIRST-AUTH-USER-UUID-HERE', 'Your Name', 'super_admin');

-- Create profiles for any manually-created auth users as viewer, or use the Edge Function below.
