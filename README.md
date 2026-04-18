# LIZY — AI-native data layer for the Abstract ecosystem.

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/lizy_agent?style=social)](https://twitter.com/lizy_agent)

**Domain:** https://lizy.world  
**Chain:** Abstract Mainnet (chainId 2741)

LIZY is the AI-native data layer for the Abstract ecosystem. AI agents query on-chain reputation (ERC-8004), identity, ACP job state (ERC-8183), Pudgy NFT data, and token prices — paid per-call via x402 micropayments in USDC.e. Utility tools are free.

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

**Abstract Core**

| Tool | Description | Price |
|------|-------------|-------|
| `get_wallet_activity` | eth_getLogs last N blocks | $0.005 USDC.e |
| `get_wallet_balance` | ETH + ERC20 balances | $0.002 USDC.e |
| `get_transaction` | Transaction details by hash | $0.003 USDC.e |
| `get_reputation_score` | Reputation Registry (ERC-8004) | $0.003 USDC.e |
| `get_identity_data` | Identity Registry tokenURI | $0.002 USDC.e |
| `get_token_price` | On-chain DEX price aggregation | $0.003 USDC.e |

**ACP (ERC-8183)**

| Tool | Description | Price |
|------|-------------|-------|
| `get_acp_job` | Read ACP job — status, parties, budget | $0.002 USDC.e |
| `list_acp_jobs` | List ACP jobs for a wallet | $0.003 USDC.e |

**Pudgy Ecosystem**

| Tool | Description | Price |
|------|-------------|-------|
| `verify_pudgy_holder` | Verify Pudgy Penguin ownership on Ethereum | $0.002 USDC.e |

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
