create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null check (char_length(username) between 3 and 20 and username ~ '^[A-Za-z0-9_]+$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));
create table if not exists public.game_scores (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 score integer not null check (score between 0 and 1000000),
 difficulty text not null check (difficulty in ('facil','medio','avanzado')),
 missions_completed integer not null default 0 check (missions_completed between 0 and 5),
 duration_seconds integer not null check (duration_seconds between 0 and 86400),
 created_at timestamptz not null default now()
);
create index if not exists game_scores_created_at_score_idx on public.game_scores (created_at desc, score desc);
alter table public.profiles enable row level security;
alter table public.game_scores enable row level security;
drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Scores are publicly readable" on public.game_scores;
create policy "Scores are publicly readable" on public.game_scores for select using (true);
drop policy if exists "Users can submit scores for themselves" on public.game_scores;
create policy "Users can submit scores for themselves" on public.game_scores for insert to authenticated with check (auth.uid() = user_id);
create or replace function public.handle_new_neon_breach_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_username text;
begin
 requested_username := coalesce(new.raw_user_meta_data ->> 'username', 'Operador_' || left(new.id::text, 8));
 if char_length(requested_username) < 3 or char_length(requested_username) > 20 or requested_username !~ '^[A-Za-z0-9_]+$' then
  requested_username := 'Operador_' || left(new.id::text, 8);
 end if;
 insert into public.profiles (id, username) values (new.id, requested_username) on conflict (id) do nothing;
 return new;
end; $$;
drop trigger if exists on_neon_breach_auth_user_created on auth.users;
create trigger on_neon_breach_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_neon_breach_user();
grant select on public.profiles, public.game_scores to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert on public.game_scores to authenticated;
