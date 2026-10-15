-- NEON BREACH: verified admin allowlist and score abuse guard.
-- This migration mirrors the protections applied to the Supabase project.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_allowlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by text not null default 'manual_project_owner_approval'
);
revoke all on private.admin_allowlist from public, anon, authenticated;

create or replace function public.is_neon_breach_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_allowlist a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_neon_breach_admin() from public, anon;
grant execute on function public.is_neon_breach_admin() to authenticated;

create table if not exists private.neon_breach_admin_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
revoke all on private.neon_breach_admin_emails from public, anon, authenticated;
insert into private.neon_breach_admin_emails (email)
values ('carlosdevep@gmail.com')
on conflict (email) do nothing;

create or replace function public.sync_neon_breach_admin_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and lower(coalesce(new.email, '')) in (
       select e.email from private.neon_breach_admin_emails e
     ) then
    insert into private.admin_allowlist (user_id, granted_by)
    values (new.id, 'verified_email_allowlist_trigger')
    on conflict (user_id) do nothing;
  else
    delete from private.admin_allowlist a where a.user_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_neon_breach_admin_allowlist() from public, anon, authenticated;
drop trigger if exists on_neon_breach_admin_allowlist_sync on auth.users;
create trigger on_neon_breach_admin_allowlist_sync
after insert or update of email, email_confirmed_at on auth.users
for each row execute function public.sync_neon_breach_admin_allowlist();

-- Clamp individual mission scores to the actual game score range.
alter table public.game_scores drop constraint if exists game_scores_score_check;
alter table public.game_scores
  add constraint game_scores_score_check check (score between 0 and 6000);

drop policy if exists "Users can submit scores for themselves" on public.game_scores;
create policy "Users can submit scores for themselves"
on public.game_scores for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and score between 0 and 6000
  and difficulty in ('facil','medio','avanzado')
  and missions_completed between 0 and 5
  and duration_seconds between 0 and 86400
);
revoke update, delete on public.game_scores from anon, authenticated;

create or replace function public.guard_neon_breach_score_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.game_scores s
  where s.user_id = new.user_id
    and s.created_at > now() - interval '1 hour';
  if recent_count >= 30 then
    raise exception 'Score submission limit reached. Try again later.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_neon_breach_score_rate() from public, anon, authenticated;
drop trigger if exists on_neon_breach_score_rate_guard on public.game_scores;
create trigger on_neon_breach_score_rate_guard
before insert on public.game_scores
for each row execute function public.guard_neon_breach_score_rate();
