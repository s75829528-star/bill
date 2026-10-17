-- Generated, repository-derived schema snapshot.
-- Source: supabase/schema_ai_conversations.sql
-- Repository evidence only; live Supabase definitions remain unverified.

-- schema_ai_conversations.sql
-- Database persistence schema for Nexora AI Copilot
-- Conversations and messages with Row-Level Security (RLS) tenant isolation.

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  structured_data jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_ai_conversations_business on public.ai_conversations(business_id, updated_at desc);
create index if not exists idx_ai_messages_conversation on public.ai_messages(conversation_id, created_at asc);

-- Row-Level Security (tenant isolation)
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- Only business owner can access conversations
drop policy if exists "Business owners can manage their conversations" on public.ai_conversations;
create policy "Business owners can manage their conversations"
  on public.ai_conversations
  for all
  using (
    exists (
      select 1 from public.business
      where id = ai_conversations.business_id
      and owner_id = auth.uid()
    )
  );

-- Only business owner can access messages belonging to their conversations
drop policy if exists "Business owners can manage their messages" on public.ai_messages;
create policy "Business owners can manage their messages"
  on public.ai_messages
  for all
  using (
    exists (
      select 1 from public.ai_conversations c
      join public.business b on b.id = c.business_id
      where c.id = ai_messages.conversation_id
      and b.owner_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at on ai_conversations
create or replace function public.update_ai_conversation_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_ai_conversation_updated on public.ai_conversations;
create trigger trigger_ai_conversation_updated
  before update on public.ai_conversations
  for each row
  execute function public.update_ai_conversation_timestamp();
