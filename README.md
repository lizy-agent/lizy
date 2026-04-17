# LIZY — The data layer AI agents pay to use.

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/lizy_agent?style=social)](https://twitter.com/lizy_agent)

**Domain:** https://lizy.world  
**Chain:** Abstract Mainnet (chainId 2741)

LIZY is a monetized MCP (Model Context Protocol) data layer that AI agents pay to use. It provides on-chain data tools with x402 micropayments and MPP session billing.

## Architecture

```
lizy/
├── apps/
│   ├── mcp-server/     ← MCP + payment server (Express)
│   └── web/            ← Next.js 15 frontend
├── packages/types/     ← Shared TypeScript types
├── agent/              ← Agent registration files
├── supabase/migrations/
└── .github/workflows/
```

## Tools

| Tool | Description | Price |
|------|-------------|-------|
| `get_wallet_activity` | eth_getLogs last 1000 blocks | $0.005 USDC.e |
| `get_reputation_score` | Reputation Registry summary | $0.003 USDC.e |
| `get_identity_data` | Identity Registry tokenURI | $0.002 USDC.e |
| `get_pudgy_metadata` | Pudgy Penguins NFT metadata | $0.004 USDC.e |
| `verify_pudgy_holder` | Verify Pudgy Penguin ownership | $0.002 USDC.e |
| `get_token_price` | On-chain DEX price aggregation | $0.003 USDC.e |
| `get_cross_chain_lookup` | Cross-chain token lookup | $0.005 USDC.e |
| `transform_data` | JSON↔CSV, hash, validate | $0.001 USDC.e |

## Free Tier

- **Default:** 100 calls/day
- **PENGU holder:** 150 calls/day (+50)
- **Pudgy Penguin holder:** 50% discount on all tools

## Tech Stack

- **Runtime:** Node.js 22, TypeScript
- **MCP Server:** Express.js
- **Frontend:** Next.js 15 App Router, Tailwind CSS, shadcn/ui, framer-motion
- **Chain:** Abstract Mainnet (chainId 2741)
- **Payments:** x402 + MPP using USDC.e
- **Wallet:** Abstract Global Wallet (AGW)
- **Database:** Supabase
- **Cache:** Upstash Redis

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run development
pnpm dev

# Build
pnpm build
```

## License

[BUSL-1.1](LICENSE) — © 2024 LIZY Labs
