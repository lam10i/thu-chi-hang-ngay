-- ============================================================
-- Migration 002: Bảng fixed_costs (chi phí cố định hằng tháng)
-- Paste vào Supabase Dashboard → SQL Editor → Run
-- ============================================================

create table if not exists public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount bigint not null check (amount > 0),
  category_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists fixed_costs_user_id_idx on public.fixed_costs(user_id);

alter table public.fixed_costs enable row level security;

drop policy if exists "fixed_costs_select_own" on public.fixed_costs;
create policy "fixed_costs_select_own" on public.fixed_costs
  for select using (auth.uid() = user_id);

drop policy if exists "fixed_costs_insert_own" on public.fixed_costs;
create policy "fixed_costs_insert_own" on public.fixed_costs
  for insert with check (auth.uid() = user_id);

drop policy if exists "fixed_costs_update_own" on public.fixed_costs;
create policy "fixed_costs_update_own" on public.fixed_costs
  for update using (auth.uid() = user_id);

drop policy if exists "fixed_costs_delete_own" on public.fixed_costs;
create policy "fixed_costs_delete_own" on public.fixed_costs
  for delete using (auth.uid() = user_id);
