import { Router } from 'express';
import { validateWallet } from '../middleware/validateWallet';
import { checkTermsVersion } from '../middleware/checkTermsVersion';
import { sanitizeInputs } from '../middleware/sanitizeInputs';
import { rateLimit } from '../middleware/rateLimit';
import { mppSession } from '../middleware/mppSession';
import { createMppChargeMiddleware } from '../middleware/mppCharge';
import { checkHolderPerks } from '../middleware/checkHolderPerks';
import { createX402Middleware } from '../middleware/x402';
import { injectQuotaHeaders } from '../middleware/injectQuotaHeaders';
import { hashInput } from '../lib/ip';
import { logToolCall } from '../lib/supabase';

import {
  walletActivitySchema,
  reputationScoreSchema,
  identityDataSchema,
  getWalletActivity,
  getReputationScore,
  getIdentityData,
  PRICES as ORACLE_PRICES,
} from '../tools/onchain-oracle';

import {
  pudgyMetadataSchema,
  verifyPudgyHolderSchema,
  getPudgyMetadata,
  verifyPudgyHolder,
  PRICES as PUDGY_PRICES,
} from '../tools/pudgy-penguins';

import {
  tokenPriceSchema,
  crossChainLookupSchema,
  getTokenPrice,
  getCrossChainLookup,
  PRICES as TOKEN_PRICES,
} from '../tools/token-price';

import { transformDataSchema, transformData, PRICE as TRANSFORM_PRICE } from '../tools/data-transform';

const router: ReturnType<typeof Router> = Router();

// Shared middleware chain (applied to all tool routes)
const sharedMiddleware = [
  validateWallet,
  checkTermsVersion,
  sanitizeInputs,
  rateLimit,
  mppSession,
  checkHolderPerks,
  injectQuotaHeaders,
];

function buildToolMiddleware(price: number) {
  return [
    ...sharedMiddleware,
    createMppChargeMiddleware(price),
    createX402Middleware(price),
  ];
}

function wrapTool<TIn, TOut>(
  schema: { safeParse: (data: unknown) => { success: true; data: TIn } | { success: false; error: { flatten: () => { fieldErrors: Record<string, string[]> } } } },
  toolFn: (input: TIn) => Promise<TOut>,
  toolName: string,
  price: number,
) {
  return async (req: import('express').Request, res: import('express').Response) => {
    const start = Date.now();
    const input = { ...req.body, ...(req.query ?? {}) };
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    try {
      const data = await toolFn(parsed.data);
      const processingMs = Date.now() - start;
      const paymentMethod = req.mppCharged ? 'mpp' : 'x402';

      const effectivePrice = req.holderPerks?.isPudgyHolder
        ? price * (1 - (req.holderPerks.discountBps ?? 0) / 10000)
        : price;

      logToolCall({
        walletAddress: req.walletAddress,
        toolName,
        inputHash: hashInput(parsed.data),
        paymentMethod,
        amountUsdc: effectivePrice,
        cached: !!(data as Record<string, unknown>).cachedAt,
        success: true,
        errorCode: null,
        processingMs,
      }).catch(() => {});

      res.json({
        ok: true,
        data,
        meta: {
          tool: toolName,
          cached: !!(data as Record<string, unknown>).cachedAt,
          payment: paymentMethod,
          processingMs,
        },
      });
    } catch (err) {
      const processingMs = Date.now() - start;
      logToolCall({
        walletAddress: req.walletAddress,
        toolName,
        inputHash: hashInput(parsed.data),
        paymentMethod: 'free_quota',
        amountUsdc: 0,
        cached: false,
        success: false,
        errorCode: 'TOOL_ERROR',
        processingMs,
      }).catch(() => {});

      res.status(500).json({
        ok: false,
        error: {
          code: 'TOOL_ERROR',
          message: (err as Error).message ?? 'Tool execution failed',
        },
      });
    }
  };
}

// ── Oracle Routes ─────────────────────────────────────────────────────────────
router.post(
  '/get_wallet_activity',
  buildToolMiddleware(ORACLE_PRICES.get_wallet_activity),
  wrapTool(walletActivitySchema, getWalletActivity, 'get_wallet_activity', ORACLE_PRICES.get_wallet_activity),
);

router.post(
  '/get_reputation_score',
  buildToolMiddleware(ORACLE_PRICES.get_reputation_score),
  wrapTool(reputationScoreSchema, getReputationScore, 'get_reputation_score', ORACLE_PRICES.get_reputation_score),
);

router.post(
  '/get_identity_data',
  buildToolMiddleware(ORACLE_PRICES.get_identity_data),
  wrapTool(identityDataSchema, getIdentityData, 'get_identity_data', ORACLE_PRICES.get_identity_data),
);

// ── Pudgy Penguin Routes ──────────────────────────────────────────────────────
router.post(
  '/get_pudgy_metadata',
  buildToolMiddleware(PUDGY_PRICES.get_pudgy_metadata),
  wrapTool(pudgyMetadataSchema, getPudgyMetadata, 'get_pudgy_metadata', PUDGY_PRICES.get_pudgy_metadata),
);

router.post(
  '/verify_pudgy_holder',
  buildToolMiddleware(PUDGY_PRICES.verify_pudgy_holder),
  wrapTool(verifyPudgyHolderSchema, verifyPudgyHolder, 'verify_pudgy_holder', PUDGY_PRICES.verify_pudgy_holder),
);

// ── Token Price Routes ────────────────────────────────────────────────────────
router.post(
  '/get_token_price',
  buildToolMiddleware(TOKEN_PRICES.get_token_price),
  wrapTool(tokenPriceSchema, getTokenPrice, 'get_token_price', TOKEN_PRICES.get_token_price),
);

router.post(
  '/get_cross_chain_lookup',
  buildToolMiddleware(TOKEN_PRICES.get_cross_chain_lookup),
  wrapTool(crossChainLookupSchema, getCrossChainLookup, 'get_cross_chain_lookup', TOKEN_PRICES.get_cross_chain_lookup),
);

// ── Transform Route ───────────────────────────────────────────────────────────
router.post(
  '/transform_data',
  buildToolMiddleware(TRANSFORM_PRICE),
  wrapTool(transformDataSchema, transformData, 'transform_data', TRANSFORM_PRICE),
);

export default router;
