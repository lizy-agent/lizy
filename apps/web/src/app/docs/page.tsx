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
        <section className="glass rounded-2xl p-8 mb-8">
          <h2 className="font-display text-2xl font-bold text-white mb-4">Payment</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>First 100 calls/day are free (150 for PENGU holders). After that:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="font-semibold text-white mb-2">x402</div>
                <p>Include <code className="font-mono text-neon-green">X-Payment</code> header with signed payment proof. Facilitator: <code className="font-mono text-xs">facilitator.x402.abs.xyz</code></p>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="font-semibold text-white mb-2">MPP Session</div>
                <p>Include <code className="font-mono text-neon-green">X-Mpp-Session-Id</code> header with an active MPP session. Endpoint: <code className="font-mono text-xs">mpp.abs.xyz</code></p>
              </div>
            </div>
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
