import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      mppCharged?: boolean;
      toolPriceUsdc?: number;
    }
  }
}

export function createMppChargeMiddleware(priceUsdc: number) {
  return async function mppCharge(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    req.toolPriceUsdc = priceUsdc;

    if (!req.mppSessionId || !req.mppBalance) {
      next();
      return;
    }

    const priceInMicro = BigInt(Math.round(priceUsdc * 1_000_000));

    if (req.mppBalance < priceInMicro) {
      next();
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const chargeRes = await fetch(`${config.MPP_ENDPOINT}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: req.mppSessionId,
          walletAddress: req.walletAddress,
          amount: priceInMicro.toString(),
          tokenAddress: config.USDC_E_ADDRESS,
          metadata: { tool: req.path },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (chargeRes.ok) {
        req.mppCharged = true;
      }
    } catch {
      // MPP charge failure → fall through to x402 or free quota
    }

    next();
  };
}
