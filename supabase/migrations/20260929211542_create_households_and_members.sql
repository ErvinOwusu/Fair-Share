-- Supabase Auth owns accounts; these tables store household data only.
create table public.households (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(btrim(name)) between 1 and 100),
    owner_user_id uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now()
);

create index households_owner_user_id_idx on public.households (owner_user_id);

create table public.household_members (
    household_id uuid not null references public.households(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);

-- Membership and invitation changes go through the authenticated backend.
-- These public-schema tables remain inaccessible to browser Data API roles.
alter table public.households enable row level security;
alter table public.household_members enable row level security;
revoke all on public.households from anon, authenticated;
revoke all on public.household_members from anon, authenticated;
