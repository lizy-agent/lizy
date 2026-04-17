/**
 * MCP (Model Context Protocol) JSON-RPC 2.0 endpoint
 * Handles tools/list, tools/call, initialize, ping
 */

import { Router, Request, Response } from 'express';
import { validateWallet } from '../middleware/validateWallet';
import { sanitizeInputs } from '../middleware/sanitizeInputs';
import { rateLimit } from '../middleware/rateLimit';
import { mppSession } from '../middleware/mppSession';
import { checkHolderPerks } from '../middleware/checkHolderPerks';
import { logMcpTelemetry } from '../lib/supabase';
import { McpRequest, McpResponse, McpToolDefinition, ToolName } from '@lizy/types';
import { PRICES as ORACLE_PRICES } from '../tools/onchain-oracle';
import { PRICES as PUDGY_PRICES } from '../tools/pudgy-penguins';
import { PRICES as TOKEN_PRICES } from '../tools/token-price';
import { PRICE as TRANSFORM_PRICE } from '../tools/data-transform';
import { PRICES as ACP_PRICES } from '../tools/acp';

const router: ReturnType<typeof Router> = Router();

const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_wallet_activity',
    description: 'Fetch on-chain event logs for a wallet address from the last N blocks on Abstract Mainnet.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address (0x...)' },
        blockRange: { type: 'number', description: 'Number of recent blocks to scan (1-1000, default 1000)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_reputation_score',
    description: 'Retrieve reputation score and recent feedback from the Abstract Reputation Registry.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address (0x...)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_identity_data',
    description: 'Fetch identity token metadata from the Abstract Identity Registry for a given address.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address (0x...)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_pudgy_metadata',
    description: 'Get Pudgy Penguin NFT metadata by token ID (Ethereum Mainnet contract).',
    inputSchema: {
      type: 'object',
      properties: {
        tokenId: { type: 'number', description: 'Pudgy Penguin token ID (0-8887)' },
      },
      required: ['tokenId'],
    },
  },
  {
    name: 'verify_pudgy_holder',
    description: 'Verify if a wallet address holds any Pudgy Penguin NFTs on Ethereum Mainnet.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address (0x...)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_token_price',
    description: 'Get on-chain token price from DEX pool data on Abstract Mainnet.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Token contract address' },
        chainId: { type: 'number', description: 'Chain ID (default 2741)' },
        quoteToken: { type: 'string', description: 'Quote token address (default USDC.e)' },
      },
      required: ['tokenAddress'],
    },
  },
  {
    name: 'get_cross_chain_lookup',
    description: 'Look up a token address mapping across chains using known bridge registries.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Source token address' },
        sourceChainId: { type: 'number', description: 'Source chain ID' },
        targetChainId: { type: 'number', description: 'Target chain ID' },
      },
      required: ['tokenAddress', 'sourceChainId', 'targetChainId'],
    },
  },
  {
    name: 'transform_data',
    description: 'Transform data: JSON↔CSV, sha256, keccak256, validate_address, validate_json.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['json_to_csv', 'csv_to_json', 'sha256', 'keccak256', 'validate_address', 'validate_json'],
        },
        data: { type: 'string', description: 'Data to transform (max 64KB)' },
        options: { type: 'object', description: 'Optional transform parameters' },
      },
      required: ['operation', 'data'],
    },
  },
  {
    name: 'get_acp_job',
    description: 'Read an ERC-8183 Agentic Commerce Protocol job from the on-chain ACP contract. Returns job state, parties, budget, and status.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'number', description: 'ACP job ID' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'list_acp_jobs',
    description: 'List recent ACP jobs for a client or provider address. Returns job summaries with status and budget.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'EVM wallet address (0x...)' },
        role:    { type: 'string', enum: ['client', 'provider'], description: 'Filter by role (default: client)' },
        limit:   { type: 'number', description: 'Max results (1-50, default 10)' },
      },
      required: ['address'],
    },
  },
];

