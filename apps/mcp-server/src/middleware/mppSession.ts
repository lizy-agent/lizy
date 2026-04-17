import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      mppSessionId?: string;
      mppBalance?: bigint;
    }
  }
}

interface MppSessionResponse {
  sessionId: string;
  balance: string;
  expiresAt: number;
}

export async function mppSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.headers['x-mpp-session-id'] as string | undefined;

  if (!sessionId) {
    next();
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const mppRes = await fetch(`${config.MPP_ENDPOINT}/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': req.walletAddress,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (mppRes.ok) {
      const data = (await mppRes.json()) as MppSessionResponse;
      req.mppSessionId = data.sessionId;
      req.mppBalance = BigInt(data.balance);
    }
  } catch {
    // MPP session lookup failure is non-fatal; fall through to other payment methods
  }

  next();
}
