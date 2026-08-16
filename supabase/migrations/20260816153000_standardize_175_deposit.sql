alter table public.properties alter column security_deposit set default 175;
update public.properties set security_deposit = 175 where security_deposit <> 175;
