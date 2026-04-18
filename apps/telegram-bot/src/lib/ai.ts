import Anthropic from '@anthropic-ai/sdk';
import { lizy } from './lizy.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are LIZY, an AI-native data agent for the Abstract blockchain ecosystem. You help users understand their on-chain activity, check balances, track wallet reputation, look up transactions, and more.

Abstract Mainnet is an EVM-compatible chain (chainId 2741). All data comes live from the chain.

Guidelines:
- Be concise and friendly. Use *bold* for numbers, \`code\` for addresses/hashes.
- When showing addresses, show full address unless space is tight.
- Provide context and insights, not just raw data. If balance is 0, mention they can fund via Abstract bridge.
- If a tool fails with "Insufficient USDC.e balance", tell user to top up USDC.e on their wallet address first.
- All amounts: ETH shows 6 decimal places, USDC.e shows 2 decimal places.
- Prices in USD shown as $X.XX`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_wallet_balance',
    description: 'Get ETH and ERC-20 token balances for a wallet address on Abstract Mainnet',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address. Omit to use the user\'s own wallet.' },
      },
    },
  },
  {
    name: 'get_wallet_activity',
    description: 'Get recent on-chain transactions and events for a wallet on Abstract Mainnet',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address. Omit to use the user\'s own wallet.' },
        blockRange: { type: 'number', description: 'Number of recent blocks to scan (default 200)' },
      },
    },
  },
  {
    name: 'get_transaction',
    description: 'Get details for a specific transaction by hash on Abstract Mainnet',
    input_schema: {
      type: 'object',
      properties: {
        txHash: { type: 'string', description: 'Transaction hash starting with 0x' },
      },
      required: ['txHash'],
    },
  },
  {
    name: 'get_reputation_score',
    description: 'Get the ERC-8004 on-chain reputation score for a wallet address',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address. Omit to use the user\'s own wallet.' },
      },
    },
  },
  {
    name: 'get_identity_data',
    description: 'Get Abstract identity token data (name, image) for a wallet address',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address. Omit to use the user\'s own wallet.' },
      },
    },
  },
  {
    name: 'verify_pudgy_holder',
    description: 'Check if a wallet holds Pudgy Penguins NFTs (holders get 50% discount on LIZY tools)',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address. Omit to use the user\'s own wallet.' },
      },
    },
  },
  {
    name: 'get_token_price',
    description: 'Get the live DEX price (in USD) for a token on Abstract Mainnet',
    input_schema: {
      type: 'object',
      properties: {
        tokenAddress: { type: 'string', description: 'Token contract address on Abstract Mainnet' },
      },
      required: ['tokenAddress'],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  walletAddress: string,
  privateKey: `0x${string}`,
): Promise<string> {
  const addr = (input.address as string | undefined) || walletAddress;
  try {
    switch (name) {
      case 'get_wallet_balance':
        return JSON.stringify(await lizy.balance(walletAddress, privateKey, addr));
      case 'get_wallet_activity':
        return JSON.stringify(await lizy.activity(walletAddress, privateKey, addr, (input.blockRange as number) || 200));
      case 'get_transaction':
        return JSON.stringify(await lizy.tx(walletAddress, privateKey, input.txHash as string));
      case 'get_reputation_score':
        return JSON.stringify(await lizy.reputation(walletAddress, privateKey, addr));
      case 'get_identity_data':
        return JSON.stringify(await lizy.identity(walletAddress, privateKey, addr));
      case 'verify_pudgy_holder':
        return JSON.stringify(await lizy.pudgy(walletAddress, privateKey, addr));
      case 'get_token_price':
        return JSON.stringify(await lizy.price(walletAddress, privateKey, input.tokenAddress as string));
      default:
        return JSON.stringify({ error: 'Unknown tool' });
    }
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message });
  }
}

export async function runAgent(
  userMessage: string,
  walletAddress: string,
  privateKey: `0x${string}`,
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const userContext = `\nUser's wallet address: \`${walletAddress}\``;

  for (let i = 0; i < 8; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        { type: 'text', text: SYSTEM_PROMPT + userContext, cache_control: { type: 'ephemeral' } },
      ],
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('') || 'Done.';
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input as Record<string, unknown>, walletAddress, privateKey);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }

  return 'Sorry, I could not complete the request. Please try again.';
}
