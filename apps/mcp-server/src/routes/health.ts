import { Router } from 'express';
import { getRedis } from '../lib/redis';
import { getSupabase } from '../lib/supabase';
import { abstractRpcCall } from '../lib/rpc';

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

export default router;
