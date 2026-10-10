-- Chạy trong Supabase SQL Editor; thay UUID trước khi chạy.
create table if not exists public.photo_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.photo_admins enable row level security;
revoke all on public.photo_admins from anon, authenticated;

create or replace function public.is_photo_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.photo_admins where user_id = auth.uid()); $$;
revoke all on function public.is_photo_admin() from public;
grant execute on function public.is_photo_admin() to authenticated;

-- Thay bằng UID tài khoản Duy đã tạo trong Authentication → Users.
insert into public.photo_admins(user_id) values ('00000000-0000-0000-0000-000000000000')
on conflict do nothing;

create table if not exists public.photo_ideas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  description text not null default '' check (length(description) <= 500),
  image_path text not null unique,
  created_at timestamptz not null default now()
);
alter table public.photo_ideas enable row level security;
revoke all on public.photo_ideas from anon, authenticated;
grant select on public.photo_ideas to authenticated;
grant all on public.photo_ideas to service_role;
drop policy if exists "Duy reads ideas" on public.photo_ideas;
create policy "Duy reads ideas" on public.photo_ideas for select to authenticated
using ((select public.is_photo_admin()));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('guest-photo-ideas', 'guest-photo-ideas', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Duy reads guest photos" on storage.objects;
create policy "Duy reads guest photos" on storage.objects for select to authenticated
using (bucket_id = 'guest-photo-ideas' and (select public.is_photo_admin()));
