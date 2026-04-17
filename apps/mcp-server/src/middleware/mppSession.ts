/**
 * MPP Session Payment Middleware
 *
 * Parses `Authorization: Payment <base64>` header for session-mode MPP payments.
 * Session payments use cumulative off-chain vouchers backed by an on-chain escrow.
 *
 * Escrow contract (Abstract Mainnet): 0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c
 * Protocol reference: https://docs.abs.xyz/ai-agents/payments/mpp/session-payments
 *
 * This middleware runs BEFORE mppCharge and x402. It detects session vouchers
 * (scheme: "mpp-session") and validates them against the escrow contract.
 * Charge payments (scheme: "mpp-charge") are handled by mppCharge middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { recoverTypedDataAddress, isAddressEqual, isAddress } from 'viem';
import { config } from '../config';
import { abstractClient } from '../lib/rpc';

// MPP Escrow contract on Abstract Mainnet (source: docs.abs.xyz)
const MPP_ESCROW_ADDRESS = '0x29635C384f451a72ED2e2a312BCeb8b0bDC0923c';

declare global {
  namespace Express {
    interface Request {
      mppSessionId?: string;
      mppBalance?: bigint;
    }
  }
}

const ESCROW_ABI = [
  {
    name: 'getChannel',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'client',  type: 'address' },
          { name: 'server',  type: 'address' },
          { name: 'token',   type: 'address' },
          { name: 'deposit', type: 'uint256' },
          { name: 'spent',   type: 'uint256' },
          { name: 'closed',  type: 'bool' },
        ],
      },
    ],
  },
] as const;

const VOUCHER_TYPES = {
  Voucher: [
    { name: 'channelId',       type: 'bytes32'  as const },
    { name: 'cumulativeAmount', type: 'uint256' as const },
    { name: 'nonce',           type: 'uint256'  as const },
  ],
} as const;

interface SessionVoucher {
  channelId:        string;
  cumulativeAmount: string;
  nonce:            string;
  signature:        string;
}

interface MppSessionPayload {
  scheme:  'mpp-session';
  payload: SessionVoucher;
}

export async function mppSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'] as string | undefined;
  if (!authHeader?.startsWith('Payment ')) {
    next();
    return;
  }

  const encoded = authHeader.slice('Payment '.length).trim();
  let parsed: MppSessionPayload;
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (decoded?.scheme !== 'mpp-session') {
      next();
      return;
    }
    parsed = decoded as MppSessionPayload;
  } catch {
    next();
    return;
  }

  const voucher = parsed.payload;
  if (!voucher?.channelId || !voucher?.cumulativeAmount || !voucher?.signature) {
    next();
    return;
  }

  try {
    // Read channel state from escrow contract
    const channel = await abstractClient.readContract({
      address: MPP_ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'getChannel',
      args: [voucher.channelId as `0x${string}`],
    }).catch(() => null);

    if (!channel || channel.closed) {
      next();
      return;
    }

    // Verify the channel's client matches the wallet
    if (!isAddress(channel.client) || !isAddressEqual(channel.client, req.walletAddress as `0x${string}`)) {
      next();
      return;
    }

    // Verify the voucher signature
    const recovered = await recoverTypedDataAddress({
      domain: {
        name: 'MPP Escrow',
        version: '1',
        chainId: config.ABSTRACT_CHAIN_ID,
        verifyingContract: MPP_ESCROW_ADDRESS as `0x${string}`,
      },
      types: VOUCHER_TYPES,
      primaryType: 'Voucher',
      message: {
        channelId:        voucher.channelId as `0x${string}`,
        cumulativeAmount: BigInt(voucher.cumulativeAmount),
        nonce:            BigInt(voucher.nonce),
      },
      signature: voucher.signature as `0x${string}`,
    });

    if (!isAddressEqual(recovered, req.walletAddress as `0x${string}`)) {
      next();
      return;
    }

    // Remaining balance = deposit - already spent on-chain - new amount
    const available = channel.deposit - channel.spent;
    if (available > 0n) {
      req.mppSessionId = voucher.channelId;
      req.mppBalance   = available;
    }
  } catch {
    // Any failure is non-fatal → fall through to charge/x402
  }

  next();
}
