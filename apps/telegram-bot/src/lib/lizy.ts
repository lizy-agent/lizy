// Thin client for LIZY MCP Server tool endpoints
import { buildX402Payment, X402Details } from './x402.js';

const BASE = process.env.LIZY_API_URL ?? 'https://mcp.lizy.world';

async function call<T>(tool: string, walletAddress: string, body: object, privateKey?: `0x${string}`): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Wallet-Address': walletAddress,
  };

  const res = await fetch(`${BASE}/tools/${tool}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 402 && privateKey) {
    const errJson = await res.json() as { ok: boolean; error?: { details?: { x402?: X402Details } } };
    const x402 = errJson.error?.details?.x402;
    if (!x402) throw new Error('Payment required but no payment details received');

    const paymentHeader = await buildX402Payment(privateKey, x402);

    const paid = await fetch(`${BASE}/tools/${tool}`, {
      method: 'POST',
      headers: { ...headers, 'X-Payment': paymentHeader },
      body: JSON.stringify(body),
    });

    if (!paid.ok && paid.status !== 200) {
      if (paid.status === 402) throw new Error('Insufficient USDC.e balance. Send USDC.e to your wallet to continue.');
      const errData = await paid.json() as { error?: { message?: string } };
      throw new Error(errData.error?.message ?? 'Payment failed');
    }

    const json = await paid.json() as { ok: boolean; data?: T; error?: { message: string } };
    if (!json.ok) throw new Error(json.error?.message ?? 'LIZY error');
    return json.data as T;
  }

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
  balance:    (w: string, pk: `0x${string}`, address: string) => call<WalletBalanceResult>('get_wallet_balance', w, { address }, pk),
  activity:   (w: string, pk: `0x${string}`, address: string, blockRange = 200) => call<{ address: string; events: ActivityEvent[] }>('get_wallet_activity', w, { address, blockRange }, pk),
  tx:         (w: string, pk: `0x${string}`, txHash: string) => call<TxResult>('get_transaction', w, { txHash }, pk),
  reputation: (w: string, pk: `0x${string}`, address: string) => call<ReputationResult>('get_reputation_score', w, { address }, pk),
  identity:   (w: string, pk: `0x${string}`, address: string) => call<IdentityResult>('get_identity_data', w, { address }, pk),
  pudgy:      (w: string, pk: `0x${string}`, address: string) => call<PudgyResult>('verify_pudgy_holder', w, { address }, pk),
  price:      (w: string, pk: `0x${string}`, tokenAddress: string, chainId = 2741) => call<TokenPriceResult>('get_token_price', w, { tokenAddress, chainId }, pk),
};
