import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'LIZY MCP server API documentation and integration guide.',
};

const TOOLS_DOCS = [
  {
    name: 'get_wallet_activity',
    price: '$0.005',
    input: '{ address: string, blockRange?: number }',
    output: '{ address, fromBlock, toBlock, logCount, logs[] }',
    description: 'Fetches eth_getLogs for a wallet address from the last N blocks (max 1000) on Abstract Mainnet.',
  },
  {
    name: 'get_reputation_score',
    price: '$0.003',
    input: '{ address: string }',
    output: '{ address, totalScore, positiveCount, negativeCount, neutralCount, recentFeedback[] }',
    description: 'Reads getSummary() and readFeedback() from the Abstract Reputation Registry (0x8004BAa...).',
  },
  {
    name: 'get_identity_data',
    price: '$0.002',
    input: '{ address: string }',
    output: '{ address, tokenId?, tokenURI?, metadata?, hasIdentity }',
    description: 'Reads tokenURI() from the Abstract Identity Registry (0x8004A16...).',
  },
  {
    name: 'get_pudgy_metadata',
    price: '$0.004',
    input: '{ tokenId: number }',
    output: '{ tokenId, name, description, image, attributes[] }',
    description: 'Reads tokenURI() from Pudgy Penguins contract on Ethereum Mainnet (0xBd3531...).',
  },
  {
    name: 'verify_pudgy_holder',
    price: '$0.002',
    input: '{ address: string }',
    output: '{ address, isHolder, balance, tokenIds[] }',
    description: 'Checks balanceOf() and tokensOfOwner() on Pudgy Penguins (Ethereum Mainnet only).',
  },
  {
    name: 'get_token_price',
    price: '$0.003',
    input: '{ tokenAddress: string, chainId?: number, quoteToken?: string }',
    output: '{ tokenAddress, chainId, priceUsd, priceInQuote, quoteToken, poolAddress?, liquidity? }',
    description: 'Reads slot0() from Uniswap V3 pool contracts on Abstract Mainnet.',
  },
  {
    name: 'get_cross_chain_lookup',
    price: '$0.005',
    input: '{ tokenAddress: string, sourceChainId: number, targetChainId: number }',
    output: '{ sourceChainId, targetChainId, sourceAddress, targetAddress?, bridgeSupported }',
    description: 'Looks up token address mappings across chains using known bridge registries.',
  },
  {
    name: 'transform_data',
    price: '$0.001',
    input: '{ operation: string, data: string, options?: object }',
    output: '{ operation, result, valid?, error? }',
    description: 'CPU-only transforms: json_to_csv, csv_to_json, sha256, keccak256, validate_address, validate_json.',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-4">Documentation</h1>
        <p className="text-muted-foreground mb-12 text-lg">
          LIZY implements the Model Context Protocol (MCP) JSON-RPC 2.0 over HTTP.
        </p>

        {/* Quick start */}
        <section className="glass rounded-2xl p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-white mb-4">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Endpoint</h3>
              <code className="block glass rounded-lg p-3 font-mono text-sm text-neon-green">
                POST https://mcp.lizy.world/mcp
              </code>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Required Headers</h3>
              <pre className="glass rounded-lg p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
{`X-Wallet-Address: 0xYourAbstractWallet
Content-Type: application/json`}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Example Request</h3>
              <pre className="glass rounded-lg p-4 font-mono text-xs text-neon-green overflow-x-auto">
{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_wallet_activity",
    "arguments": {
      "address": "0xYourAddress",
      "blockRange": 100
    }
  }
}`}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">MCP Config (Claude Desktop / Cursor)</h3>
              <pre className="glass rounded-lg p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
{`{
  "mcpServers": {
    "lizy": {
      "url": "https://mcp.lizy.world/mcp",
      "headers": {
        "X-Wallet-Address": "0xYourWallet"
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section id="payment" className="glass rounded-2xl p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-white mb-2">Payment</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Every call requires payment via x402 (per-call) or MPP (session-based). Pudgy Penguin holders receive a 50% discount automatically. The <a href="/playground" className="text-neon-green underline">Playground</a> gives you 20 free demo calls per day to explore the API first.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border border-neon-green/20">
              <div className="font-semibold text-white mb-1">x402 — Pay Per Call</div>
              <p className="text-xs text-muted-foreground">Sign an ERC-3009 <code className="font-mono text-neon-green">TransferWithAuthorization</code> for each request. No session needed. Verified on-chain by the Abstract facilitator.</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="font-semibold text-white mb-1">MPP — Session Billing</div>
              <p className="text-xs text-muted-foreground">Open a payment session with MPP, then pass <code className="font-mono text-neon-green">X-Mpp-Session-Id</code>. Calls are streamed off-chain against your session balance.</p>
            </div>
          </div>

          {/* 402 flow */}
          <h3 className="text-base font-semibold text-white mb-3">x402 Flow</h3>
          <ol className="text-sm text-muted-foreground space-y-1 mb-4 list-decimal list-inside">
            <li>Send your request without a payment header.</li>
            <li>Receive HTTP <code className="font-mono text-neon-green">402</code> with payment details in the response body.</li>
            <li>Sign a <code className="font-mono text-neon-green">TransferWithAuthorization</code> EIP-712 message with your wallet.</li>
            <li>Retry the request with <code className="font-mono text-neon-green">X-Payment: &lt;base64-payload&gt;</code>.</li>
          </ol>

          <h3 className="text-sm font-semibold text-white mb-2">402 Response Shape</h3>
          <pre className="glass rounded-lg p-4 font-mono text-xs text-muted-foreground overflow-x-auto mb-6">
{`HTTP/1.1 402 Payment Required
{
  "ok": false,
  "error": {
    "code": "PAYMENT_REQUIRED",
    "details": {
      "x402": {
        "scheme": "exact",
        "network": "abstract-2741",
        "maxAmountRequired": "5000",      // in USDC micro-units (6 decimals)
        "payTo": "0x<LIZY_RECIPIENT>",
        "asset":  "0x<USDC_E_CONTRACT>",  // USDC.e on Abstract Mainnet
        "maxTimeoutSeconds": 300,
        "extra": { "facilitator": "https://facilitator.x402.abs.xyz" }
      }
    }
  }
}`}
          </pre>

          <h3 className="text-sm font-semibold text-white mb-2">Sign & Retry (TypeScript + viem)</h3>
          <pre className="glass rounded-lg p-4 font-mono text-xs text-neon-green overflow-x-auto mb-6">
{`import { createWalletClient, http, toHex } from 'viem';
import { abstract } from 'viem/chains';
import { randomBytes } from 'crypto';

const MCP_URL   = 'https://mcp.lizy.world';
const WALLET    = '0xYourAbstractWallet';

async function callWithPayment(toolName: string, args: object) {
  // 1. Initial request — expect 402
  const probe = await fetch(\`\${MCP_URL}/mcp\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': WALLET },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: toolName, arguments: args } }),
  });

  if (probe.status !== 402) return probe.json(); // already paid or error

  const { error } = await probe.json();
  const { payTo, asset, maxAmountRequired, maxTimeoutSeconds } = error.details.x402;

  // 2. Sign ERC-3009 TransferWithAuthorization
  const nonce       = toHex(randomBytes(32));
  const validAfter  = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + maxTimeoutSeconds);

  const signature = await walletClient.signTypedData({
    domain: {
      name: 'USD Coin',
      version: '2',
      chainId: 2741,              // Abstract Mainnet
      verifyingContract: asset,   // USDC.e contract
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from',        type: 'address' },
        { name: 'to',          type: 'address' },
        { name: 'value',       type: 'uint256' },
        { name: 'validAfter',  type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce',       type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: {
      from:        WALLET,
      to:          payTo,
      value:       BigInt(maxAmountRequired),
      validAfter,
      validBefore,
      nonce,
    },
  });

  // 3. Build X-Payment header (base64-encoded JSON)
  const payment = btoa(JSON.stringify({
    scheme:  'exact',
    network: 'abstract-2741',
    payload: {
      signature,
      authorization: {
        from:        WALLET,
        to:          payTo,
        value:       maxAmountRequired,
        validAfter:  String(validAfter),
        validBefore: String(validBefore),
        nonce,
      },
    },
  }));

  // 4. Retry with payment
  const paid = await fetch(\`\${MCP_URL}/mcp\`, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Wallet-Address': WALLET,
      'X-Payment':        payment,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: toolName, arguments: args } }),
  });

  return paid.json();
}`}
          </pre>

          {/* MPP */}
          <h3 className="text-base font-semibold text-white mb-3">MPP Session Flow</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Open an MPP session once, then reuse the session ID across many calls without re-signing each time. Ideal for agents making many sequential tool calls.
          </p>
          <pre className="glass rounded-lg p-4 font-mono text-xs text-neon-green overflow-x-auto mb-4">
{`// 1. Open MPP session (deposit USDC.e against a session)
const session = await fetch('https://mpp.abs.xyz/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: WALLET,
    amountUsdc: 1.00,   // pre-fund 1 USDC.e
    chainId: 2741,
  }),
}).then(r => r.json());

const sessionId = session.sessionId;  // keep this

// 2. Call LIZY with session header
const res = await fetch(\`\${MCP_URL}/mcp\`, {
  method: 'POST',
  headers: {
    'Content-Type':     'application/json',
    'X-Wallet-Address':  WALLET,
    'X-Mpp-Session-Id':  sessionId,
  },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'get_wallet_activity', arguments: { address: WALLET } } }),
});`}
          </pre>

          {/* Pudgy discount */}
          <div className="glass rounded-xl p-4 border border-neon-green/10 text-xs text-muted-foreground">
            <span className="text-neon-green font-semibold">Pudgy Penguin holders</span> — 50% discount applied automatically. The server detects your wallet&apos;s balance on Ethereum Mainnet and halves the <code className="font-mono">maxAmountRequired</code> in the 402 response. No extra steps needed.
          </div>
        </section>

        {/* Tools reference */}
        <section>
          <h2 className="font-display text-2xl font-bold text-white mb-6">Tool Reference</h2>
          <div className="space-y-4">
            {TOOLS_DOCS.map((tool) => (
              <div key={tool.name} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <code className="font-mono font-bold text-neon-green text-sm">{tool.name}</code>
                  <span className="text-xs glass px-2 py-1 rounded-full text-muted-foreground">{tool.price} / call</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground/60 mb-1">Input</div>
                    <code className="text-xs font-mono text-muted-foreground block">{tool.input}</code>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground/60 mb-1">Output</div>
                    <code className="text-xs font-mono text-muted-foreground block">{tool.output}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
