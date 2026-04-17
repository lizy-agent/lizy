import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export async function upsertUser(walletAddress: string): Promise<void> {
  const sb = getSupabase();
  await sb
    .from('users')
    .upsert({ wallet_address: walletAddress.toLowerCase(), updated_at: new Date().toISOString() }, {
      onConflict: 'wallet_address',
      ignoreDuplicates: false,
    });
}

export async function getUserTermsVersion(walletAddress: string): Promise<number | null> {
  const sb = getSupabase();
  const { data } = await sb
    .from('users')
    .select('terms_version')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();
  return data?.terms_version ?? null;
}

export async function recordTermsAgreement(
  walletAddress: string,
  version: number,
  ipHash: string,
): Promise<void> {
  const sb = getSupabase();
  await sb.from('terms_agreements').insert({
    wallet_address: walletAddress.toLowerCase(),
    version,
    ip_hash: ipHash,
    agreed_at: new Date().toISOString(),
  });
  await sb
    .from('users')
    .upsert({
      wallet_address: walletAddress.toLowerCase(),
      terms_version: version,
      terms_agreed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' });
}

export async function logToolCall(params: {
  walletAddress: string;
  toolName: string;
  inputHash: string;
  paymentMethod: string;
  amountUsdc: number;
  cached: boolean;
  success: boolean;
  errorCode: string | null;
  processingMs: number;
}): Promise<void> {
  const sb = getSupabase();
  await sb.from('tool_calls').insert({
    wallet_address: params.walletAddress.toLowerCase(),
    tool_name: params.toolName,
    input_hash: params.inputHash,
    payment_method: params.paymentMethod,
    amount_usdc: params.amountUsdc,
    cached: params.cached,
    success: params.success,
    error_code: params.errorCode,
    processing_ms: params.processingMs,
    created_at: new Date().toISOString(),
  });
}

export async function logMcpTelemetry(params: {
  sessionId: string | null;
  walletAddress: string | null;
  method: string;
  toolName: string | null;
  latencyMs: number;
  errorCode: string | null;
}): Promise<void> {
  const sb = getSupabase();
  await sb.from('mcp_telemetry').insert({
    session_id: params.sessionId,
    wallet_address: params.walletAddress?.toLowerCase() ?? null,
    method: params.method,
    tool_name: params.toolName,
    latency_ms: params.latencyMs,
    error_code: params.errorCode,
    created_at: new Date().toISOString(),
  });
}

export async function getHolderPerksFromDb(walletAddress: string) {
  const sb = getSupabase();
  const { data } = await sb
    .from('holder_perks')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .gt('expires_at', new Date().toISOString())
    .single();
  return data;
}

export async function upsertHolderPerks(params: {
  walletAddress: string;
  isPenguHolder: boolean;
  isPudgyHolder: boolean;
  penguBalance: string;
  pudgyTokenIds: number[];
  expiresAt: string;
}): Promise<void> {
  const sb = getSupabase();
  await sb.from('holder_perks').upsert({
    wallet_address: params.walletAddress.toLowerCase(),
    is_pengu_holder: params.isPenguHolder,
    is_pudgy_holder: params.isPudgyHolder,
    pengu_balance: params.penguBalance,
    pudgy_token_ids: params.pudgyTokenIds,
    checked_at: new Date().toISOString(),
    expires_at: params.expiresAt,
  }, { onConflict: 'wallet_address' });
}

export async function getFreeQuota(walletAddress: string, date: string) {
  const sb = getSupabase();
  const { data } = await sb
    .from('free_quota')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('date', date)
    .single();
  return data;
}

export async function incrementFreeQuota(
  walletAddress: string,
  date: string,
  limit: number,
): Promise<{ used: number; limit: number }> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from('free_quota')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('date', date)
    .single();

  if (!existing) {
    await sb.from('free_quota').insert({
      wallet_address: walletAddress.toLowerCase(),
      date,
      used: 1,
      limit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { used: 1, limit };
  }

  const newUsed = existing.used + 1;
  await sb
    .from('free_quota')
    .update({ used: newUsed, updated_at: new Date().toISOString() })
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('date', date);

  return { used: newUsed, limit: existing.limit };
}
