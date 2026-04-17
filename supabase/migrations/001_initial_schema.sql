-- LIZY Initial Schema
-- 10 tables + mcp_telemetry + RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. users ─────────────────────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null unique,
  terms_version integer default 0,
  terms_agreed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists users_wallet_address_idx on users(wallet_address);

alter table users enable row level security;

create policy "Users can read own record" on users
  for select using (true); -- wallet address is public info

create policy "Service role can insert/update" on users
  for all using (auth.role() = 'service_role');

-- ── 2. api_keys ──────────────────────────────────────────────────────────────
create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  key_hash text not null unique,
  name text not null default 'Default',
  is_active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists api_keys_key_hash_idx on api_keys(key_hash);
create index if not exists api_keys_user_id_idx on api_keys(user_id);

alter table api_keys enable row level security;

create policy "Service role manages api_keys" on api_keys
  for all using (auth.role() = 'service_role');

-- ── 3. free_quota ─────────────────────────────────────────────────────────────
create table if not exists free_quota (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  date date not null,
  used integer default 0,
  "limit" integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(wallet_address, date)
);

create index if not exists free_quota_wallet_date_idx on free_quota(wallet_address, date);

alter table free_quota enable row level security;

create policy "Service role manages free_quota" on free_quota
  for all using (auth.role() = 'service_role');

-- ── 4. tool_calls ─────────────────────────────────────────────────────────────
create table if not exists tool_calls (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  tool_name text not null,
  input_hash text not null,
  payment_method text not null check (payment_method in ('x402', 'mpp', 'free_quota')),
  amount_usdc numeric(12, 6) default 0,
  cached boolean default false,
  success boolean default true,
  error_code text,
  processing_ms integer,
  created_at timestamptz default now()
);

create index if not exists tool_calls_wallet_idx on tool_calls(wallet_address);
create index if not exists tool_calls_tool_name_idx on tool_calls(tool_name);
create index if not exists tool_calls_created_at_idx on tool_calls(created_at);

alter table tool_calls enable row level security;

create policy "Service role manages tool_calls" on tool_calls
  for all using (auth.role() = 'service_role');

-- ── 5. holder_perks ──────────────────────────────────────────────────────────
create table if not exists holder_perks (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null unique,
  is_pengu_holder boolean default false,
  is_pudgy_holder boolean default false,
  pengu_balance text default '0',
  pudgy_token_ids integer[] default '{}',
  checked_at timestamptz default now(),
  expires_at timestamptz not null
);

create index if not exists holder_perks_wallet_idx on holder_perks(wallet_address);
create index if not exists holder_perks_expires_at_idx on holder_perks(expires_at);

alter table holder_perks enable row level security;

create policy "Service role manages holder_perks" on holder_perks
  for all using (auth.role() = 'service_role');

-- ── 6. payments ───────────────────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  payment_method text not null check (payment_method in ('x402', 'mpp', 'free_quota')),
  amount_usdc numeric(12, 6) not null,
  tx_hash text,
  session_id text,
  tool_name text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  created_at timestamptz default now()
);

create index if not exists payments_wallet_idx on payments(wallet_address);
create index if not exists payments_tx_hash_idx on payments(tx_hash);
create index if not exists payments_created_at_idx on payments(created_at);

alter table payments enable row level security;

create policy "Service role manages payments" on payments
  for all using (auth.role() = 'service_role');

-- ── 7. mpp_sessions ───────────────────────────────────────────────────────────
create table if not exists mpp_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null unique,
  wallet_address text not null,
  balance_usdc text not null default '0',
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists mpp_sessions_session_id_idx on mpp_sessions(session_id);
create index if not exists mpp_sessions_wallet_idx on mpp_sessions(wallet_address);

alter table mpp_sessions enable row level security;

create policy "Service role manages mpp_sessions" on mpp_sessions
  for all using (auth.role() = 'service_role');

-- ── 8. terms_agreements ───────────────────────────────────────────────────────
create table if not exists terms_agreements (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text not null,
  version integer not null,
  ip_hash text not null,
  agreed_at timestamptz default now()
);

create index if not exists terms_agreements_wallet_idx on terms_agreements(wallet_address);

alter table terms_agreements enable row level security;

create policy "Service role manages terms_agreements" on terms_agreements
  for all using (auth.role() = 'service_role');

-- ── 9. tool_definitions ───────────────────────────────────────────────────────
create table if not exists tool_definitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text not null,
  price_usdc numeric(12, 6) not null,
  cache_ttl_seconds integer default 60,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tool_definitions enable row level security;

create policy "Anyone can read active tool_definitions" on tool_definitions
  for select using (is_active = true);

create policy "Service role manages tool_definitions" on tool_definitions
  for all using (auth.role() = 'service_role');

-- Seed tool definitions
insert into tool_definitions (name, description, price_usdc, cache_ttl_seconds) values
  ('get_wallet_activity', 'Fetch eth_getLogs for wallet (last 1000 blocks)', 0.005, 30),
  ('get_reputation_score', 'Read Reputation Registry summary and feedback', 0.003, 300),
  ('get_identity_data', 'Read Identity Registry tokenURI', 0.002, 600),
  ('get_pudgy_metadata', 'Pudgy Penguins tokenURI metadata (Ethereum)', 0.004, 3600),
  ('verify_pudgy_holder', 'Verify Pudgy Penguin ownership (Ethereum)', 0.002, 300),
  ('get_token_price', 'On-chain DEX price from Abstract Mainnet pool', 0.003, 60),
  ('get_cross_chain_lookup', 'Cross-chain token address lookup', 0.005, 300),
  ('transform_data', 'JSON↔CSV, sha256, keccak256, validate (CPU only)', 0.001, 0)
on conflict (name) do nothing;

-- ── 10. mcp_telemetry ──────────────────────────────────────────────────────────
create table if not exists mcp_telemetry (
  id uuid primary key default uuid_generate_v4(),
  session_id text,
  wallet_address text,
  method text not null,
  tool_name text,
  latency_ms integer,
  error_code text,
  created_at timestamptz default now()
);

create index if not exists mcp_telemetry_wallet_idx on mcp_telemetry(wallet_address);
create index if not exists mcp_telemetry_method_idx on mcp_telemetry(method);
create index if not exists mcp_telemetry_created_at_idx on mcp_telemetry(created_at);

alter table mcp_telemetry enable row level security;

create policy "Service role manages mcp_telemetry" on mcp_telemetry
  for all using (auth.role() = 'service_role');
