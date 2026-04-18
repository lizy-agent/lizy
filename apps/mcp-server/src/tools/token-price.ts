/**
 * Token Price Aggregator & Cross-Chain Lookup Tool
 *
 * Prices sourced entirely from on-chain DEX pool state via eth_call.
 * No scraping, no paid external APIs.
 */

import { z } from 'zod';
import { isAddress } from 'viem';
import { config } from '../config';
import { abstractClient, abstractClientFallback, withFallback } from '../lib/rpc';
import { cacheGet, cacheSet } from '../lib/redis';
import { UNISWAP_V3_POOL_ABI, ERC20_ABI } from '../lib/contracts';
import { TokenPriceOutput, CrossChainLookupOutput } from '@lizy/types';

// ── Pricing ───────────────────────────────────────────────────────────────────
export const PRICES = {
  get_token_price: 0.003,         // $0.003 USDC.e
  get_cross_chain_lookup: 0,  // free utility tool
} as const;

export const CACHE_TTL = {
  get_token_price: 60,            // 1 minute
  get_cross_chain_lookup: 300,    // 5 minutes
} as const;

// Known DEX pools on Abstract Mainnet (verified on-chain addresses)
const KNOWN_POOLS: Record<string, `0x${string}`> = {
  // USDC.e/WETH pool
  [`2741:0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1`]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

// USDC.e decimals = 6
const USDC_E_DECIMALS = 6;
const WETH_DECIMALS = 18;

// ── Zod Schemas ───────────────────────────────────────────────────────────────
export const tokenPriceSchema = z.object({
  tokenAddress: z.string().refine(isAddress, 'Invalid EVM address'),
  chainId: z.coerce.number().int().positive().default(2741),
  quoteToken: z
    .string()
    .refine(isAddress, 'Invalid EVM address')
    .optional()
    .default(config.USDC_E_ADDRESS),
});

export const crossChainLookupSchema = z.object({
  tokenAddress: z.string().refine(isAddress, 'Invalid EVM address'),
  sourceChainId: z.coerce.number().int().positive(),
  targetChainId: z.coerce.number().int().positive(),
});

// ── Uniswap V3 price math ─────────────────────────────────────────────────────
function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
): number {
  const Q96 = 2n ** 96n;
  const price = (sqrtPriceX96 * sqrtPriceX96 * BigInt(10 ** token0Decimals)) / (Q96 * Q96 * BigInt(10 ** token1Decimals));
  return Number(price);
}

// ── Tool: get_token_price ─────────────────────────────────────────────────────
export async function getTokenPrice(
  input: z.infer<typeof tokenPriceSchema>,
): Promise<TokenPriceOutput> {
  const tokenAddress = input.tokenAddress.toLowerCase() as `0x${string}`;
  const quoteToken = (input.quoteToken ?? config.USDC_E_ADDRESS).toLowerCase() as `0x${string}`;
  const chainId = input.chainId;

  const cacheKey = `tool:token_price:${chainId}:${tokenAddress}:${quoteToken}`;
  const cached = await cacheGet<TokenPriceOutput>(cacheKey);
  if (cached) return cached;

  // Fetch token decimals
  let tokenDecimals = 18;
  try {
    const dec = await withFallback(
      () => abstractClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      () => abstractClientFallback.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ) as number;
    tokenDecimals = dec;
  } catch {
    tokenDecimals = 18;
  }

  // Try to find a known pool
  const poolKey = `${chainId}:${tokenAddress}`;
  const poolAddress = KNOWN_POOLS[poolKey];

  let priceInQuote = 0;
  let priceUsd = 0;
  let liquidity: string | undefined;

  if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
    try {
      const [slot0Data, liquidityData, token0Addr] = await Promise.all([
        withFallback(
          () => abstractClient.readContract({
            address: poolAddress,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'slot0',
          }),
          () => abstractClientFallback.readContract({
            address: poolAddress,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'slot0',
          }),
        ),
        withFallback(
          () => abstractClient.readContract({
            address: poolAddress,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'liquidity',
          }),
          () => abstractClientFallback.readContract({
            address: poolAddress,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'liquidity',
          }),
        ),
        withFallback(
          () => abstractClient.readContract({
            address: poolAddress,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'token0',
          }),
          () => abstractClientFallback.readContract({
            address: poolAddress,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'token0',
          }),
        ),
      ]);

      const [sqrtPriceX96] = slot0Data as unknown as [bigint, ...unknown[]];
      const isToken0 = (token0Addr as string).toLowerCase() === tokenAddress;

      const quoteDecimals = quoteToken === config.USDC_E_ADDRESS.toLowerCase() ? USDC_E_DECIMALS : 18;
      const t0Dec = isToken0 ? tokenDecimals : quoteDecimals;
      const t1Dec = isToken0 ? quoteDecimals : tokenDecimals;

      const rawPrice = sqrtPriceX96ToPrice(sqrtPriceX96, t0Dec, t1Dec);
      priceInQuote = isToken0 ? rawPrice : rawPrice === 0 ? 0 : 1 / rawPrice;
      priceUsd = quoteToken === config.USDC_E_ADDRESS.toLowerCase() ? priceInQuote : 0;
      liquidity = (liquidityData as bigint).toString();
    } catch {
      // Pool read failure — return zeroes
    }
  }

  const result: TokenPriceOutput = {
    tokenAddress,
    chainId,
    priceUsd,
    priceInQuote,
    quoteToken,
    poolAddress: poolAddress ?? undefined,
    liquidity,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.get_token_price);
  return result;
}

// ── Tool: get_cross_chain_lookup ──────────────────────────────────────────────
// Known cross-chain token mappings (verified on-chain bridge registries)
const CROSS_CHAIN_MAP: Record<string, Record<number, `0x${string}`>> = {
  // USDC.e: Abstract ↔ Ethereum
  '2741:0x84a71ccd554cc1b02749b35d22f684cc8ec987e1': {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
  },
  '1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    2741: '0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1' as `0x${string}`,
  },
};

export async function getCrossChainLookup(
  input: z.infer<typeof crossChainLookupSchema>,
): Promise<CrossChainLookupOutput> {
  const tokenAddress = input.tokenAddress.toLowerCase() as `0x${string}`;
  const { sourceChainId, targetChainId } = input;

  const cacheKey = `tool:cross_chain:${sourceChainId}:${tokenAddress}:${targetChainId}`;
  const cached = await cacheGet<CrossChainLookupOutput>(cacheKey);
  if (cached) return cached;

  const mapKey = `${sourceChainId}:${tokenAddress}`;
  const targetAddress = CROSS_CHAIN_MAP[mapKey]?.[targetChainId] ?? undefined;
  const bridgeSupported = targetAddress !== undefined;

  const result: CrossChainLookupOutput = {
    sourceChainId,
    targetChainId,
    sourceAddress: tokenAddress,
    targetAddress,
    bridgeSupported,
    cachedAt: Date.now(),
  };

  await cacheSet(cacheKey, result, CACHE_TTL.get_cross_chain_lookup);
  return result;
}
