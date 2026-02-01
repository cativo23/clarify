-- Create configurations table
create table if not exists public.configurations (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.configurations enable row level security;

-- Policies for Admin access
-- Assuming 'admin' role is stored in user_metadata or app_metadata. 
-- Adjust logic based on exact auth implementation found in the project.
-- For now, we follow the pattern of checking user_metadata->>'role'.

create policy "Allow admins to read configurations" on public.configurations
  for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

create policy "Allow admins to update configurations" on public.configurations
  for update
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

create policy "Allow admins to insert configurations" on public.configurations
  for insert
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.configurations
for each row
execute procedure public.handle_updated_at();

-- Seed default configuration
insert into public.configurations (key, value, description)
values (
  'prompt_settings', 
  '{
    "promptVersion": "v1",
    "models": {
      "basic": "gpt-4o-mini",
      "premium": "gpt-4o"
    },
    "tokenLimits": {
      "basic": { "input": 8000, "output": 1500 },
      "premium": { "input": 12000, "output": 2500 }
    },
    "features": {
      "preprocessing": true,
      "tokenDebug": false
    }
  }'::jsonb,
  'Global settings for prompt versions, models, and token limits'
)
on conflict (key) do nothing;
