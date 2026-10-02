create table if not exists public.households (
    id uuid primary key,
    name varchar(100) not null,
    owner_user_id uuid not null,
    created_at timestamp with time zone not null
);
create table if not exists public.household_members (
    household_id uuid not null,
    user_id uuid not null,
    joined_at timestamp with time zone default current_timestamp,
    primary key (household_id, user_id),
    foreign key (household_id) references public.households(id)
);
