alter table public.properties
  drop constraint if exists properties_hold_deposit_cents_check,
  add constraint properties_hold_deposit_cents_check
    check (hold_deposit_cents > 0 and hold_deposit_cents <= 1000000);

alter table public.room_holds
  drop constraint if exists room_holds_amount_cents_check,
  add constraint room_holds_amount_cents_check
    check (amount_cents > 0 and amount_cents <= 1000000);
