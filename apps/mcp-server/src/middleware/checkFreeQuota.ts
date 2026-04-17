import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { quotaGet, quotaIncrement } from '../lib/redis';

declare global {
  namespace Express {
    interface Request {
      usedFreeQuota?: boolean;
      quotaUsed?: number;
      quotaLimit?: number;
    }
  }
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

export async function checkFreeQuota(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // If already paid via MPP or x402, skip free quota
  if (req.mppCharged) {
    next();
    return;
  }

  const perks = req.holderPerks;
  const limit = perks?.isPenguHolder
    ? config.FREE_QUOTA_PENGU_HOLDER
    : config.FREE_QUOTA_DEFAULT;

  const date = todayDate();
  const address = req.walletAddress.toLowerCase();

  try {
    const used = await quotaGet(address, date);

    if (used >= limit) {
      // Quota exhausted → must pay via x402
      req.quotaUsed = used;
      req.quotaLimit = limit;
      next();
      return;
    }

    const newUsed = await quotaIncrement(address, date);
    req.usedFreeQuota = true;
    req.quotaUsed = newUsed;
    req.quotaLimit = limit;
  } catch {
    // On Redis failure, allow through
    req.usedFreeQuota = true;
    req.quotaUsed = 0;
    req.quotaLimit = limit;
  }

  next();
}
