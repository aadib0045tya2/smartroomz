create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.admin_allowlist (email)
values ('smartroomzusa@gmail.com')
on conflict do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case when exists (
      select 1 from public.admin_allowlist where email = lower(coalesce(new.email, ''))
    ) then 'admin' else 'customer' end
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.properties (
  id text primary key,
  title text not null,
  area text not null,
  city text not null,
  state text not null,
  zip text not null,
  images text[] not null default '{}',
  weekly_price numeric(10,2) not null check (weekly_price >= 0),
  biweekly_price numeric(10,2) not null check (biweekly_price >= 0),
  monthly_price numeric(10,2) not null check (monthly_price >= 0),
  hold_deposit_cents integer not null default 17500 check (hold_deposit_cents = 17500),
  security_deposit numeric(10,2) not null default 100 check (security_deposit >= 0),
  application_fee numeric(10,2) not null default 50 check (application_fee >= 0),
  room_type text not null default 'Private room',
  availability text not null default 'Available now',
  earliest_move_in_date date,
  amenities text[] not null default '{}',
  description text not null default '',
  rating numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  featured boolean not null default false,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status text not null default 'draft' check (status in ('draft', 'published', 'held', 'unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete set null,
  property_title text not null,
  applicant_name text not null,
  email text not null,
  phone text not null,
  room_preference text,
  move_in_date date,
  payment_plan text check (payment_plan in ('weekly', 'biweekly', 'monthly')),
  estimated_amount_cents integer check (estimated_amount_cents is null or estimated_amount_cents >= 0),
  message text,
  status text not null default 'submitted' check (status in ('submitted', 'contacted', 'qualified', 'payment', 'approved', 'moved_in', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.call_requests (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete set null,
  property_title text,
  name text not null,
  phone text not null,
  email text,
  move_in_date date,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_holds (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete set null,
  property_title text not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  amount_cents integer not null default 17500 check (amount_cents = 17500),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'canceled', 'expired')),
  active boolean not null default true,
  expires_at timestamptz not null default (now() + interval '20 minutes'),
  square_payment_id text unique,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index room_holds_one_active_per_property
  on public.room_holds (property_id) where active and property_id is not null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  hold_id uuid not null references public.room_holds(id) on delete restrict,
  square_payment_id text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  status text not null,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_property_id_idx on public.applications(property_id);
create index applications_status_created_idx on public.applications(status, created_at desc);
create index call_requests_property_id_idx on public.call_requests(property_id);
create index call_requests_status_created_idx on public.call_requests(status, created_at desc);
create index room_holds_property_id_idx on public.room_holds(property_id);
create index room_holds_status_created_idx on public.room_holds(status, created_at desc);
create index payments_hold_id_idx on public.payments(hold_id);
create index properties_public_idx on public.properties(status, featured, area);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger properties_set_updated_at before update on public.properties for each row execute function private.set_updated_at();
create trigger applications_set_updated_at before update on public.applications for each row execute function private.set_updated_at();
create trigger call_requests_set_updated_at before update on public.call_requests for each row execute function private.set_updated_at();
create trigger room_holds_set_updated_at before update on public.room_holds for each row execute function private.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function private.set_updated_at();

alter table public.admin_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.applications enable row level security;
alter table public.call_requests enable row level security;
alter table public.room_holds enable row level security;
alter table public.payments enable row level security;

create policy admin_allowlist_admin_all on public.admin_allowlist
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy profiles_read_own on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_admin_update on public.profiles
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy properties_public_read on public.properties
  for select to anon, authenticated using (status = 'published' or (select private.is_admin()));
create policy properties_admin_insert on public.properties
  for insert to authenticated with check ((select private.is_admin()));
create policy properties_admin_update on public.properties
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy properties_admin_delete on public.properties
  for delete to authenticated using ((select private.is_admin()));

create policy applications_public_insert on public.applications
  for insert to anon, authenticated with check (status = 'submitted');
create policy applications_admin_read on public.applications
  for select to authenticated using ((select private.is_admin()));
create policy applications_admin_update on public.applications
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy applications_admin_delete on public.applications
  for delete to authenticated using ((select private.is_admin()));

create policy call_requests_public_insert on public.call_requests
  for insert to anon, authenticated with check (status = 'new');
create policy call_requests_admin_read on public.call_requests
  for select to authenticated using ((select private.is_admin()));
create policy call_requests_admin_update on public.call_requests
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy call_requests_admin_delete on public.call_requests
  for delete to authenticated using ((select private.is_admin()));

create policy room_holds_admin_all on public.room_holds
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy payments_admin_all on public.payments
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.properties to anon, authenticated;
grant insert on public.applications, public.call_requests to anon, authenticated;
grant select, insert, update, delete on public.properties, public.applications, public.call_requests, public.room_holds, public.payments to authenticated;
grant select on public.profiles, public.admin_allowlist to authenticated;
grant update (full_name) on public.profiles to authenticated;

insert into public.properties (
  id, title, area, city, state, zip, images, weekly_price, biweekly_price, monthly_price,
  security_deposit, application_fee, room_type, availability, earliest_move_in_date,
  amenities, description, rating, featured, latitude, longitude, status
) values
('midtown-howell-mill','Midtown Howell Mill','Midtown','Atlanta','GA','30318',array['/properties/property-1-1.webp','/properties/property-1-2.webp','/properties/property-1-3.webp'],250,500,1000,100,50,'Private room','Available now','2026-08-18',array['Furnished room','High-speed Wi-Fi','Washer & dryer','Shared kitchen','Utilities included','Keyless entry'],'A bright furnished private room near Howell Mill with flexible payments and comfortable shared spaces. Ideal for renters who want a simple application and a fast move-in.',4.9,true,33.786,-84.412,'published'),
('boulevard-midtown','Boulevard Midtown','Midtown','Atlanta','GA','30312',array['/properties/property-2-1.webp','/properties/property-2-2.webp','/properties/property-2-3.webp'],250,500,1000,100,50,'Private room','Fast move-in','2026-08-20',array['Fully furnished','Wi-Fi','Central air','Shared lounge','Flexible payments','Street parking'],'A conveniently located private room in a shared Smart Roomz home near Midtown Atlanta, with furnished common spaces and flexible stay options.',4.8,true,33.77,-84.371,'published'),
('santa-barbara','Santa Barbara Drive','Decatur','Decatur','GA','30032',array['/properties/property-3-1.webp','/properties/property-3-2.webp','/properties/property-3-3.webp'],163,325,650,100,50,'Private room','Available now','2026-08-17',array['Furnished room','Wi-Fi','Utilities included','Shared kitchen','On-site laundry','Quiet neighborhood'],'A value-focused furnished room in Decatur with flexible payment options, welcoming shared areas, and Smart Roomz member screening.',4.7,false,33.725,-84.283,'published'),
('mountain-view-pass','Mountain View Pass','Stone Mountain','Stone Mountain','GA','30087',array['/properties/property-4-1.webp','/properties/property-4-2.webp','/properties/property-4-3.webp'],194,388,776,100,50,'Private room','Available','2026-08-25',array['Furnished room','Wi-Fi','Backyard','Shared kitchen','Laundry access','Driveway parking'],'A furnished private room in Stone Mountain with relaxed shared spaces, practical home amenities, and flexible stay options.',4.8,false,33.77,-84.14,'published'),
('ormond-street','Ormond Street SW','Atlanta','Atlanta','GA','30315',array['/properties/property-5-1.webp','/properties/property-5-2.webp','/properties/property-5-3.webp'],200,400,800,100,50,'Private room','Ready to move in','2026-08-17',array['Furnished room','Wi-Fi','Utilities included','Shared kitchen','Central air','Transit nearby'],'A practical private room in Atlanta for renters who want a furnished stay and a faster alternative to a traditional apartment lease.',4.6,false,33.731,-84.395,'published'),
('ellenwood-suite','Ellenwood Traditional Suite','Ellenwood','Ellenwood','GA','30294',array['/properties/property-6-1.webp','/properties/property-6-2.webp','/properties/property-6-3.webp'],200,400,800,100,50,'Private suite','Fast move-in','2026-08-19',array['Private suite','Wi-Fi','Workspace','Shared kitchen','Laundry access','Off-street parking'],'A comfortable furnished suite in Ellenwood with flexible stay options, generous shared spaces, and a straightforward move-in process.',4.9,true,33.61,-84.28,'published')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy property_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'property-images' and (select private.is_admin()));
create policy property_images_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'property-images' and (select private.is_admin())) with check (bucket_id = 'property-images' and (select private.is_admin()));
create policy property_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'property-images' and (select private.is_admin()));
