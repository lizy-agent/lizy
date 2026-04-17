// ── Wallet & Auth ─────────────────────────────────────────────────────────────

export interface WalletContext {
  address: `0x${string}`;
  signature?: string;
  nonce?: string;
}

export interface AuthenticatedRequest {
  wallet: WalletContext;
  ipHash: string;
  apiKey?: string;
}

// ── Holder Perks ──────────────────────────────────────────────────────────────

export interface HolderPerks {
  isPenguHolder: boolean;
  isPudgyHolder: boolean;
  penguBalance: bigint;
  pudgyTokenIds: number[];
  quotaBonus: number;
  discountBps: number; // basis points, 5000 = 50%
}

export interface HolderPerksContext {
  perks: HolderPerks;
  checkedAt: number;
}

// ── Free Quota ────────────────────────────────────────────────────────────────

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  resetAt: number; // unix timestamp
}

// ── Tool Definitions ──────────────────────────────────────────────────────────

export type ToolName =
  | 'get_wallet_activity'
  | 'get_reputation_score'
  | 'get_identity_data'
  | 'get_pudgy_metadata'
  | 'verify_pudgy_holder'
  | 'get_token_price'
  | 'get_cross_chain_lookup'
  | 'transform_data';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  priceUsdc: number; // in micro-USDC (6 decimals)
  cacheTtlSeconds: number;
  inputSchema: Record<string, unknown>;
}

// ── Tool Inputs ───────────────────────────────────────────────────────────────

export interface GetWalletActivityInput {
  address: `0x${string}`;
  blockRange?: number; // default 1000
}

export interface GetReputationScoreInput {
  address: `0x${string}`;
}

export interface GetIdentityDataInput {
  address: `0x${string}`;
}

export interface GetPudgyMetadataInput {
  tokenId: number;
}

export interface VerifyPudgyHolderInput {
  address: `0x${string}`;
}

export interface GetTokenPriceInput {
  tokenAddress: `0x${string}`;
  chainId?: number; // default 2741 (Abstract)
  quoteToken?: `0x${string}`;
}

export interface GetCrossChainLookupInput {
  tokenAddress: `0x${string}`;
  sourceChainId: number;
  targetChainId: number;
}

export type TransformOperation = 'json_to_csv' | 'csv_to_json' | 'sha256' | 'keccak256' | 'validate_address' | 'validate_json';

export interface TransformDataInput {
  operation: TransformOperation;
  data: string;
  options?: Record<string, string | number | boolean>;
}

// ── Tool Outputs ──────────────────────────────────────────────────────────────

export interface LogEntry {
  blockNumber: number;
  transactionHash: `0x${string}`;
  address: `0x${string}`;
  topics: string[];
  data: string;
  logIndex: number;
}

export interface WalletActivityOutput {
  address: `0x${string}`;
  fromBlock: number;
  toBlock: number;
  logCount: number;
  logs: LogEntry[];
  cachedAt: number;
}

export interface ReputationScoreOutput {
  address: `0x${string}`;
  totalScore: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  recentFeedback: FeedbackEntry[];
  cachedAt: number;
}

export interface FeedbackEntry {
  from: `0x${string}`;
  score: number;
  comment: string;
  timestamp: number;
}

export interface IdentityDataOutput {
  address: `0x${string}`;
  tokenId?: number;
  tokenURI?: string;
  metadata?: Record<string, unknown>;
  hasIdentity: boolean;
  cachedAt: number;
}

export interface PudgyMetadataOutput {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  cachedAt: number;
}

export interface PudgyHolderVerificationOutput {
  address: `0x${string}`;
  isHolder: boolean;
  balance: number;
  tokenIds: number[];
  cachedAt: number;
}

export interface TokenPriceOutput {
  tokenAddress: `0x${string}`;
  chainId: number;
  priceUsd: number;
  priceInQuote: number;
  quoteToken: `0x${string}`;
  poolAddress?: `0x${string}`;
  liquidity?: string;
  cachedAt: number;
}

export interface CrossChainLookupOutput {
  sourceChainId: number;
  targetChainId: number;
  sourceAddress: `0x${string}`;
  targetAddress?: `0x${string}`;
  bridgeSupported: boolean;
  cachedAt: number;
}

export interface TransformDataOutput {
  operation: TransformOperation;
  result: string;
  valid?: boolean;
  error?: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export type PaymentMethod = 'x402' | 'mpp' | 'free_quota';

export interface PaymentContext {
  method: PaymentMethod;
  amount?: number;
  txHash?: `0x${string}`;
  sessionId?: string;
}

export interface MppSession {
  sessionId: string;
  walletAddress: `0x${string}`;
  balance: bigint;
  expiresAt: number;
}

// ── API Response ──────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
  meta: {
    tool: ToolName;
    cached: boolean;
    payment: PaymentMethod;
    quotaRemaining?: number;
    processingMs: number;
  };
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── MCP Protocol ──────────────────────────────────────────────────────────────

export interface McpToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpToolCallParams {
  name: ToolName;
  arguments: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// ── Supabase Table Types ──────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  wallet_address: string;
  terms_version: number;
  terms_agreed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface DbFreeQuota {
  id: string;
  wallet_address: string;
  date: string;
  used: number;
  limit: number;
  created_at: string;
  updated_at: string;
}

export interface DbToolCall {
  id: string;
  wallet_address: string;
  tool_name: ToolName;
  input_hash: string;
  payment_method: PaymentMethod;
  amount_usdc: number;
  cached: boolean;
  success: boolean;
  error_code: string | null;
  processing_ms: number;
  created_at: string;
}

export interface DbHolderPerks {
  id: string;
  wallet_address: string;
  is_pengu_holder: boolean;
  is_pudgy_holder: boolean;
  pengu_balance: string;
  pudgy_token_ids: number[];
  checked_at: string;
  expires_at: string;
}

export interface DbPayment {
  id: string;
  wallet_address: string;
  payment_method: PaymentMethod;
  amount_usdc: number;
  tx_hash: string | null;
  session_id: string | null;
  tool_name: ToolName | null;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

export interface DbMppSession {
  id: string;
  session_id: string;
  wallet_address: string;
  balance_usdc: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbTermsAgreement {
  id: string;
  wallet_address: string;
  version: number;
  ip_hash: string;
  agreed_at: string;
}

export interface DbToolDefinition {
  id: string;
  name: ToolName;
  description: string;
  price_usdc: number;
  cache_ttl_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMcpTelemetry {
  id: string;
  session_id: string | null;
  wallet_address: string | null;
  method: string;
  tool_name: ToolName | null;
  latency_ms: number;
  error_code: string | null;
  created_at: string;
}
