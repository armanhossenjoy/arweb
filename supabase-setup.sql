create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  category text not null check (category in ('graphic', 'laser')),
  description text not null check (char_length(description) between 1 and 1200),
  image_url text,
  tools text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (
    char_length(email) between 3 and 254
    and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  subject text not null check (char_length(subject) between 1 and 180),
  message text not null check (char_length(message) between 1 and 10000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Anyone can read published projects" on public.projects;
drop policy if exists "Authenticated users can read projects" on public.projects;
create policy "Anyone can read published projects"
  on public.projects for select to anon
  using (published);

create policy "Authenticated users can read projects"
  on public.projects for select to authenticated
  using (published or (select public.is_portfolio_admin()));

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
  on public.projects for insert to authenticated
  with check ((select public.is_portfolio_admin()));

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
  on public.projects for update to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects for delete to authenticated
  using ((select public.is_portfolio_admin()));

drop policy if exists "Visitors can send contact messages" on public.messages;
create policy "Visitors can send contact messages"
  on public.messages for insert to anon, authenticated
  with check (true);

drop policy if exists "Admins can read contact messages" on public.messages;
create policy "Admins can read contact messages"
  on public.messages for select to authenticated
  using ((select public.is_portfolio_admin()));

drop policy if exists "Admins can update contact messages" on public.messages;
create policy "Admins can update contact messages"
  on public.messages for update to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

drop policy if exists "Admins can delete contact messages" on public.messages;
create policy "Admins can delete contact messages"
  on public.messages for delete to authenticated
  using ((select public.is_portfolio_admin()));

grant select on public.admin_users to authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
revoke insert on public.messages from anon, authenticated;
grant insert (name, email, subject, message) on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;

insert into public.projects (id, title, category, description, image_url, tools, featured, published, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'Precision Footwear Pattern Cut', 'laser', 'CO2 laser machine optimization for synthetic leather cutting and pattern engraving.', 'img1.png', 'CO2 Laser · Vector AI', true, true, 1),
  ('10000000-0000-4000-8000-000000000002', 'Footwear Artwork & Vector Lineart', 'graphic', 'Detailed vector illustration and graphic design crafted for product branding and promotion.', 'img2.png', 'Adobe Illustrator', true, true, 2),
  ('10000000-0000-4000-8000-000000000003', 'Custom Acrylic LED Signboard', 'graphic', 'High-precision signage and acrylic fabrication designed for modern retail and branded spaces.', 'img3.png', 'Acrylic · Branding', false, true, 3),
  ('10000000-0000-4000-8000-000000000004', 'Luxury Monogram Brand Crest', 'laser', 'Custom monogram design and precision laser-cut branding for premium packaging and product finishing.', 'img3.jpg', 'Logo Design · Laser', false, true, 4)
on conflict (id) do nothing;
