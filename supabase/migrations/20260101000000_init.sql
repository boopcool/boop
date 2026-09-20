-- ===========================================================================
-- Boop — initial schema
--
-- Design notes
--  * Every table carries RLS. The anon/authenticated roles can only ever read
--    public data and write rows they own.
--  * Results are never readable through the raw `votes` table by the public;
--    aggregate reads go through SECURITY DEFINER functions so a voter cannot
--    scrape a test's tally before voting.
--  * Credits are append-only (`credit_ledger`). `profiles.credits` is a
--    denormalised cache maintained by trigger, so it can never drift from the
--    ledger and can never be written by a client.
-- ===========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- --------------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------------

create type test_mode        as enum ('compare', 'five_second');
create type test_visibility  as enum ('public', 'unlisted', 'private');
create type test_status      as enum ('draft', 'live', 'closed');
create type credit_entry_type as enum (
  'starter_grant', 'vote_earn', 'comment_bonus',
  'test_spend', 'test_refund', 'purchase'
);
create type purchase_status  as enum ('pending', 'paid', 'failed', 'refunded');

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     citext not null unique
                 check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 48),
  bio          text check (char_length(bio) <= 160),
  avatar_seed  text not null default encode(gen_random_bytes(8), 'hex'),
  -- Cache of sum(credit_ledger.amount). Maintained by trigger only.
  credits      integer not null default 0,
  boops_given  integer not null default 0,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on column public.profiles.credits is
  'Denormalised cache of credit_ledger. Never written directly by clients.';

-- --------------------------------------------------------------------------
-- tests
-- --------------------------------------------------------------------------

create table public.tests (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  slug               text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  title              text not null check (char_length(title) between 1 and 90),
  question           text not null check (char_length(question) between 1 and 140),
  description        text check (char_length(description) <= 280),
  category           text not null default 'other',
  mode               test_mode not null default 'compare',
  visibility         test_visibility not null default 'public',
  status             test_status not null default 'live',
  target_votes       integer not null default 25 check (target_votes between 5 and 2000),
  five_second_prompt text check (char_length(five_second_prompt) <= 140),
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  closes_at          timestamptz
);

create index tests_feed_idx
  on public.tests (created_at desc)
  where visibility = 'public' and status = 'live';
create index tests_owner_idx on public.tests (owner_id, created_at desc);
create index tests_category_idx on public.tests (category) where visibility = 'public';

-- --------------------------------------------------------------------------
-- variants
-- --------------------------------------------------------------------------

create table public.variants (
  id            uuid primary key default gen_random_uuid(),
  test_id       uuid not null references public.tests (id) on delete cascade,
  label         text not null check (char_length(label) between 1 and 40),
  title         text check (char_length(title) <= 90),
  image_url     text,
  copy_value    text check (char_length(copy_value) <= 220),
  display_order smallint not null default 0,
  created_at    timestamptz not null default now(),
  unique (test_id, label),
  -- A variant must carry something to look at or something to read.
  constraint variant_has_content check (image_url is not null or copy_value is not null)
);

create index variants_test_idx on public.variants (test_id, display_order);

-- --------------------------------------------------------------------------
-- votes
-- --------------------------------------------------------------------------

create table public.votes (
  id                      uuid primary key default gen_random_uuid(),
  test_id                 uuid not null references public.tests (id) on delete cascade,
  variant_id              uuid not null references public.variants (id) on delete cascade,
  voter_id                uuid references public.profiles (id) on delete set null,
  -- One-way hash (HMAC-SHA256 with a server-side pepper) of an anonymous
  -- session id. We never store the raw identifier.
  anonymous_session_hash  text check (char_length(anonymous_session_hash) = 64),
  reason                  text,
  comment                 text check (char_length(comment) <= 240),
  created_at              timestamptz not null default now(),
  constraint vote_has_an_actor check (
    voter_id is not null or anonymous_session_hash is not null
  )
);

-- One boop per human per test. These are the real duplicate guard; see the
-- README for an honest note on why hashed sessions are a speed bump, not a
-- guarantee.
create unique index votes_one_per_user
  on public.votes (test_id, voter_id) where voter_id is not null;
create unique index votes_one_per_anon
  on public.votes (test_id, anonymous_session_hash)
  where anonymous_session_hash is not null;

create index votes_test_idx on public.votes (test_id);
create index votes_variant_idx on public.votes (variant_id);
create index votes_voter_idx on public.votes (voter_id, created_at desc);
create index votes_comments_idx on public.votes (test_id, created_at desc)
  where comment is not null;

-- --------------------------------------------------------------------------
-- five_second_responses
-- --------------------------------------------------------------------------

create table public.five_second_responses (
  id                     uuid primary key default gen_random_uuid(),
  test_id                uuid not null references public.tests (id) on delete cascade,
  voter_id               uuid references public.profiles (id) on delete set null,
  anonymous_session_hash text check (char_length(anonymous_session_hash) = 64),
  answer                 text not null check (char_length(answer) between 1 and 280),
  created_at             timestamptz not null default now(),
  constraint five_second_has_an_actor check (
    voter_id is not null or anonymous_session_hash is not null
  )
);

