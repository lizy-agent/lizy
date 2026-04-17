import { Request, Response, NextFunction } from 'express';
import { rateLimitCheck } from '../lib/redis';

const IP_WINDOW_SECONDS = 60;
const IP_REQUEST_LIMIT = 60; // 60 requests per minute per IP

const WALLET_WINDOW_SECONDS = 60;
const WALLET_REQUEST_LIMIT = 30; // 30 requests per minute per wallet

export async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const [ipResult, walletResult] = await Promise.all([
    rateLimitCheck(`ip:${req.ipHash}`, IP_REQUEST_LIMIT, IP_WINDOW_SECONDS),
    rateLimitCheck(`wallet:${req.walletAddress.toLowerCase()}`, WALLET_REQUEST_LIMIT, WALLET_WINDOW_SECONDS),
  ]);

  if (!ipResult.allowed) {
    res.status(429).json({
      ok: false,
      error: {
        code: 'RATE_LIMIT_IP',
        message: 'Too many requests from this IP',
        details: { retryAfter: ipResult.reset },
      },
    });
    return;
  }

  if (!walletResult.allowed) {
    res.status(429).json({
      ok: false,
      error: {
        code: 'RATE_LIMIT_WALLET',
        message: 'Too many requests from this wallet',
        details: { retryAfter: walletResult.reset },
      },
    });
    return;
  }

  res.setHeader('X-RateLimit-Remaining-IP', ipResult.remaining.toString());
  res.setHeader('X-RateLimit-Remaining-Wallet', walletResult.remaining.toString());
  next();
}
