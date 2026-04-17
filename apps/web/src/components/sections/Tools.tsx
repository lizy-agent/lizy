'use client';

import { motion } from 'framer-motion';
import { Activity, Star, TrendingUp, Code2, Shield, Search, ArrowLeftRight, Hash } from 'lucide-react';

const TOOLS = [
  {
    icon: Activity,
    name: 'get_wallet_activity',
    category: 'Oracle',
    description: 'Fetch event logs for any wallet from the last 1000 blocks on Abstract Mainnet.',
    price: '$0.005',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Star,
    name: 'get_reputation_score',
    category: 'Oracle',
    description: 'Read reputation score and feedback from the Abstract Reputation Registry.',
    price: '$0.003',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: Search,
    name: 'get_identity_data',
    category: 'Oracle',
    description: 'Fetch identity token URI and metadata from the Abstract Identity Registry.',
    price: '$0.002',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Shield,
    name: 'get_pudgy_metadata',
    category: 'Pudgy Penguins',
    description: 'Retrieve Pudgy Penguin NFT metadata by token ID from Ethereum Mainnet.',
    price: '$0.004',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: Shield,
    name: 'verify_pudgy_holder',
    category: 'Pudgy Penguins',
    description: 'Verify if a wallet holds Pudgy Penguins on Ethereum Mainnet.',
    price: '$0.002',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: TrendingUp,
    name: 'get_token_price',
    category: 'Prices',
    description: 'On-chain token price aggregated from DEX pool state on Abstract Mainnet.',
    price: '$0.003',
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
  },
  {
    icon: ArrowLeftRight,
    name: 'get_cross_chain_lookup',
    category: 'Prices',
    description: 'Look up token address mappings across chains using on-chain bridge registries.',
    price: '$0.005',
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
  },
  {
    icon: Hash,
    name: 'transform_data',
    category: 'Utility',
    description: 'JSON↔CSV, sha256, keccak256, address validation — pure CPU transforms.',
    price: '$0.001',
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
            MCP Tools
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            8 production-ready tools
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every tool returns compact JSON, uses dual-RPC with fallback, and is cached via Redis.
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
                  <span className={`text-xs font-mono font-semibold ${tool.color}`}>{tool.price}</span>
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
            All prices in USDC.e · Pudgy Penguin holders get 50% off all tools
          </p>
        </motion.div>
      </div>
    </section>
  );
}
