/**
 * Pudgy Penguins NFT Metadata & Verification Tool
 *
 * Data sources: ONLY Ethereum Mainnet RPC eth_call to contract
 * 0xBd3531dA5CF5857e7CfAA92426877b022e612cf8
 * No scraping, no Portal API, no paid external APIs.
 */

import { z } from 'zod';
import { isAddress } from 'viem';
import { config } from '../config';
import { ethereumClient, ethereumClientFallback, withFallback } from '../lib/rpc';
import { cacheGet, cacheSet } from '../lib/redis';
import { PUDGY_PENGUINS_ABI } from '../lib/contracts';
import { PudgyHolderVerificationOutput } from '@lizy/types';

// ── Pricing ───────────────────────────────────────────────────────────────────
export const PRICES = {
  verify_pudgy_holder: 0.002,   // $0.002 USDC.e
} as const;

export const CACHE_TTL = {
  verify_pudgy_holder: 300,     // 5 minutes
} as const;

const PUDGY_ADDRESS = config.PUDGY_PENGUINS as `0x${string}`;

// ── Zod Schemas ───────────────────────────────────────────────────────────────
export const verifyPudgyHolderSchema = z.object({
  address: z.string().refine(isAddress, 'Invalid EVM address'),
});

// ── Tool: verify_pudgy_holder ─────────────────────────────────────────────────
export async function verifyPudgyHolder(
  input: z.infer<typeof verifyPudgyHolderSchema>,
): Promise<PudgyHolderVerificationOutput> {
  const address = input.address.toLowerCase() as `0x${string}`;
  const cacheKey = `tool:pudgy_holder:${address}`;

  const cached = await cacheGet<PudgyHolderVerificationOutput>(cacheKey);
  if (cached) return cached;

  // balanceOf via eth_call (Ethereum only)
  const balance = await withFallback(
    () => ethereumClient.readContract({
      address: PUDGY_ADDRESS,
      abi: PUDGY_PENGUINS_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
    () => ethereumClientFallback.readContract({
      address: PUDGY_ADDRESS,
      abi: PUDGY_PENGUINS_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
  ) as bigint;

  const balanceNum = Number(balance);
  let tokenIds: number[] = [];

  if (balanceNum > 0) {
    try {
      const ids = await withFallback(
        () => ethereumClient.readContract({
          address: PUDGY_ADDRESS,
          abi: PUDGY_PENGUINS_ABI,
          functionName: 'tokensOfOwner',
          args: [address],
        }),
        () => ethereumClientFallback.readContract({
          address: PUDGY_ADDRESS,
          abi: PUDGY_PENGUINS_ABI,
          functionName: 'tokensOfOwner',
          args: [address],
        }),
      ) as bigint[];
      tokenIds = ids.map(Number);
    } catch {
      tokenIds = [];
    }
  }

  const result: PudgyHolderVerificationOutput = {
    address,
    isHolder: balanceNum > 0,
    balance: balanceNum,
    tokenIds,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.verify_pudgy_holder);
  return result;
}
