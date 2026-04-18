import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { isAddress } from 'viem';
import { abstractClient } from '../lib/rpc';
import { getClientIp, hashIp } from '../lib/ip';
import { upsertUser } from '../lib/supabase';

const walletHeaderSchema = z.object({
  'x-wallet-address': z.string().refine(isAddress, 'Invalid EVM address'),
  'x-wallet-signature': z.string().optional(),
  'x-wallet-nonce': z.string().optional(),
});

declare global {
  namespace Express {
    interface Request {
      walletAddress: `0x${string}`;
      ipHash: string;
    }
  }
}

export async function validateWallet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = walletHeaderSchema.safeParse(req.headers);

  if (!parsed.success) {
    res.status(401).json({
      ok: false,
      error: { code: 'MISSING_WALLET', message: 'x-wallet-address header required' },
    });
    return;
  }

  const address = parsed.data['x-wallet-address'] as `0x${string}`;
  const signature = parsed.data['x-wallet-signature'];
  const nonce = parsed.data['x-wallet-nonce'];

  // Verify signature if provided — supports both EOA (ECDSA) and AGW smart wallets (EIP-1271)
  if (signature && nonce) {
    try {
      const message = `LIZY Auth\nAddress: ${address}\nNonce: ${nonce}`;
      const valid = await abstractClient.verifyMessage({
        address,
        message,
        signature: signature as `0x${string}`,
      });
      if (!valid) {
        res.status(401).json({
          ok: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Wallet signature verification failed' },
        });
        return;
      }
    } catch {
      res.status(401).json({
        ok: false,
        error: { code: 'SIGNATURE_ERROR', message: 'Failed to verify wallet signature' },
      });
      return;
    }
  }

  req.walletAddress = address;
  req.ipHash = hashIp(getClientIp(req));

  upsertUser(address).catch(() => {});

  next();
}
