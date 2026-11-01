-- Tokens — schema for saved and shared designs.

create extension if not exists pgcrypto;

create table if not exists public.designs (
  id          text primary key,                       -- short id, used directly in the URL
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  edit_token  uuid        not null default gen_random_uuid(),
  title       text        not null default 'Untitled',
  tokens      jsonb       not null,
  components  jsonb       not null,
  is_public   boolean     not null default true
);

alter table public.designs enable row level security;

-- Anonymous visitors may READ a public design and nothing else.
create policy "public designs are readable"
  on public.designs for select
  using (is_public);

-- Deliberately NO insert or update policy for anon.
-- Every write goes through /api/designs with the service role key, so the
-- anon key in the page source cannot be used to spray rows into the table.

-- edit_token is a secret: it must never travel with a public read. This view
-- is what the share page selects from.
create or replace view public.designs_public
  with (security_invoker = true)
  as select id, created_at, updated_at, title, tokens, components
     from public.designs
     where is_public;

grant select on public.designs_public to anon, authenticated;

create index if not exists designs_updated_at_idx on public.designs (updated_at desc);


-- ── Rate limiting ────────────────────────────────────────────────────
-- Vercel functions share no memory, so the counter has to live here.
-- Keys are HMACs of the client IP, never the address itself.

create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        integer     not null default 0
);

alter table public.rate_limits enable row level security;
-- No policies at all: only the service role touches this table.

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
    values (p_key, now(), 1)
  on conflict (key) do update
    set
      -- Expired window: start a fresh one. Otherwise increment in place.
      window_start = case
        when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
        else public.rate_limits.window_start
      end,
      count = case
        when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
        else public.rate_limits.count + 1
      end
  returning public.rate_limits.window_start, public.rate_limits.count
  into v_start, v_count;

  if v_count <= p_limit then
    return query select true, 0;
  else
    return query select
      false,
      greatest(
        1,
        ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds) - now())))::integer
      );
  end if;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

-- Housekeeping: old counters are dead weight.
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);
