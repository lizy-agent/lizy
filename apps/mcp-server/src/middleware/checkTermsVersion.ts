import { Request, Response, NextFunction } from 'express';
import { getUserTermsVersion } from '../lib/supabase';
import { config } from '../config';

export async function checkTermsVersion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Skip for terms-agreement endpoint
  if (req.path === '/terms/agree') {
    next();
    return;
  }

  try {
    const agreedVersion = await getUserTermsVersion(req.walletAddress);

    if (agreedVersion === null || agreedVersion < config.TERMS_VERSION) {
      res.status(403).json({
        ok: false,
        error: {
          code: 'TERMS_REQUIRED',
          message: `Must agree to Terms of Service v${config.TERMS_VERSION}`,
          details: {
            currentVersion: config.TERMS_VERSION,
            agreedVersion: agreedVersion ?? 0,
            agreementUrl: 'https://lizy.world/terms',
          },
        },
      });
      return;
    }

    next();
  } catch (err) {
    // On DB error, allow through but log
    console.error('[checkTermsVersion] DB error:', err);
    next();
  }
}
