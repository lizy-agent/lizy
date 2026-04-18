// Thin client for LIZY MCP Server tool endpoints
const BASE = process.env.LIZY_API_URL ?? 'https://mcp.lizy.world';

async function call<T>(tool: string, walletAddress: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}/tools/${tool}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Wallet-Address': walletAddress,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json() as { ok: boolean; data?: T; error?: { message: string } };
  if (!json.ok) throw new Error(json.error?.message ?? 'LIZY error');
  return json.data as T;
}

export type TokenBalance = { symbol: string; balance: string; valueUsd: number | null };
export type WalletBalanceResult = { address: string; ethBalance: string; ethValueUsd: number | null; tokens: TokenBalance[] };
export type ActivityEvent = { blockNumber: number; txHash: string; type: string; from: string; to: string; value: string; timestamp: string };
export type TxResult = { hash: string; from: string; to: string | null; value: string; status: string; gasUsed: string; timestamp: string | null };
export type ReputationResult = { address: string; score: number; totalFeedback: number; breakdown: Record<string, number> };
export type IdentityResult = { address: string; tokenId: number | null; name: string | null; imageUrl: string | null };
export type PudgyResult = { address: string; isHolder: boolean; count: number };
export type TokenPriceResult = { tokenAddress: string; symbol: string; priceUsd: number; source: string };

export const lizy = {
  balance:    (w: string, address: string) => call<WalletBalanceResult>('get_wallet_balance', w, { address }),
  activity:   (w: string, address: string, blockRange = 200) => call<{ address: string; events: ActivityEvent[] }>('get_wallet_activity', w, { address, blockRange }),
  tx:         (w: string, txHash: string) => call<TxResult>('get_transaction', w, { txHash }),
  reputation: (w: string, address: string) => call<ReputationResult>('get_reputation_score', w, { address }),
  identity:   (w: string, address: string) => call<IdentityResult>('get_identity_data', w, { address }),
  pudgy:      (w: string, address: string) => call<PudgyResult>('verify_pudgy_holder', w, { address }),
  price:      (w: string, tokenAddress: string, chainId = 2741) => call<TokenPriceResult>('get_token_price', w, { tokenAddress, chainId }),
};
