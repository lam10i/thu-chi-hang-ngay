-- ============================================================
-- Schema cho app Sổ Chi Tiêu Hằng Ngày
-- Paste toàn bộ file này vào Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Bảng categories
create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories(user_id);

-- 2. Bảng transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  category_id text not null,
  note text,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_id_category_idx on public.transactions(user_id, category_id);

-- 3. Row Level Security (RLS) — user chỉ thấy/sửa data của chính mình
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Policies cho categories
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- Policies cho transactions
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- 4. Trigger seed danh mục mặc định khi user mới đăng ký
create or replace function public.handle_new_user_seed_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (id, user_id, name, icon, color) values
    ('an-uong', new.id, 'Ăn uống', 'UtensilsCrossed', '#f97316'),
    ('ca-phe', new.id, 'Cà phê', 'Coffee', '#a16207'),
    ('di-lai', new.id, 'Đi lại', 'Car', '#3b82f6'),
    ('mua-sam', new.id, 'Mua sắm', 'ShoppingBag', '#ec4899'),
    ('hoa-don', new.id, 'Hóa đơn', 'Receipt', '#6366f1'),
    ('giai-tri', new.id, 'Giải trí', 'Gamepad2', '#8b5cf6'),
    ('suc-khoe', new.id, 'Sức khỏe', 'HeartPulse', '#ef4444'),
    ('khac', new.id, 'Khác', 'Tag', '#64748b');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_seed_categories();
