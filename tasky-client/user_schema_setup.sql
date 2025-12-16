-- ==========================================
-- Tasky User System Migration
-- Combined Setup: Profiles + Scalability Optimization
-- ==========================================

-- 1. Create Profiles Table (Comprehensive)
create table public.profiles (
    id uuid references auth.users not null primary key,
    email text,
    display_name text,
    avatar_url text,
    
    -- Status & Stats
    last_active_at timestamp with time zone default now(),
    subscription_tier text default 'free', -- 'free', 'pro', 'admin'
    settings jsonb default '{"theme": "system", "view_mode": "grid"}'::jsonb,
    
    -- Future-Proofing Fields
    stripe_customer_id text,          -- For payments later
    onboarding_completed boolean default false, -- Good for welcome flows
    total_storage_used bigint default 0, -- Track if they use too much space

    -- Metadata
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Security
alter table public.profiles enable row level security;

-- 3. RLS Policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using ( true );

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile"
    on public.profiles for update
    using ( auth.uid() = id );

-- 4. Auto-Handling Trigger for New Users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, display_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Bind Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 5. "Live Stats" View (Admin Dashboard)
create or replace view public.admin_user_stats as
select 
    p.id,
    p.email,
    p.display_name,
    p.last_active_at,
    p.subscription_tier,
    p.stripe_customer_id,
    p.total_storage_used,
    count(distinct s.id) as sheets_count,
    count(distinct t.id) as tasks_count,
    p.created_at as joined_at
from public.profiles p
left join public.sheets s on s.user_id = p.id
left join public.tasks t on t.user_id = p.id
group by p.id, p.email, p.display_name, p.last_active_at, p.subscription_tier, p.stripe_customer_id, p.total_storage_used, p.created_at;

grant select on public.admin_user_stats to service_role;

-- 6. Backfill Existing Users
insert into public.profiles (id, email, display_name, avatar_url)
select 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- ==========================================
-- 7. SCALABILITY OPTIMIZATIONS (The "Million User" Fix)
-- ==========================================
-- Without these, the database gets slow as you grow.
-- These "Indexes" let the DB find a user's 50 notes instantly, 
-- even if there are 10 million notes total.

create index if not exists idx_sheets_user_id on public.sheets(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_sheet_id on public.tasks(sheet_id);

-- Also index the timestamps so sorting by "Most Recent" is instant
create index if not exists idx_sheets_updated_at on public.sheets(updated_at desc);
