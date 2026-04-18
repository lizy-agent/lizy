'use client';

import { motion } from 'framer-motion';
import { Activity, Star, TrendingUp, Shield, Search, ArrowLeftRight, Hash, Briefcase, List } from 'lucide-react';

const TOOLS = [
  {
    icon: Activity,
    name: 'get_wallet_activity',
    category: 'Abstract Core',
    description: 'Fetch event logs for any wallet from the last 1000 blocks on Abstract Mainnet.',
    price: '$0.005',
    free: false,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Star,
    name: 'get_reputation_score',
    category: 'Abstract Core',
    description: 'Read on-chain reputation score and feedback from the Abstract Reputation Registry (ERC-8004).',
    price: '$0.003',
    free: false,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: Search,
    name: 'get_identity_data',
    category: 'Abstract Core',
    description: 'Fetch identity token URI and metadata from the Abstract Identity Registry.',
    price: '$0.002',
    free: false,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Briefcase,
    name: 'get_acp_job',
    category: 'ACP (ERC-8183)',
    description: 'Read an Agentic Commerce Protocol job from on-chain — status, parties, and budget.',
    price: '$0.002',
    free: false,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
  },
  {
    icon: List,
    name: 'list_acp_jobs',
    category: 'ACP (ERC-8183)',
    description: 'List recent ERC-8183 ACP jobs for a wallet address as client or provider.',
    price: '$0.003',
    free: false,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
  },
  {
    icon: Shield,
    name: 'get_pudgy_metadata',
    category: 'Pudgy Ecosystem',
    description: 'Retrieve Pudgy Penguin NFT metadata by token ID from Ethereum Mainnet.',
    price: '$0.004',
    free: false,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: Shield,
    name: 'verify_pudgy_holder',
    category: 'Pudgy Ecosystem',
    description: 'Verify if a wallet holds Pudgy Penguins on Ethereum Mainnet.',
    price: '$0.002',
    free: false,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: TrendingUp,
    name: 'get_token_price',
    category: 'Abstract Core',
    description: 'On-chain token price aggregated from DEX pool state on Abstract Mainnet.',
    price: '$0.003',
    free: false,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: ArrowLeftRight,
    name: 'get_cross_chain_lookup',
    category: 'Utility',
    description: 'Look up token address mappings across chains using on-chain bridge registries.',
    price: 'Free',
    free: true,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: Hash,
    name: 'transform_data',
    category: 'Utility',
    description: 'JSON↔CSV, sha256, keccak256, address validation — pure CPU transforms.',
    price: 'Free',
    free: true,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
];

export function Tools() {
  return (
    <section id="tools" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
            MCP + A2A Tools
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            10 tools for the Abstract ecosystem
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Abstract-native oracle data, ACP job management, and Pudgy ecosystem verification — paid per-call via x402. Utility tools are free.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-hover rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${tool.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${tool.color}`} />
                  </div>
                  <span className={`text-xs font-mono font-semibold ${tool.free ? 'text-neon-green' : tool.color}`}>{tool.price}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{tool.category}</div>
                <h3 className="font-mono text-sm font-semibold text-white mb-2 break-all">{tool.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-xs text-muted-foreground">
            Paid tools in USDC.e on Abstract Mainnet · Pudgy Penguin holders get 50% off · Utility tools always free
          </p>
        </motion.div>
      </div>
    </section>
  );
}
