-- Run once in the Supabase SQL Editor before enabling Hot Item / Nego.
-- Existing properties retain their current price and publication status.
begin;
alter table public.properties
  add column if not exists is_hot_item boolean not null default false,
  add column if not exists is_negotiable boolean not null default false;

create index if not exists properties_public_hot_item_idx
  on public.properties (is_hot_item desc, updated_at desc, id asc)
  where publish_status = 'published';
notify pgrst, 'reload schema';
commit;
