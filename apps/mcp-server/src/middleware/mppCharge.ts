/**
 * MPP Charge Payment Middleware
 *
 * Validates `Authorization: Payment <base64>` header containing an ERC-3009
 * TransferWithAuthorization signed by the client wallet.
 *
 * Protocol reference: https://docs.abs.xyz/ai-agents/payments/mpp/charge-payments
 *
 * Flow:
 *   1. Client sends request without payment header → gets 402 from x402 middleware
 *   2. Client signs ERC-3009 authorization, retries with Authorization: Payment <base64>
 *   3. This middleware validates signature + amount + recipient + nonce freshness
 *   4. If valid → sets req.mppCharged = true, skips x402
 *   5. If absent → passes through to x402 middleware
 */

import { Request, Response, NextFunction } from 'express';
import { recoverTypedDataAddress, isAddressEqual, isAddress } from 'viem';
import { config } from '../config';
import { abstractClient } from '../lib/rpc';

declare global {
  namespace Express {
    interface Request {
      mppCharged?: boolean;
      toolPriceUsdc?: number;
    }
  }
}

// ERC-3009 typed data types
const ERC3009_TYPES = {
  TransferWithAuthorization: [
    { name: 'from',        type: 'address' as const },
    { name: 'to',          type: 'address' as const },
    { name: 'value',       type: 'uint256' as const },
    { name: 'validAfter',  type: 'uint256' as const },
    { name: 'validBefore', type: 'uint256' as const },
    { name: 'nonce',       type: 'bytes32' as const },
  ],
} as const;

const AUTHORIZATION_STATE_ABI = [{
  name: 'authorizationState',
  type: 'function',
  stateMutability: 'view',
  inputs: [
    { name: 'authorizer', type: 'address' },
    { name: 'nonce',      type: 'bytes32' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

interface Erc3009Authorization {
  from:        string;
  to:          string;
  value:       string;
  validAfter:  string;
  validBefore: string;
  nonce:       string;
}

interface MppPayload {
  scheme:  string;
  payload: {
    signature:     string;
    authorization: Erc3009Authorization;
  };
}

export function createMppChargeMiddleware(priceUsdc: number) {
  return async function mppCharge(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    req.toolPriceUsdc = priceUsdc;

    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader?.startsWith('Payment ')) {
      next();
      return;
    }

    const encoded = authHeader.slice('Payment '.length).trim();
    let parsed: MppPayload;
    try {
      parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as MppPayload;
    } catch {
      next();
      return;
    }

    const { payload } = parsed;
    if (!payload?.signature || !payload?.authorization) {
      next();
      return;
    }

    const auth = payload.authorization;

    try {
      // 1. Validate recipient
      if (!isAddress(auth.to) || !isAddressEqual(auth.to as `0x${string}`, config.PAYMENT_RECIPIENT as `0x${string}`)) {
        next();
        return;
      }

      // 2. Validate amount >= required price
      const priceInMicro = BigInt(Math.round(priceUsdc * 1_000_000));
      const discountBps = req.holderPerks?.discountBps ?? 0;
      const effectivePriceMicro = priceInMicro - (priceInMicro * BigInt(discountBps)) / 10000n;
      if (BigInt(auth.value) < effectivePriceMicro) {
        next();
        return;
      }

      // 3. Validate time window
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (now < BigInt(auth.validAfter) || now > BigInt(auth.validBefore)) {
        next();
        return;
      }

      // 4. Verify ERC-3009 signature
      const recovered = await recoverTypedDataAddress({
        domain: {
          name: 'USD Coin',
          version: '2',
          chainId: config.ABSTRACT_CHAIN_ID,
          verifyingContract: config.USDC_E_ADDRESS as `0x${string}`,
        },
        types: ERC3009_TYPES,
        primaryType: 'TransferWithAuthorization',
        message: {
          from:        auth.from as `0x${string}`,
          to:          auth.to as `0x${string}`,
          value:       BigInt(auth.value),
          validAfter:  BigInt(auth.validAfter),
          validBefore: BigInt(auth.validBefore),
          nonce:       auth.nonce as `0x${string}`,
        },
        signature: payload.signature as `0x${string}`,
      });

      if (!isAddressEqual(recovered, req.walletAddress as `0x${string}`)) {
        next();
        return;
      }

      // 5. Check nonce hasn't been used on-chain (prevents replay)
      const nonceUsed = await abstractClient.readContract({
        address: config.USDC_E_ADDRESS as `0x${string}`,
        abi:     AUTHORIZATION_STATE_ABI,
        functionName: 'authorizationState',
        args:    [auth.from as `0x${string}`, auth.nonce as `0x${string}`],
      }).catch(() => false);

      if (nonceUsed) {
        next();
        return;
      }

      req.mppCharged = true;
    } catch {
      // Any verification failure → fall through to x402
    }

    next();
  };
}
