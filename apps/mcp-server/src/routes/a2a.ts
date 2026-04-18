/**
 * A2A (Agent-to-Agent) Protocol
 *
 * Implements Google's open Agent-to-Agent protocol for interoperability.
 * Spec: https://google.github.io/A2A/specification/
 *
 * Endpoints:
 *   GET  /.well-known/agent.json       Agent Card (discovery)
 *   GET  /.well-known/agent-card.json  Agent Card (alias)
 *   POST /a2a                          JSON-RPC 2.0 — message/send
 *   GET  /a2a/tasks/:id                Get task by ID
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { validateWallet } from '../middleware/validateWallet';
import { checkTermsVersion } from '../middleware/checkTermsVersion';
import { getRedis } from '../lib/redis';
import { config } from '../config';

const router: ReturnType<typeof Router> = Router();

const BASE_URL = 'https://mcp.lizy.world';
const TASK_TTL = 3600; // 1 hour

// ── Tool metadata for skills ──────────────────────────────────────────────────

const SKILLS = [
  {
    id: 'get_wallet_activity',
    name: 'Get Wallet Activity',
    description: 'Fetch on-chain event logs for a wallet address from the last N blocks on Abstract Mainnet.',
    tags: ['blockchain', 'wallet', 'abstract', 'logs'],
    examples: ['Get wallet activity for 0x8004A169...', 'Show last 100 blocks of transactions'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'get_reputation_score',
    name: 'Get Reputation Score',
    description: 'Retrieve on-chain reputation score and feedback from the Abstract Reputation Registry (ERC-8004).',
    tags: ['reputation', 'abstract', 'erc8004', 'identity'],
    examples: ['Get reputation score for 0x8004A169...', 'How trusted is this wallet?'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'get_identity_data',
    name: 'Get Identity Data',
    description: 'Fetch identity token metadata from the Abstract Identity Registry for a given address.',
    tags: ['identity', 'abstract', 'nft', 'erc721'],
    examples: ['Get identity for 0x8004A169...'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'get_pudgy_metadata',
    name: 'Get Pudgy Penguin Metadata',
    description: 'Get Pudgy Penguin NFT metadata (name, image, attributes) by token ID.',
    tags: ['nft', 'pudgy', 'ethereum', 'metadata'],
    examples: ['Get Pudgy Penguin #1', 'What does token 42 look like?'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'verify_pudgy_holder',
    name: 'Verify Pudgy Holder',
    description: 'Check if a wallet holds any Pudgy Penguin NFTs on Ethereum Mainnet.',
    tags: ['nft', 'pudgy', 'holder', 'verification'],
    examples: ['Does 0x8004A169... hold any Pudgy Penguins?'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'get_token_price',
    name: 'Get Token Price',
    description: 'Get on-chain token price in USD from DEX pool data on Abstract Mainnet.',
    tags: ['defi', 'price', 'token', 'uniswap', 'abstract'],
    examples: ['What is the price of PENGU?', 'Get token price for 0x9E18B8...'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'get_cross_chain_lookup',
    name: 'Cross-Chain Token Lookup',
    description: 'Look up token address mappings across chains using known bridge registries.',
    tags: ['cross-chain', 'bridge', 'token', 'multichain'],
    examples: ['Find PENGU address on Ethereum', 'What is the Ethereum address of token 0x9E18B8...?'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'transform_data',
    name: 'Transform Data',
    description: 'Transform data: JSON↔CSV conversion, SHA-256/Keccak-256 hashing, address and JSON validation.',
    tags: ['transform', 'hash', 'utility', 'crypto'],
    examples: ['SHA-256 hash of "hello"', 'Is 0x8004A169... a valid address?', 'Convert JSON to CSV'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'get_acp_job',
    name: 'Get ACP Job',
    description: 'Read an ERC-8183 Agentic Commerce Protocol job from on-chain. Returns status, parties, budget.',
    tags: ['acp', 'erc8183', 'job', 'abstract', 'agentic'],
    examples: ['Get ACP job #1', 'What is the status of job 42?'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
  {
    id: 'list_acp_jobs',
    name: 'List ACP Jobs',
    description: 'List recent ERC-8183 Agentic Commerce Protocol jobs for a wallet address.',
    tags: ['acp', 'erc8183', 'jobs', 'abstract', 'agentic'],
    examples: ['List ACP jobs for 0x8004A169... as client'],
    inputModes: ['application/json'],
    outputModes: ['application/json'],
  },
];

// ── Agent Card ─────────────────────────────────────────────────────────────────

const AGENT_CARD = {
  schemaVersion: '1.0',
  humanReadableId: 'lizy-agent/lizy',
  agentVersion: '0.3.0',
  name: 'LIZY',
  description:
    'On-chain data oracle for AI agents on Abstract Mainnet. ' +
    'Provides wallet activity, reputation scores (ERC-8004), identity data, ' +
    'Pudgy Penguin NFT metadata, token prices, ACP job state (ERC-8183), and ' +
    'data transforms — all paid via x402 micropayments in USDC.e.',
  url: `${BASE_URL}/a2a`,
  version: '0.3.0',
  protocolVersion: '0.3.0',
  provider: {
    name: 'LIZY',
    url: 'https://lizy.world',
    support_contact: 'https://lizy.world',
  },
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
    supportedMessageParts: ['text', 'data'],
  },
  authSchemes: [
    {
      scheme: 'none',
      description:
        'No session auth required. Include X-Wallet-Address header. ' +
        'Payment via x402 (X-Payment header with ERC-3009 signature) or ' +
        'MPP (Authorization: Payment header). ' +
        'Pudgy Penguin holders receive 50% discount automatically.',
    },
  ],
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  tags: ['blockchain', 'abstract', 'oracle', 'defi', 'nft', 'reputation', 'x402', 'mcp', 'erc8004', 'erc8183'],
  documentationUrl: 'https://lizy.world/docs',
  privacyPolicyUrl: 'https://lizy.world/terms',
  iconUrl: 'https://lizy.world/lizy.png',
  skills: SKILLS,
};

// ── Helper: A2A JSON-RPC response builders ────────────────────────────────────

function a2aOk(id: string | number, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function a2aError(id: string | number, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

function makeTask(id: string, contextId: string, state: string, data?: unknown, errorMsg?: string) {
  const now = new Date().toISOString();
  return {
    id,
    contextId,
    status: {
      state,
      timestamp: now,
      ...(errorMsg ? { message: { role: 'agent', parts: [{ kind: 'text', text: errorMsg }] } } : {}),
    },
    artifacts: data
      ? [{ artifactId: randomUUID(), name: 'result', parts: [{ kind: 'data', data, mediaType: 'application/json' }] }]
      : [],
  };
}

// ── Discovery endpoints ───────────────────────────────────────────────────────

router.get('/.well-known/agent.json', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(AGENT_CARD);
});

router.get('/.well-known/agent-card.json', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(AGENT_CARD);
});

router.get('/.well-known/agent-registration.json', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    humanReadableId: 'lizy-agent/lizy',
    registrationAddress: config.PAYMENT_RECIPIENT,
    name: 'LIZY',
    description:
      'On-chain data oracle for AI agents on Abstract Mainnet. ' +
      'Provides wallet activity, reputation scores (ERC-8004), identity data, ' +
      'Pudgy Penguin NFT metadata, token prices, ACP job state (ERC-8183), and ' +
      'data transforms — all paid via x402 micropayments in USDC.e.',
    serviceType: 'MCPA2A+2',
    version: '0.3.0',
    serviceUrl: BASE_URL,
    mcpUrl: `${BASE_URL}/mcp`,
    a2aUrl: `${BASE_URL}/a2a`,
    agentCardUrl: `${BASE_URL}/.well-known/agent.json`,
    chainId: 2741,
    tags: AGENT_CARD.tags,
    skills: SKILLS.map((s) => s.id),
    iconUrl: AGENT_CARD.iconUrl,
    documentationUrl: AGENT_CARD.documentationUrl,
  });
});

// ── A2A JSON-RPC endpoint ─────────────────────────────────────────────────────

router.post(
  '/a2a',
  validateWallet,
  checkTermsVersion,
  async (req: Request, res: Response) => {
    const body = req.body as { jsonrpc?: string; id?: string | number; method?: string; params?: unknown };

    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      res.status(400).json(a2aError(body?.id ?? 0, -32600, 'Invalid Request'));
      return;
    }

    const { id, method, params } = body;

    if (method !== 'message/send') {
      res.json(a2aError(id ?? 0, -32601, `Method not found: ${method}`));
      return;
    }

    // Parse params
    const p = params as {
      message?: {
        parts?: Array<{ kind: string; text?: string; data?: Record<string, unknown> }>;
        contextId?: string;
        taskId?: string;
      };
    };

    if (!p?.message?.parts?.length) {
      res.json(a2aError(id ?? 0, -32602, 'Invalid params: message.parts required'));
      return;
    }

    // Extract skill + arguments from message parts
    let skillId: string | undefined;
    let skillArgs: Record<string, unknown> = {};

    for (const part of p.message.parts) {
      if (part.kind === 'data' && part.data) {
        const { skill, tool, ...rest } = part.data as { skill?: string; tool?: string; [k: string]: unknown };
        skillId = skillId ?? skill ?? tool;
        skillArgs = { ...skillArgs, ...rest };
      } else if (part.kind === 'text' && part.text && !skillId) {
        // Try to parse JSON text as args
        try {
          const parsed = JSON.parse(part.text) as { skill?: string; tool?: string; [k: string]: unknown };
          const { skill, tool, ...rest } = parsed;
          skillId = skill ?? tool;
          skillArgs = { ...skillArgs, ...rest };
        } catch {
          // plain text — not parseable as JSON, ignore for routing
        }
      }
    }

    if (!skillId) {
      res.json(a2aError(id ?? 0, -32602, 'Invalid params: specify skill or tool in a data part'));
      return;
    }

    const contextId = p.message.contextId ?? randomUUID();
    const taskId = p.message.taskId ?? randomUUID();

    // Delegate to the tool HTTP endpoint (reuses all payment middleware)
    // Pass forwarded-host so x402 builds the correct resource URL in 402 responses
    // (Node.js fetch forbids overriding the Host header directly)
    const publicHost = new URL(BASE_URL).host;
    const toolRes = await fetch(`http://localhost:${process.env.PORT ?? 3001}/tools/${skillId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lizy-public-host': publicHost,
        'x-lizy-proto': 'https',
        'x-wallet-address': req.walletAddress,
        ...(req.headers['authorization']  ? { authorization:  req.headers['authorization'] as string }  : {}),
        ...(req.headers['x-payment']      ? { 'x-payment':    req.headers['x-payment'] as string }      : {}),
      },
      body: JSON.stringify(skillArgs),
    });

    // Forward 402 with A2A-compatible error
    if (toolRes.status === 402) {
      const errData = await toolRes.json() as { error?: unknown };
      res.status(402).json(a2aError(id ?? 0, -32053, 'Payment required', errData.error));
      return;
    }

    const toolData = await toolRes.json() as { ok: boolean; data?: unknown; error?: { message?: string } };

    if (!toolData.ok) {
      const task = makeTask(taskId, contextId, 'FAILED', undefined, toolData.error?.message ?? 'Tool error');
      // Cache failed task
      await getRedis().set(`a2a:task:${taskId}`, task, { ex: TASK_TTL }).catch(() => {});
      res.json(a2aOk(id ?? 0, { contextId, taskId, artifacts: [], status: { state: 'FAILED', timestamp: new Date().toISOString() } }));
      return;
    }

    const task = makeTask(taskId, contextId, 'COMPLETED', toolData.data);
    await getRedis().set(`a2a:task:${taskId}`, task, { ex: TASK_TTL }).catch(() => {});

    res.json(a2aOk(id ?? 0, { contextId, taskId, artifacts: task.artifacts, status: { state: 'COMPLETED', timestamp: new Date().toISOString() } }));
  },
);

// ── Task lookup ───────────────────────────────────────────────────────────────

router.get('/a2a/tasks/:id', validateWallet, async (req: Request, res: Response) => {
  const task = await getRedis().get(`a2a:task:${req.params.id}`).catch(() => null);
  if (!task) {
    res.status(404).json(a2aError(0, -32501, 'TaskNotFoundError'));
    return;
  }
  res.json({ ok: true, task });
});

export default router;
