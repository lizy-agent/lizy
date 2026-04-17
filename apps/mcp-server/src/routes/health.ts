import { Router } from 'express';
import { getRedis, quotaGet } from '../lib/redis';
import { getSupabase } from '../lib/supabase';
import { abstractRpcCall } from '../lib/rpc';
import { config } from '../config';

const router: ReturnType<typeof Router> = Router();

router.get('/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = {};
  const start = Date.now();

  await Promise.allSettled([
    abstractRpcCall('eth_blockNumber', [])
      .then(() => { checks.abstract_rpc = 'ok'; })
      .catch(() => { checks.abstract_rpc = 'error'; }),

    getRedis().ping()
      .then(() => { checks.redis = 'ok'; })
      .catch(() => { checks.redis = 'error'; }),

    Promise.resolve(getSupabase().from('users').select('id').limit(1))
      .then(() => { checks.supabase = 'ok'; })
      .catch(() => { checks.supabase = 'error'; }),
  ]);

  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    ok: allOk,
    checks,
    latencyMs: Date.now() - start,
    ts: new Date().toISOString(),
  });
});

router.get('/ping', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

router.get('/quota', async (req, res) => {
  const walletAddress = (req.headers['x-wallet-address'] as string | undefined)?.toLowerCase();
  if (!walletAddress || !/^0x[0-9a-f]{40}$/.test(walletAddress)) {
    res.status(400).json({ ok: false, error: 'Missing or invalid X-Wallet-Address header' });
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const [used, holderCache] = await Promise.all([
    quotaGet(walletAddress, date).catch(() => 0),
    getRedis().get<{ isPenguHolder?: boolean }>(`holder:${walletAddress}`).catch(() => null),
  ]);

  const isPenguHolder = holderCache?.isPenguHolder ?? false;
  const quotaLimit = isPenguHolder ? config.FREE_QUOTA_PENGU_HOLDER : config.FREE_QUOTA_DEFAULT;

  const now = new Date();
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

  res.json({
    ok: true,
    quotaUsed: used,
    quotaLimit,
    quotaRemaining: Math.max(0, quotaLimit - used),
    isPenguHolder,
    resetAt,
  });
});

export default router;
