/**
 * Abstract On-Chain Data Oracle
 *
 * Tools:
 *   - get_wallet_activity  → eth_getLogs last 1000 blocks
 *   - get_wallet_balance   → ETH + ERC20 balances for a wallet
 *   - get_transaction      → transaction details by hash
 *   - get_reputation_score → getSummary() + readFeedback() on Reputation Registry
 *   - get_identity_data    → tokenURI() on Identity Registry
 *
 * Data sources: ONLY public RPC + view functions on verified registries.
 */

import { z } from 'zod';
import { isAddress, formatUnits } from 'viem';
import { config } from '../config';
import { abstractRpcCall, abstractClient, abstractClientFallback, withFallback } from '../lib/rpc';
import { cacheGet, cacheSet } from '../lib/redis';
import { IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from '../lib/contracts';
import {
  WalletActivityOutput,
  WalletBalanceOutput,
  TransactionOutput,
  ReputationScoreOutput,
  IdentityDataOutput,
  LogEntry,
  FeedbackEntry,
} from '@lizy/types';

// ── Pricing ───────────────────────────────────────────────────────────────────
export const PRICES = {
  get_wallet_activity: 0.005,   // $0.005 USDC.e
  get_wallet_balance: 0.002,    // $0.002 USDC.e
  get_transaction: 0.003,       // $0.003 USDC.e
  get_reputation_score: 0.003,  // $0.003 USDC.e
  get_identity_data: 0.002,     // $0.002 USDC.e
} as const;

export const CACHE_TTL = {
  get_wallet_activity: 30,      // 30 seconds (logs change fast)
  get_wallet_balance: 30,       // 30 seconds
  get_transaction: 300,         // 5 minutes (finalized tx doesn't change)
  get_reputation_score: 300,    // 5 minutes
  get_identity_data: 600,       // 10 minutes
} as const;

// ── Zod Schemas ───────────────────────────────────────────────────────────────
export const walletActivitySchema = z.object({
  address: z.string().refine(isAddress, 'Invalid EVM address'),
  blockRange: z.coerce.number().int().min(1).max(1000).default(1000),
});

export const walletBalanceSchema = z.object({
  address: z.string().refine(isAddress, 'Invalid EVM address'),
  tokens: z.array(z.string().refine(isAddress, 'Invalid token address')).max(10).optional(),
});

export const transactionSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid transaction hash'),
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

// ── Tool: get_wallet_balance ──────────────────────────────────────────────────
export async function getWalletBalance(
  input: z.infer<typeof walletBalanceSchema>,
): Promise<WalletBalanceOutput> {
  const address = input.address.toLowerCase() as `0x${string}`;
  const tokenAddresses = (input.tokens ?? [config.USDC_E_ADDRESS]) as `0x${string}`[];
  const cacheKey = `tool:wallet_balance:${address}:${tokenAddresses.join(',')}`;

  const cached = await cacheGet<WalletBalanceOutput>(cacheKey);
  if (cached) return { ...cached, cachedAt: cached.cachedAt };

  const balanceHex = await abstractRpcCall<string>('eth_getBalance', [address, 'latest']);
  const ethBalance = BigInt(balanceHex);

  const tokenBalances = await Promise.all(
    tokenAddresses.map(async (tokenAddr) => {
      try {
        const paddedAddr = address.slice(2).padStart(64, '0');
        const [balData, decData, symData] = await Promise.all([
          abstractRpcCall<string>('eth_call', [{ to: tokenAddr, data: `0x70a08231000000000000000000000000${paddedAddr}` }, 'latest']),
          abstractRpcCall<string>('eth_call', [{ to: tokenAddr, data: '0x313ce567' }, 'latest']),
          abstractRpcCall<string>('eth_call', [{ to: tokenAddr, data: '0x95d89b41' }, 'latest']),
        ]);
        const balance = BigInt(balData);
        const decimals = parseInt(decData, 16) || 18;
        let symbol = 'UNKNOWN';
        try {
          const len = parseInt(symData.slice(66, 130), 16);
          symbol = Buffer.from(symData.slice(130, 130 + len * 2), 'hex').toString('utf-8').replace(/\0/g, '');
        } catch { /* non-standard symbol encoding */ }
        return { address: tokenAddr, symbol, decimals, rawBalance: balance.toString(), formatted: formatUnits(balance, decimals) };
      } catch {
        return { address: tokenAddr, symbol: 'UNKNOWN', decimals: 18, rawBalance: '0', formatted: '0' };
      }
    }),
  );

  const result: WalletBalanceOutput = {
    address,
    eth: { rawBalance: ethBalance.toString(), formatted: formatUnits(ethBalance, 18) },
    tokens: tokenBalances,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.get_wallet_balance);
  return result;
}

// ── Tool: get_transaction ─────────────────────────────────────────────────────
export async function getTransaction(
  input: z.infer<typeof transactionSchema>,
): Promise<TransactionOutput> {
  const hash = input.txHash as `0x${string}`;
  const cacheKey = `tool:tx:${hash}`;

  const cached = await cacheGet<TransactionOutput>(cacheKey);
  if (cached) return cached;

  const [tx, receipt] = await Promise.all([
    abstractRpcCall<{
      hash: string; from: string; to: string | null; value: string;
      blockNumber: string | null; blockHash: string | null;
      gasPrice: string; input: string; nonce: string;
    } | null>('eth_getTransactionByHash', [hash]),
    abstractRpcCall<{
      status: string; gasUsed: string; blockNumber: string;
    } | null>('eth_getTransactionReceipt', [hash]),
  ]);

  if (!tx) throw new Error('Transaction not found');

  let blockTimestamp: number | undefined;
  if (tx.blockHash) {
    try {
      const block = await abstractRpcCall<{ timestamp: string } | null>('eth_getBlockByHash', [tx.blockHash, false]);
      if (block?.timestamp) blockTimestamp = parseInt(block.timestamp, 16);
    } catch { /* non-fatal */ }
  }

  const status = !receipt ? 'pending' : receipt.status === '0x1' ? 'success' : 'failed';
  const result: TransactionOutput = {
    hash,
    from: tx.from as `0x${string}`,
    to: tx.to as `0x${string}` | null,
    value: BigInt(tx.value).toString(),
    valueEth: formatUnits(BigInt(tx.value), 18),
    status,
    blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : null,
    blockTimestamp: blockTimestamp ?? null,
    gasUsed: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16) : null,
    gasPrice: tx.gasPrice ? parseInt(tx.gasPrice, 16) : null,
    input: tx.input,
    cachedAt: Date.now(),
  };

  if (status !== 'pending') {
    await cacheSet(cacheKey, result, CACHE_TTL.get_transaction);
  }
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

  // readFeedback reverts when the address has no data — treat any revert as "no data"
  const safeRead = async <T>(fn: () => Promise<T>, fallbackValue: T): Promise<T> => {
    try { return await fn(); } catch { return fallbackValue; }
  };

  const [summary, feedback] = await Promise.all([
    safeRead(
      () => withFallback(
        () => abstractClient.readContract({ address: registryAddress, abi: REPUTATION_REGISTRY_ABI, functionName: 'getSummary', args: [address] }),
        () => abstractClientFallback.readContract({ address: registryAddress, abi: REPUTATION_REGISTRY_ABI, functionName: 'getSummary', args: [address] }),
      ) as Promise<unknown>,
      [0n, 0n, 0n, 0n],
    ),
    safeRead(
      () => withFallback(
        () => abstractClient.readContract({ address: registryAddress, abi: REPUTATION_REGISTRY_ABI, functionName: 'readFeedback', args: [address, 0n, 10n] }),
        () => abstractClientFallback.readContract({ address: registryAddress, abi: REPUTATION_REGISTRY_ABI, functionName: 'readFeedback', args: [address, 0n, 10n] }),
      ) as Promise<unknown>,
      [],
    ),
  ]);

  const summaryArr = (Array.isArray(summary) ? summary : [0n, 0n, 0n, 0n]) as bigint[];
  const [totalScore, positiveCount, negativeCount, neutralCount] = [
    summaryArr[0] ?? 0n,
    summaryArr[1] ?? 0n,
    summaryArr[2] ?? 0n,
    summaryArr[3] ?? 0n,
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
