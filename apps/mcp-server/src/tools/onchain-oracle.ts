/**
 * Abstract On-Chain Data Oracle (priority #1)
 *
 * Tools:
 *   - get_wallet_activity  → eth_getLogs last 1000 blocks
 *   - get_reputation_score → getSummary() + readFeedback() on Reputation Registry
 *   - get_identity_data    → tokenURI() on Identity Registry
 *
 * Data sources: ONLY public RPC + view functions on verified registries.
 */

import { z } from 'zod';
import { isAddress } from 'viem';
import { config } from '../config';
import { abstractRpcCall, abstractClient, abstractClientFallback, withFallback } from '../lib/rpc';
import { cacheGet, cacheSet } from '../lib/redis';
import { IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from '../lib/contracts';
import {
  WalletActivityOutput,
  ReputationScoreOutput,
  IdentityDataOutput,
  LogEntry,
  FeedbackEntry,
} from '@lizy/types';

// ── Pricing ───────────────────────────────────────────────────────────────────
export const PRICES = {
  get_wallet_activity: 0.005,   // $0.005 USDC.e
  get_reputation_score: 0.003,  // $0.003 USDC.e
  get_identity_data: 0.002,     // $0.002 USDC.e
} as const;

export const CACHE_TTL = {
  get_wallet_activity: 30,      // 30 seconds (logs change fast)
  get_reputation_score: 300,    // 5 minutes
  get_identity_data: 600,       // 10 minutes
} as const;

// ── Zod Schemas ───────────────────────────────────────────────────────────────
export const walletActivitySchema = z.object({
  address: z.string().refine(isAddress, 'Invalid EVM address'),
  blockRange: z.coerce.number().int().min(1).max(1000).default(1000),
});

export const reputationScoreSchema = z.object({
  address: z.string().refine(isAddress, 'Invalid EVM address'),
});

export const identityDataSchema = z.object({
  address: z.string().refine(isAddress, 'Invalid EVM address'),
});

// ── Tool: get_wallet_activity ─────────────────────────────────────────────────
export async function getWalletActivity(
  input: z.infer<typeof walletActivitySchema>,
): Promise<WalletActivityOutput> {
  const address = input.address.toLowerCase() as `0x${string}`;
  const cacheKey = `tool:wallet_activity:${address}:${input.blockRange}`;

  const cached = await cacheGet<WalletActivityOutput>(cacheKey);
  if (cached) return { ...cached, cachedAt: cached.cachedAt };

  // Fetch current block number
  const blockHex = await abstractRpcCall<string>('eth_blockNumber', []);
  const toBlock = parseInt(blockHex, 16);
  const fromBlock = Math.max(0, toBlock - input.blockRange);

  // eth_getLogs — filter by address (address is the emitter, not the subject)
  const rawLogs = await abstractRpcCall<Array<{
    blockNumber: string;
    transactionHash: string;
    address: string;
    topics: string[];
    data: string;
    logIndex: string;
  }>>('eth_getLogs', [{
    address: input.address,
    fromBlock: `0x${fromBlock.toString(16)}`,
    toBlock: `0x${toBlock.toString(16)}`,
  }]);

  const logs: LogEntry[] = rawLogs.slice(0, 200).map((log) => ({
    blockNumber: parseInt(log.blockNumber, 16),
    transactionHash: log.transactionHash as `0x${string}`,
    address: log.address as `0x${string}`,
    topics: log.topics,
    data: log.data,
    logIndex: parseInt(log.logIndex, 16),
  }));

  const result: WalletActivityOutput = {
    address,
    fromBlock,
    toBlock,
    logCount: logs.length,
    logs,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.get_wallet_activity);
  return result;
}

// ── Tool: get_reputation_score ────────────────────────────────────────────────
export async function getReputationScore(
  input: z.infer<typeof reputationScoreSchema>,
): Promise<ReputationScoreOutput> {
  const address = input.address.toLowerCase() as `0x${string}`;
  const cacheKey = `tool:reputation:${address}`;

  const cached = await cacheGet<ReputationScoreOutput>(cacheKey);
  if (cached) return cached;

  const registryAddress = config.REPUTATION_REGISTRY as `0x${string}`;

  const [summary, feedback] = await Promise.all([
    withFallback(
      () => abstractClient.readContract({
        address: registryAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getSummary',
        args: [address],
      }),
      () => abstractClientFallback.readContract({
        address: registryAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getSummary',
        args: [address],
      }),
    ),
    withFallback(
      () => abstractClient.readContract({
        address: registryAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'readFeedback',
        args: [address, 0n, 10n],
      }),
      () => abstractClientFallback.readContract({
        address: registryAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'readFeedback',
        args: [address, 0n, 10n],
      }),
    ),
  ]);

  const [totalScore, positiveCount, negativeCount, neutralCount] = summary as [
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  const feedbackEntries = (feedback as Array<{
    from: string;
    score: number;
    comment: string;
    timestamp: bigint;
  }>).map((f): FeedbackEntry => ({
    from: f.from as `0x${string}`,
    score: f.score,
    comment: f.comment,
    timestamp: Number(f.timestamp),
  }));

  const result: ReputationScoreOutput = {
    address,
    totalScore: Number(totalScore),
    positiveCount: Number(positiveCount),
    negativeCount: Number(negativeCount),
    neutralCount: Number(neutralCount),
    recentFeedback: feedbackEntries,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.get_reputation_score);
  return result;
}

// ── Tool: get_identity_data ───────────────────────────────────────────────────
export async function getIdentityData(
  input: z.infer<typeof identityDataSchema>,
): Promise<IdentityDataOutput> {
  const address = input.address.toLowerCase() as `0x${string}`;
  const cacheKey = `tool:identity:${address}`;

  const cached = await cacheGet<IdentityDataOutput>(cacheKey);
  if (cached) return cached;

  const registryAddress = config.IDENTITY_REGISTRY as `0x${string}`;

  // Check if address has an identity token
  const balance = await withFallback(
    () => abstractClient.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
    () => abstractClientFallback.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
  ) as bigint;

  if (balance === 0n) {
    const result: IdentityDataOutput = {
      address,
      hasIdentity: false,
      cachedAt: Date.now(),
    };
    await cacheSet(cacheKey, result, CACHE_TTL.get_identity_data);
    return result;
  }

  const tokenId = await withFallback(
    () => abstractClient.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'addressToToken',
      args: [address],
    }),
    () => abstractClientFallback.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'addressToToken',
      args: [address],
    }),
  ) as bigint;

  const tokenURI = await withFallback(
    () => abstractClient.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    }),
    () => abstractClientFallback.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    }),
  ) as string;

  // Decode base64 JSON tokenURI if applicable (pure CPU transform — allowed)
  let metadata: Record<string, unknown> | undefined;
  try {
    if (tokenURI.startsWith('data:application/json;base64,')) {
      const b64 = tokenURI.replace('data:application/json;base64,', '');
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      metadata = JSON.parse(decoded) as Record<string, unknown>;
    } else if (tokenURI.startsWith('{')) {
      metadata = JSON.parse(tokenURI) as Record<string, unknown>;
    }
  } catch {
    // Metadata decode failure is non-fatal
  }

  const result: IdentityDataOutput = {
    address,
    tokenId: Number(tokenId),
    tokenURI,
    metadata,
    hasIdentity: true,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.get_identity_data);
  return result;
}
