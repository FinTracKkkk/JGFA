-- ============================================================
-- Joseph Group FA Materials Issuance Register — Supabase Schema
-- Run this once in your Supabase project's SQL Editor
-- (Project: zpakjzbdqogjtpaqbcft, or a new project — your choice)
-- All tables are prefixed fa_ to stay isolated from PTWA/JGM/Inspections
-- ============================================================

-- 1. MASTER DATA -----------------------------------------------------------

create table if not exists fa_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists fa_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references fa_departments(id),
  responsible_first_aider text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists fa_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  role text not null default 'store_keeper' check (role in ('admin','store_keeper','viewer')),
  department_id uuid references fa_departments(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists fa_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'pcs',
  category text not null default 'Dressing' check (category in ('Dressing','Medication','PPE','Instrument','Equipment')),
  reorder_level numeric not null default 0,
  expiry_tracked boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. INVENTORY (STOCK-IN) ---------------------------------------------------

create table if not exists fa_stock_transactions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references fa_materials(id),
  qty numeric not null,
  batch_no text,
  expiry_date date,
  supplier text,
  date_received date not null default current_date,
  entered_by text not null,
  entered_by_id uuid references fa_users(id),
  voided boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. ISSUANCE (DISTRIBUTION) ------------------------------------------------

create table if not exists fa_issuances (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references fa_departments(id),
  location_id uuid references fa_locations(id),
  collected_by_name text not null,
  collected_by_id text,
  collected_by_designation text,
  issued_by text not null,
  issued_by_id uuid references fa_users(id),
  date date not null default current_date,
  remarks text,
  confirmed boolean not null default false,
  voided boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fa_issuance_items (
  id uuid primary key default gen_random_uuid(),
  issuance_id uuid not null references fa_issuances(id) on delete cascade,
  material_id uuid not null references fa_materials(id),
  qty_issued numeric not null,
  stock_remaining_after numeric,
  created_at timestamptz not null default now()
);

-- 4. PHASE 2 — MONTHLY CHECKLIST --------------------------------------------

create table if not exists fa_checklists (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references fa_locations(id),
  month text not null, -- 'YYYY-MM'
  checked_by text,
  signature text,
  created_at timestamptz not null default now()
);

create table if not exists fa_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references fa_checklists(id) on delete cascade,
  material_id uuid not null references fa_materials(id),
  required_qty numeric,
  available boolean,
  remarks text
);

-- 5. AUDIT LOG ---------------------------------------------------------------

create table if not exists fa_audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('edit','delete','void')),
  field_changed text,
  old_value text,
  new_value text,
  changed_by text not null,
  changed_at timestamptz not null default now()
);

-- 6. ENABLE ROW LEVEL SECURITY (open policy — PIN gate is app-level) --------
-- Since this app uses a fixed PIN rather than Supabase Auth, we allow
-- anon key read/write and enforce the PIN + role checks in the app itself.
-- If you want DB-level protection too, tighten these policies later.

alter table fa_departments enable row level security;
alter table fa_locations enable row level security;
alter table fa_users enable row level security;
alter table fa_materials enable row level security;
alter table fa_stock_transactions enable row level security;
alter table fa_issuances enable row level security;
alter table fa_issuance_items enable row level security;
alter table fa_checklists enable row level security;
alter table fa_checklist_items enable row level security;
alter table fa_audit_log enable row level security;

create policy "anon full access" on fa_departments for all using (true) with check (true);
create policy "anon full access" on fa_locations for all using (true) with check (true);
create policy "anon full access" on fa_users for all using (true) with check (true);
create policy "anon full access" on fa_materials for all using (true) with check (true);
create policy "anon full access" on fa_stock_transactions for all using (true) with check (true);
create policy "anon full access" on fa_issuances for all using (true) with check (true);
create policy "anon full access" on fa_issuance_items for all using (true) with check (true);
create policy "anon full access" on fa_checklists for all using (true) with check (true);
create policy "anon full access" on fa_checklist_items for all using (true) with check (true);
create policy "anon full access" on fa_audit_log for all using (true) with check (true);

-- 7. SEED DATA -----------------------------------------------------------

insert into fa_departments (name) values
  ('JAF1'), ('JAF2'), ('JAF3'), ('JIF1'), ('JIF2'), ('JIF5'),
  ('PROTO21'), ('GRAPHICS'), ('AS'), ('JDG'), ('JDM'), ('JPTS')
on conflict do nothing;

insert into fa_users (name, role) values
  ('HSE Manager', 'admin'),
  ('HSE', 'store_keeper')
on conflict do nothing;

insert into fa_materials (name, unit, category, reorder_level, expiry_tracked) values
  ('Adhesive Plaster', 'pcs', 'Dressing', 5, true),
  ('Ammonia Inhalant', 'pcs', 'Medication', 3, true),
  ('Betadine Ointment', 'pcs', 'Medication', 3, true),
  ('Betadine Solution', 'bottle', 'Medication', 3, true),
  ('Crepe Bandage', 'pcs', 'Dressing', 5, true),
  ('Calamine Lotion', 'bottle', 'Medication', 3, true),
  ('Cotton Roll Bandage', 'pcs', 'Dressing', 5, true),
  ('Cotton Bundle', 'pcs', 'Dressing', 3, true),
  ('Deep Heat Spray', 'pcs', 'Medication', 2, true),
  ('Depressing Pack', 'pcs', 'Dressing', 3, true),
  ('Disposable Gloves', 'pairs', 'PPE', 10, false),
  ('Eye Lotion', 'bottle', 'Medication', 3, true),
  ('Eye Drops', 'bottle', 'Medication', 3, true),
  ('Eye Pad', 'pcs', 'Dressing', 5, true),
  ('Gauze Pad', 'pcs', 'Dressing', 10, true),
  ('Plasters', 'pcs', 'Dressing', 10, true),
  ('Savoy Anti Septic Spray', 'pcs', 'Medication', 2, true),
  ('Surgical Blade', 'pcs', 'Instrument', 5, true),
  ('Triangular Bandage', 'pcs', 'Dressing', 5, true)
on conflict do nothing;

-- Done. After running, go to Project Settings -> API and copy your
-- Project URL + anon public key into config.js (SUPABASE_URL / SUPABASE_ANON_KEY).

-- ============================================================
-- MIGRATION — only run this if you already executed this script
-- once before (with the old sample departments) and need to swap
-- to the real department list without re-creating the whole table.
-- Safe to run multiple times.
-- ============================================================
-- delete only if unused (no locations or issuances reference them)
-- delete from fa_departments where name in ('Production','Warehouse','Maintenance','Site A','Site B','Admin Block')
--   and id not in (select department_id from fa_locations where department_id is not null)
--   and id not in (select department_id from fa_issuances where department_id is not null);
-- insert into fa_departments (name) values
--   ('JAF1'), ('JAF2'), ('JAF3'), ('JIF1'), ('JIF2'), ('JIF5'),
--   ('PROTO21'), ('GRAPHICS'), ('AS'), ('JDG'), ('JDM'), ('JPTS')
-- on conflict do nothing;
