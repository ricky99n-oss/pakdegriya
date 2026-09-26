alter table public.scenes
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by property_id
      order by is_first_scene desc, created_at asc nulls last, id asc
    ) - 1 as rn
  from public.scenes
)
update public.scenes s
set sort_order = ranked.rn
from ranked
where s.id = ranked.id;

create index if not exists scenes_property_sort_order_idx
  on public.scenes(property_id, sort_order);
