import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { cacheGet, cacheSet } from '../lib/redis';
import { getHolderPerksFromDb, upsertHolderPerks } from '../lib/supabase';
import { abstractClient, abstractClientFallback, ethereumClient, ethereumClientFallback, withFallback } from '../lib/rpc';
import { ERC20_ABI, PUDGY_PENGUINS_ABI } from '../lib/contracts';
import { HolderPerks } from '@lizy/types';

declare global {
  namespace Express {
    interface Request {
      holderPerks?: HolderPerks;
    }
  }
}

const HOLDER_CACHE_TTL = 300; // 5 minutes
const HOLDER_DB_TTL_HOURS = 1;

async function fetchHolderPerks(walletAddress: `0x${string}`): Promise<HolderPerks> {
  const [penguBalance, pudgyBalance] = await Promise.allSettled([
    withFallback(
      () => abstractClient.readContract({
        address: config.PENGU_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      () => abstractClientFallback.readContract({
        address: config.PENGU_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
    ),
    // Pudgy Penguins is on Ethereum mainnet only
    withFallback(
      () => ethereumClient.readContract({
        address: config.PUDGY_PENGUINS as `0x${string}`,
        abi: PUDGY_PENGUINS_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      () => ethereumClientFallback.readContract({
        address: config.PUDGY_PENGUINS as `0x${string}`,
        abi: PUDGY_PENGUINS_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
    ),
  ]);

  const pengu = penguBalance.status === 'fulfilled' ? (penguBalance.value as bigint) : 0n;
  const pudgyBal = pudgyBalance.status === 'fulfilled' ? Number(pudgyBalance.value as bigint) : 0;

  const isPenguHolder = pengu > 0n;
  const isPudgyHolder = pudgyBal > 0;

  let pudgyTokenIds: number[] = [];
  if (isPudgyHolder) {
    try {
      const tokenIds = await withFallback(
        () => ethereumClient.readContract({
          address: config.PUDGY_PENGUINS as `0x${string}`,
          abi: PUDGY_PENGUINS_ABI,
          functionName: 'tokensOfOwner',
          args: [walletAddress],
        }),
        () => ethereumClientFallback.readContract({
          address: config.PUDGY_PENGUINS as `0x${string}`,
          abi: PUDGY_PENGUINS_ABI,
          functionName: 'tokensOfOwner',
          args: [walletAddress],
        }),
      );
      pudgyTokenIds = (tokenIds as bigint[]).map(Number);
    } catch {
      pudgyTokenIds = [];
    }
  }

  const quotaBonus = isPenguHolder ? 50 : 0;
  const discountBps = isPudgyHolder ? 5000 : 0; // 50% discount

  return {
    isPenguHolder,
    isPudgyHolder,
    penguBalance: pengu,
    pudgyTokenIds,
    quotaBonus,
    discountBps,
  };
}

export async function checkHolderPerks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const address = req.walletAddress;
  const cacheKey = `holder:${address.toLowerCase()}`;

  try {
    // Check Redis cache first
    const cached = await cacheGet<HolderPerks>(cacheKey);
    if (cached) {
      req.holderPerks = {
        ...cached,
        penguBalance: BigInt(cached.penguBalance as unknown as string),
      };
      next();
      return;
    }

    // Check Supabase cache
    const dbCache = await getHolderPerksFromDb(address);
    if (dbCache) {
      const perks: HolderPerks = {
        isPenguHolder: dbCache.is_pengu_holder,
        isPudgyHolder: dbCache.is_pudgy_holder,
        penguBalance: BigInt(dbCache.pengu_balance),
        pudgyTokenIds: dbCache.pudgy_token_ids,
        quotaBonus: dbCache.is_pengu_holder ? 50 : 0,
        discountBps: dbCache.is_pudgy_holder ? 5000 : 0,
      };
      req.holderPerks = perks;
      await cacheSet(cacheKey, { ...perks, penguBalance: perks.penguBalance.toString() }, HOLDER_CACHE_TTL);
      next();
      return;
    }

    // Fetch fresh from chain
    const perks = await fetchHolderPerks(address);
    req.holderPerks = perks;

    const expiresAt = new Date(Date.now() + HOLDER_DB_TTL_HOURS * 3600_000).toISOString();
    await Promise.allSettled([
      cacheSet(cacheKey, { ...perks, penguBalance: perks.penguBalance.toString() }, HOLDER_CACHE_TTL),
      upsertHolderPerks({
        walletAddress: address,
        isPenguHolder: perks.isPenguHolder,
        isPudgyHolder: perks.isPudgyHolder,
        penguBalance: perks.penguBalance.toString(),
        pudgyTokenIds: perks.pudgyTokenIds,
        expiresAt,
      }),
    ]);
  } catch {
    req.holderPerks = {
      isPenguHolder: false,
      isPudgyHolder: false,
      penguBalance: 0n,
      pudgyTokenIds: [],
      quotaBonus: 0,
      discountBps: 0,
    };
  }

  next();
}