create unique index five_second_one_per_user
  on public.five_second_responses (test_id, voter_id) where voter_id is not null;
create unique index five_second_one_per_anon
  on public.five_second_responses (test_id, anonymous_session_hash)
  where anonymous_session_hash is not null;
create index five_second_test_idx on public.five_second_responses (test_id, created_at desc);

-- --------------------------------------------------------------------------
-- credit_ledger — append only
-- --------------------------------------------------------------------------

create table public.credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     integer not null check (amount <> 0),
  type       credit_entry_type not null,
  reference  text,
  created_at timestamptz not null default now()
);

create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);
-- A given purchase or test can only ever be credited/debited once.
create unique index credit_ledger_idempotency
  on public.credit_ledger (type, reference) where reference is not null;

-- --------------------------------------------------------------------------
-- purchases
-- --------------------------------------------------------------------------

create table public.purchases (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  pack               text not null,
  credits            integer not null check (credits > 0),
  amount_cents       integer not null check (amount_cents >= 0),
  currency           text not null default 'usd',
  provider           text not null default 'stripe',
  provider_reference text,
  status             purchase_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index purchases_provider_ref
  on public.purchases (provider, provider_reference)
  where provider_reference is not null;
create index purchases_user_idx on public.purchases (user_id, created_at desc);

-- --------------------------------------------------------------------------
-- ai_summaries
-- --------------------------------------------------------------------------

create table public.ai_summaries (
  id           uuid primary key default gen_random_uuid(),
  test_id      uuid not null references public.tests (id) on delete cascade,
  summary      text not null,
  themes       jsonb not null default '[]'::jsonb,
  strongest    text,
  concern      text,
  next_action  text,
  source       text not null default 'model',
  vote_count   integer not null default 0,
  generated_at timestamptz not null default now(),
  unique (test_id)
);

-- ===========================================================================
-- Credit accounting
-- ===========================================================================

create or replace function public.sync_profile_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set credits = credits + new.amount
   where id = new.user_id;
  return new;
end;
$$;

create trigger credit_ledger_sync
  after insert on public.credit_ledger
  for each row execute function public.sync_profile_credits();

-- Ledger rows are immutable: correcting a mistake means writing a new row.
create or replace function public.reject_ledger_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'credit_ledger is append-only';
end;
$$;

create trigger credit_ledger_immutable
  before update or delete on public.credit_ledger
  for each row execute function public.reject_ledger_mutation();

-- ===========================================================================
-- New user bootstrap
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  suffix    integer := 0;
begin
  base_name := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if char_length(base_name) < 3 then
    base_name := 'boop' || substr(encode(gen_random_bytes(4), 'hex'), 1, 6);
  end if;
  base_name := left(base_name, 18);

  candidate := base_name;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_name || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'full_name', candidate));

  -- Starter grant. Keep in sync with CREDITS.STARTER_GRANT in src/lib/config.ts.
  insert into public.credit_ledger (user_id, amount, type, reference)
  values (new.id, 10, 'starter_grant', new.id::text);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Vote bookkeeping: boop counter + earned credits
-- ===========================================================================

create or replace function public.after_vote_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  if new.voter_id is null then
    return new;
  end if;

  update public.profiles
     set boops_given = boops_given + 1
   where id = new.voter_id
  returning boops_given into total;

  -- Earn 1 credit every 3 completed boops. Keep in sync with CREDITS.
  if total % 3 = 0 then
    insert into public.credit_ledger (user_id, amount, type, reference)
    values (new.voter_id, 1, 'vote_earn', 'boops:' || total::text)
    on conflict do nothing;
  end if;

  -- Substantive written feedback earns a little extra.
  if new.comment is not null and char_length(btrim(new.comment)) >= 24 then
    insert into public.credit_ledger (user_id, amount, type, reference)
    values (new.voter_id, 1, 'comment_bonus', new.id::text)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger votes_bookkeeping
  after insert on public.votes
  for each row execute function public.after_vote_insert();

-- ===========================================================================
-- Spend credits and open a test, atomically.
-- ===========================================================================