const TOOL_PRICES: Record<ToolName, number> = {
  get_wallet_activity: ORACLE_PRICES.get_wallet_activity,
  get_reputation_score: ORACLE_PRICES.get_reputation_score,
  get_identity_data: ORACLE_PRICES.get_identity_data,
  get_pudgy_metadata: PUDGY_PRICES.get_pudgy_metadata,
  verify_pudgy_holder: PUDGY_PRICES.verify_pudgy_holder,
  get_token_price: TOKEN_PRICES.get_token_price,
  get_cross_chain_lookup: TOKEN_PRICES.get_cross_chain_lookup,
  transform_data: TRANSFORM_PRICE,
  get_acp_job:    ACP_PRICES.get_acp_job,
  list_acp_jobs:  ACP_PRICES.list_acp_jobs,
};

function jsonrpcError(id: string | number, code: number, message: string, data?: unknown): McpResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function jsonrpcOk(id: string | number, result: unknown): McpResponse {
  return { jsonrpc: '2.0', id, result };
}

// MCP protocol handler
router.post(
  '/mcp',
  validateWallet,
  sanitizeInputs,
  rateLimit,
  mppSession,
  checkHolderPerks,
  async (req: Request, res: Response) => {
    const start = Date.now();
    const body = req.body as McpRequest;

    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      res.status(400).json(jsonrpcError(body?.id ?? 0, -32600, 'Invalid Request'));
      return;
    }

    const { id, method, params } = body;

    try {
      switch (method) {
        case 'initialize': {
          res.json(jsonrpcOk(id, {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'lizy-mcp-server', version: '0.1.0' },
          }));
          break;
        }

        case 'ping': {
          res.json(jsonrpcOk(id, {}));
          break;
        }

        case 'tools/list': {
          res.json(jsonrpcOk(id, { tools: MCP_TOOLS }));
          break;
        }

        case 'tools/call': {
          const { name, arguments: args } = params as { name: ToolName; arguments: Record<string, unknown> };

          if (!name || !TOOL_PRICES[name]) {
            res.json(jsonrpcError(id, -32602, `Unknown tool: ${name}`));
            return;
          }

          // Delegate to tool HTTP endpoint internally
          const toolRes = await fetch(`http://localhost:${process.env.PORT ?? 3001}/tools/${name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-wallet-address': req.walletAddress,
              ...(req.headers['x-wallet-signature'] ? { 'x-wallet-signature': req.headers['x-wallet-signature'] as string } : {}),
              ...(req.headers['authorization']       ? { 'authorization':       req.headers['authorization'] as string }       : {}),
              ...(req.headers['x-payment']           ? { 'x-payment':           req.headers['x-payment'] as string }           : {}),
            },
            body: JSON.stringify(args ?? {}),
          });

          const toolData = await toolRes.json() as { ok: boolean; data?: unknown; error?: { message: string } };

          if (!toolData.ok) {
            if (toolRes.status === 402) {
              // Forward 402 as MCP error with payment details
              res.status(402).json(jsonrpcError(id, -32000, 'Payment required', toolData.error));
            } else {
              res.json(jsonrpcError(id, -32603, toolData.error?.message ?? 'Tool error'));
            }
            return;
          }

          res.json(jsonrpcOk(id, {
            content: [{ type: 'text', text: JSON.stringify(toolData.data) }],
          }));
          break;
        }

        default:
          res.json(jsonrpcError(id, -32601, `Method not found: ${method}`));
      }
    } catch (err) {
      res.json(jsonrpcError(id, -32603, (err as Error).message));
    } finally {
      logMcpTelemetry({
        sessionId: req.mppSessionId ?? null,
        walletAddress: req.walletAddress ?? null,
        method,
        toolName: method === 'tools/call' ? ((params as { name?: ToolName })?.name ?? null) : null,
        latencyMs: Date.now() - start,
        errorCode: null,
      }).catch(() => {});
    }
  },
);

// SSE endpoint for MCP streaming (optional transport)
router.get('/mcp/sse', validateWallet, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', server: 'lizy-mcp-server' })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  req.on('close', () => clearInterval(keepAlive));
});

// Terms agreement endpoint
router.post('/terms/agree', validateWallet, async (req: Request, res: Response) => {
  const { version } = req.body as { version?: number };
  const { recordTermsAgreement } = await import('../lib/supabase');
  await recordTermsAgreement(req.walletAddress, version ?? 1, req.ipHash);
  res.json({ ok: true });
});

export default router;
