-- ============================================================
-- V2i Personal AI — initial schema
-- Run in Supabase SQL editor, or via `supabase migration up`.
-- Every table has Row Level Security enabled with a policy that
-- restricts all access to auth.uid() = user_id (or id for profiles).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------------- profiles ----------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  v2i_id text,
  name text not null default 'User',
  avatar_url text,
  preferred_language text not null default 'hinglish'
    check (preferred_language in ('hindi','english','hinglish')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- ---------------- conversations ----------------
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations enable row level security;
create policy "conversations_all_own" on conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- messages ----------------
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;
create policy "messages_all_via_conversation" on messages for all
  using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- ---------------- projects ----------------
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning','active','paused','completed','archived')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  deadline timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects enable row level security;
create policy "projects_all_own" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- tasks ----------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date timestamptz,
  recurring_rule text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "tasks_all_own" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- reminders ----------------
create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  title text not null,
  remind_at timestamptz not null,
  recurring_rule text,
  status text not null default 'scheduled' check (status in ('scheduled','fired','dismissed','cancelled')),
  created_at timestamptz not null default now()
);

alter table reminders enable row level security;
create policy "reminders_all_own" on reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- files ----------------
create table if not exists files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  summary text,
  created_at timestamptz not null default now()
);

alter table files enable row level security;
create policy "files_all_own" on files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- activity_logs ----------------
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  tool text,
  status text not null check (status in ('success','failure','pending')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table activity_logs enable row level security;
create policy "activity_logs_all_own" on activity_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Activity logs are typically insert+select only from the client; if you want
-- to prevent edits/deletes entirely, replace the policy above with separate
-- select/insert policies and omit update/delete.

-- ---------------- ai_memory ----------------
create table if not exists ai_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('PROFILE','PREFERENCE','PROJECT','WORKFLOW','INSTRUCTION','CONTEXT')),
  key text not null,
  value text not null,
  source text not null default 'user_explicit' check (source in ('user_explicit','ai_inferred')),
  created_at timestamptz not null default now(),
  unique (user_id, category, key)
);

alter table ai_memory enable row level security;
create policy "ai_memory_all_own" on ai_memory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- connected_apps ----------------
create table if not exists connected_apps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app in ('v2i_id','v2i_voice','beginning_write','yuniverse')),
  status text not null default 'not_configured' check (status in ('connected','not_configured','error')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, app)
);

alter table connected_apps enable row level security;
create policy "connected_apps_all_own" on connected_apps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- permissions (per-user tool overrides) ----------------
create table if not exists permissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  override text not null check (override in ('force_confirm','disabled')),
  created_at timestamptz not null default now(),
  unique (user_id, tool_name)
);

alter table permissions enable row level security;
create policy "permissions_all_own" on permissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- voice_profiles ----------------
create table if not exists voice_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  provider_voice_id text not null,
  created_at timestamptz not null default now()
);

alter table voice_profiles enable row level security;
create policy "voice_profiles_all_own" on voice_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- ai_settings ----------------
create table if not exists ai_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_provider text not null default 'anthropic',
  stt_provider text not null default 'whisper',
  tts_provider text not null default 'elevenlabs',
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table ai_settings enable row level security;
create policy "ai_settings_all_own" on ai_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for file uploads (run once in Supabase Storage,
-- or via `supabase storage` CLI). Bucket name must match
-- src/services/filesService.ts's BUCKET constant ("user-files").
-- ============================================================
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do nothing;

create policy "user_files_select_own"
  on storage.objects for select
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_files_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_files_delete_own"
  on storage.objects for delete
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);


