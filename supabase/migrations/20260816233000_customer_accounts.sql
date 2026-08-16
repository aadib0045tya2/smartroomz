alter table public.applications add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.call_requests add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.room_holds add column if not exists customer_id uuid references auth.users(id) on delete set null;

create unique index if not exists profiles_email_unique_lower on public.profiles (lower(email));
create index if not exists applications_customer_id_idx on public.applications(customer_id);
create index if not exists call_requests_customer_id_idx on public.call_requests(customer_id);
create index if not exists room_holds_customer_id_idx on public.room_holds(customer_id);

drop policy if exists call_requests_public_insert on public.call_requests;
revoke insert on public.call_requests from anon, authenticated;

create policy applications_customer_read on public.applications
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create policy call_requests_customer_read on public.call_requests
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create policy room_holds_customer_read on public.room_holds
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create policy payments_customer_read on public.payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_holds
      where room_holds.id = payments.hold_id
        and (
          room_holds.customer_id = (select auth.uid())
          or lower(room_holds.email) = lower((select auth.jwt() ->> 'email'))
        )
    )
  );
