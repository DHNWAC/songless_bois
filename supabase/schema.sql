-- Profiles (auto-created on first sign in)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);


alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can view all profiles" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Daily challenges
create table if not exists public.daily_challenges (
  id uuid default gen_random_uuid() primary key,
  challenge_date date not null,
  genre text not null,
  spotify_track_id text not null,
  track_name text not null,
  artist_name text not null,
  preview_url text not null,
  created_at timestamptz default now() not null,
  unique (challenge_date, genre)
);

alter table public.daily_challenges enable row level security;

do $$ begin
  create policy "Anyone authenticated can view challenges" on public.daily_challenges for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Service role can insert challenges" on public.daily_challenges for insert with check (auth.role() = 'service_role');
exception when duplicate_object then null; end $$;

-- Game results
create table if not exists public.game_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  challenge_id uuid references public.daily_challenges(id) on delete cascade not null,
  guesses jsonb not null default '[]',
  solved boolean not null default false,
  attempts_used int not null default 0,
  time_taken_ms int,
  completed_at timestamptz default now() not null,
  unique (user_id, challenge_id)
);

alter table public.game_results enable row level security;

do $$ begin
  create policy "Users can view all results" on public.game_results for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own results" on public.game_results for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Fish scores (one best score per user per daily seed)
create table if not exists public.fish_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  seed integer not null,
  score integer not null,
  moves integer not null,
  time_ms integer not null,
  created_at timestamptz default now() not null,
  unique (user_id, seed)
);

alter table public.fish_scores enable row level security;

do $$ begin
  create policy "Anyone authenticated can view fish scores" on public.fish_scores for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own fish scores" on public.fish_scores for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own fish scores" on public.fish_scores for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
