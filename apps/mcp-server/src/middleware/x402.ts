import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      x402Paid?: boolean;
      x402TxHash?: string;
    }
  }
}

export function createX402Middleware(priceUsdc: number) {
  return async function x402(req: Request, res: Response, next: NextFunction): Promise<void> {
    // If already paid via MPP or free quota used, skip x402
    if (req.mppCharged) {
      next();
      return;
    }

    const paymentHeader = req.headers['x-payment'] as string | undefined;

    if (!paymentHeader) {
      // Apply Pudgy holder discount
      const discountBps = req.holderPerks?.discountBps ?? 0;
      const effectivePrice = priceUsdc * (1 - discountBps / 10000);
      const priceInMicro = Math.round(effectivePrice * 1_000_000);

      res.status(402).json({
        ok: false,
        error: {
          code: 'PAYMENT_REQUIRED',
          message: 'Payment required. Use x402 or MPP.',
          details: {
            x402: {
              scheme: 'exact',
              network: `eip155:${config.ABSTRACT_CHAIN_ID}`,
              maxAmountRequired: priceInMicro.toString(),
              resource: `${req.get('x-lizy-proto') ?? req.protocol}://${req.get('x-lizy-public-host') ?? req.get('x-forwarded-host') ?? req.get('host')}${req.originalUrl}`,
              description: `LIZY Tool: ${req.path}`,
              mimeType: 'application/json',
              payTo: config.PAYMENT_RECIPIENT,
              maxTimeoutSeconds: 300,
              asset: config.USDC_E_ADDRESS,
              extra: { facilitator: config.X402_FACILITATOR },
            },
          },
        },
      });
      return;
    }

    // Verify payment with facilitator
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const verifyRes = await fetch(`${config.X402_FACILITATOR}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment: paymentHeader,
          resource: `${req.protocol}://${req.get('x-forwarded-host') ?? req.get('host')}${req.originalUrl}`,
          walletAddress: req.walletAddress,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!verifyRes.ok) {
        res.status(402).json({
          ok: false,
          error: { code: 'PAYMENT_INVALID', message: 'x402 payment verification failed' },
        });
        return;
      }

      const verifyData = (await verifyRes.json()) as { txHash?: string; valid: boolean };
      if (!verifyData.valid) {
        res.status(402).json({
          ok: false,
          error: { code: 'PAYMENT_INVALID', message: 'Payment not valid' },
        });
        return;
      }

      req.x402Paid = true;
      req.x402TxHash = verifyData.txHash;
    } catch {
      res.status(402).json({
        ok: false,
        error: { code: 'PAYMENT_VERIFY_ERROR', message: 'Failed to verify payment' },
      });
      return;
    }

    next();
  };
}
