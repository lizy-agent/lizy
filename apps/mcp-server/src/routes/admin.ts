import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { getSupabase } from '../lib/supabase';
import { getRedis } from '../lib/redis';

const router: ReturnType<typeof Router> = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'];
  if (secret !== config.ADMIN_SECRET) {
    res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    return;
  }
  next();
}

router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  const sb = getSupabase();
  const [users, calls, telemetry] = await Promise.all([
    sb.from('users').select('id', { count: 'exact', head: true }),
    sb.from('tool_calls').select('id', { count: 'exact', head: true }),
    sb.from('mcp_telemetry').select('id', { count: 'exact', head: true }),
  ]);

  res.json({
    ok: true,
    data: {
      totalUsers: users.count ?? 0,
      totalToolCalls: calls.count ?? 0,
      totalMcpRequests: telemetry.count ?? 0,
    },
  });
});

router.post('/flush-cache', async (req, res) => {
  const pattern = (req.body as { pattern?: string }).pattern ?? 'tool:*';
  const redis = getRedis();
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
    res.json({ ok: true, flushed: keys.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: { code: 'FLUSH_ERROR', message: String(e) } });
  }
});

router.get('/tool-calls', async (req, res) => {
  const sb = getSupabase();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const { data, error } = await sb
    .from('tool_calls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ ok: false, error: { code: 'DB_ERROR', message: error.message } });
    return;
  }

  res.json({ ok: true, data });
});

export default router;
