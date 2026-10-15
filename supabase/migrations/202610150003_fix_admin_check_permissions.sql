create or replace function public.is_neon_breach_admin()
returns boolean
language sql
stable
security definer
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
