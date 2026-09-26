alter table public.users
  add column if not exists phone varchar(32);

alter table public.property_media
  add column if not exists is_public boolean not null default false;

update public.property_media
set is_public = true
where file_type in ('cover_public', 'intro_planet_public');

create index if not exists property_media_property_visibility_idx
  on public.property_media(property_id, is_public);

create index if not exists users_phone_idx
  on public.users(phone);
