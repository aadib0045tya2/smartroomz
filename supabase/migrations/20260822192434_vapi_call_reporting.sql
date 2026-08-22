create table public.vapi_calls (
  id text primary key,
  assistant_id text,
  phone_number_id text,
  call_type text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  caller_number text,
  customer_name text,
  status text,
  ended_reason text,
  cost numeric(12,4) not null default 0 check (cost >= 0),
  raw_outcome text,
  reviewed_category text not null default 'other_unclear' check (
    reviewed_category in ('appointment_booked', 'not_interested', 'incomplete_technical', 'callback_requested', 'interested_not_booked', 'transferred', 'other_unclear')
  ),
  is_test boolean not null default false,
  appointment_booked boolean not null default false,
  appointment_requested boolean not null default false,
  appointment_date_text text,
  appointment_time_text text,
  interested boolean,
  callback_requested boolean not null default false,
  transferred_to_dossy boolean not null default false,
  summary text,
  transcript text,
  recording_url text,
  structured_data jsonb not null default '{}'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  source text not null default 'vapi' check (source = 'vapi'),
  vapi_created_at timestamptz,
  vapi_updated_at timestamptz,
  synced_at timestamptz not null default now()
);

create index vapi_calls_started_at_idx on public.vapi_calls(started_at desc);
create index vapi_calls_category_started_idx on public.vapi_calls(reviewed_category, started_at desc);
create index vapi_calls_caller_started_idx on public.vapi_calls(caller_number, started_at desc);
create index vapi_calls_client_metrics_idx on public.vapi_calls(started_at desc) where not is_test;

alter table public.vapi_calls enable row level security;

create policy vapi_calls_admin_read on public.vapi_calls
  for select to authenticated
  using ((select private.is_admin()));

revoke all on public.vapi_calls from anon, authenticated;
grant select on public.vapi_calls to authenticated;