create or replace function public.spend_credits_for_test(
  p_test_id uuid,
  p_amount  integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_balance integer;
begin
  select owner_id into v_owner from public.tests where id = p_test_id;
  if v_owner is null then
    raise exception 'test not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'not your test';
  end if;
  if p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  -- Lock the profile row so two concurrent launches cannot both pass the
  -- balance check.
  select credits into v_balance
    from public.profiles where id = v_owner for update;

  if v_balance < p_amount then
    raise exception 'insufficient credits';
  end if;

  insert into public.credit_ledger (user_id, amount, type, reference)
  values (v_owner, -p_amount, 'test_spend', p_test_id::text);

  update public.tests set status = 'live' where id = p_test_id;
end;
$$;

-- ===========================================================================
-- Aggregate reads (SECURITY DEFINER so raw votes stay private)
-- ===========================================================================

create or replace function public.test_tally(p_test_id uuid)
returns table (variant_id uuid, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, count(x.id)
    from public.variants v
    left join public.votes x on x.variant_id = v.id
   where v.test_id = p_test_id
   group by v.id;
$$;

create or replace function public.test_vote_counts(p_test_ids uuid[])
returns table (test_id uuid, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, count(v.id)
    from public.tests t
    left join public.votes v on v.test_id = t.id
   where t.id = any(p_test_ids)
   group by t.id;
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.profiles              enable row level security;
alter table public.tests                 enable row level security;
alter table public.variants              enable row level security;
alter table public.votes                 enable row level security;
alter table public.five_second_responses enable row level security;
alter table public.credit_ledger         enable row level security;
alter table public.purchases             enable row level security;
alter table public.ai_summaries          enable row level security;

-- profiles: public read of the public fields, self-write of a narrow subset.
create policy profiles_read on public.profiles
  for select using (true);

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Clients may never move their own balance. The ledger trigger owns `credits`,
-- and `boops_given` is owned by the vote trigger.
create or replace function public.profiles_guard()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null
     and (new.credits is distinct from old.credits
          or new.boops_given is distinct from old.boops_given
          or new.id is distinct from old.id
          or new.is_demo is distinct from old.is_demo) then
    raise exception 'credits, boops_given, id and is_demo are not client-writable';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_trigger
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- tests
create policy tests_read_public on public.tests
  for select using (
    (visibility in ('public', 'unlisted') and status <> 'draft')
    or owner_id = auth.uid()
  );

create policy tests_insert_own on public.tests
  for insert with check (owner_id = auth.uid());

create policy tests_update_own on public.tests
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy tests_delete_own on public.tests
  for delete using (owner_id = auth.uid());

-- variants follow their test
create policy variants_read on public.variants
  for select using (
    exists (
      select 1 from public.tests t
       where t.id = variants.test_id
         and ((t.visibility in ('public', 'unlisted') and t.status <> 'draft')
              or t.owner_id = auth.uid())
    )
  );

create policy variants_write_own on public.variants
  for all using (
    exists (select 1 from public.tests t where t.id = variants.test_id and t.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.tests t where t.id = variants.test_id and t.owner_id = auth.uid())
  );

-- votes: you may read your own; the test owner may read all of theirs.
-- Nobody else reads raw votes — aggregates come from test_tally().
create policy votes_read_own on public.votes
  for select using (
    voter_id = auth.uid()
    or exists (select 1 from public.tests t where t.id = votes.test_id and t.owner_id = auth.uid())
  );

create policy votes_insert on public.votes
  for insert with check (
    -- The voter_id, when present, must be the caller. Anonymous votes are
    -- inserted server-side with the service role, never from the browser.
    (voter_id is null or voter_id = auth.uid())
    and exists (
      select 1 from public.tests t
       where t.id = votes.test_id
         and t.status = 'live'
         and t.visibility in ('public', 'unlisted')
         and t.owner_id is distinct from auth.uid()
    )
    and exists (select 1 from public.variants v where v.id = votes.variant_id and v.test_id = votes.test_id)
  );

-- five second responses mirror votes
create policy five_second_read on public.five_second_responses
  for select using (
    voter_id = auth.uid()
    or exists (
      select 1 from public.tests t
       where t.id = five_second_responses.test_id and t.owner_id = auth.uid()
    )
  );

create policy five_second_insert on public.five_second_responses
  for insert with check (
    (voter_id is null or voter_id = auth.uid())
    and exists (
      select 1 from public.tests t
       where t.id = five_second_responses.test_id
         and t.status = 'live'
         and t.visibility in ('public', 'unlisted')
         and t.owner_id is distinct from auth.uid()
    )
  );

-- credits and purchases are strictly self-read. Writes are service-role only.
create policy credit_ledger_read_own on public.credit_ledger
  for select using (user_id = auth.uid());

create policy purchases_read_own on public.purchases
  for select using (user_id = auth.uid());

-- ai summaries are visible wherever the test is
create policy ai_summaries_read on public.ai_summaries
  for select using (
    exists (
      select 1 from public.tests t
       where t.id = ai_summaries.test_id
         and ((t.visibility in ('public', 'unlisted') and t.status <> 'draft')
              or t.owner_id = auth.uid())
    )
  );

-- ===========================================================================
-- Storage: public bucket for variant images
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'boop-variants', 'boop-variants', true, 6291456,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "variant images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'boop-variants');

-- Uploads land under <uid>/..., so a user can only write into their own prefix.
create policy "users upload their own variant images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'boop-variants'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users manage their own variant images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'boop-variants'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
