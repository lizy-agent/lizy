import { Router, Request, Response } from 'express';
import { validateWallet } from '../middleware/validateWallet';
import { checkTermsVersion } from '../middleware/checkTermsVersion';
import { sanitizeInputs } from '../middleware/sanitizeInputs';
import { rateLimit } from '../middleware/rateLimit';
import { getRedis } from '../lib/redis';
import { hashInput } from '../lib/ip';
import { logToolCall } from '../lib/supabase';

import { walletActivitySchema, reputationScoreSchema, identityDataSchema, getWalletActivity, getReputationScore, getIdentityData } from '../tools/onchain-oracle';
import { pudgyMetadataSchema, verifyPudgyHolderSchema, getPudgyMetadata, verifyPudgyHolder } from '../tools/pudgy-penguins';
import { tokenPriceSchema, crossChainLookupSchema, getTokenPrice, getCrossChainLookup } from '../tools/token-price';
import { transformDataSchema, transformData } from '../tools/data-transform';
import { z } from 'zod';

const router: ReturnType<typeof Router> = Router();

const DEMO_QUOTA = 20;
const DEMO_QUOTA_TTL = 86400;

async function getDemoQuotaUsed(address: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const val = await getRedis().get<number>(`pq:${address.toLowerCase()}:${date}`);
  return val ?? 0;
}

async function incrementDemoQuota(address: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `pq:${address.toLowerCase()}:${date}`;
  const val = await getRedis().incr(key);
  if (val === 1) await getRedis().expire(key, DEMO_QUOTA_TTL);
  return val;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOLS: Record<string, { schema: z.ZodTypeAny; fn: (input: any) => Promise<unknown> }> = {
  get_wallet_activity:    { schema: walletActivitySchema,    fn: getWalletActivity },
  get_reputation_score:   { schema: reputationScoreSchema,   fn: getReputationScore },
  get_identity_data:      { schema: identityDataSchema,      fn: getIdentityData },
  get_pudgy_metadata:     { schema: pudgyMetadataSchema,     fn: getPudgyMetadata },
  verify_pudgy_holder:    { schema: verifyPudgyHolderSchema, fn: verifyPudgyHolder },
  get_token_price:        { schema: tokenPriceSchema,        fn: getTokenPrice },
  get_cross_chain_lookup: { schema: crossChainLookupSchema,  fn: getCrossChainLookup },
  transform_data:         { schema: transformDataSchema,     fn: transformData },
};

router.post(
  '/playground/call',
  validateWallet,
  checkTermsVersion,
  sanitizeInputs,
  rateLimit,
  async (req: Request, res: Response) => {
    const start = Date.now();
    const { tool, arguments: args } = req.body as { tool?: string; arguments?: unknown };

    if (!tool || !TOOLS[tool]) {
      res.status(400).json({ ok: false, error: { code: 'INVALID_TOOL', message: `Unknown tool: ${tool}` } });
      return;
    }

    const address = req.walletAddress.toLowerCase();
    const used = await getDemoQuotaUsed(address).catch(() => 0);

    if (used >= DEMO_QUOTA) {
      const now = new Date();
      const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
      res.status(429).json({
        ok: false,
        error: {
          code: 'DEMO_QUOTA_EXHAUSTED',
          message: `Playground demo limit reached (${DEMO_QUOTA}/day). Use x402 or MPP for unlimited access.`,
          details: { used, limit: DEMO_QUOTA, resetAt },
        },
      });
      return;
    }

    const { schema, fn } = TOOLS[tool];
    const parsed = schema.safeParse(args ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Input validation failed', details: parsed.error.flatten().fieldErrors } });
      return;
    }

    try {
      const newUsed = await incrementDemoQuota(address).catch(() => used + 1);
      const data = await fn(parsed.data);
      const processingMs = Date.now() - start;

      logToolCall({
        walletAddress: address,
        toolName: tool,
        inputHash: hashInput(parsed.data),
        paymentMethod: 'playground',
        amountUsdc: 0,
        cached: !!(data as Record<string, unknown>).cachedAt,
        success: true,
        errorCode: null,
        processingMs,
      }).catch(() => {});

      res.json({
        ok: true,
        data,
        meta: {
          tool,
          cached: !!(data as Record<string, unknown>).cachedAt,
          payment: 'playground',
          demoQuotaRemaining: Math.max(0, DEMO_QUOTA - newUsed),
          processingMs,
        },
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: { code: 'TOOL_ERROR', message: (err as Error).message } });
    }
  },
);

router.get('/playground/quota', validateWallet, async (req: Request, res: Response) => {
  const used = await getDemoQuotaUsed(req.walletAddress).catch(() => 0);
  const now = new Date();
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
  res.json({ ok: true, used, limit: DEMO_QUOTA, remaining: Math.max(0, DEMO_QUOTA - used), resetAt });
});

export default router;
