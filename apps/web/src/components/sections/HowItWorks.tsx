'use client';

import { motion } from 'framer-motion';
import { Wallet, Search, CreditCard, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    icon: Wallet,
    step: '01',
    title: 'Connect Wallet',
    description: 'Connect your Abstract Global Wallet (AGW). No MetaMask required.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    icon: Search,
    step: '02',
    title: 'Call a Tool',
    description: 'Send a JSON-RPC request to the MCP endpoint with your wallet address header.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: CreditCard,
    step: '03',
    title: 'Pay Automatically',
    description: 'First 100 calls are free. After that, pay per call via x402 or MPP session.',
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/20',
  },
  {
    icon: CheckCircle,
    step: '04',
    title: 'Get On-Chain Data',
    description: 'Receive compact JSON responses sourced directly from Abstract Mainnet RPC.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
            How It Works
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Simple, pay-per-use data access
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            LIZY sits between AI agents and the blockchain. Agents pay micro-fees for verified on-chain data.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-hover rounded-2xl p-6 relative"
              >
                <div className="absolute top-4 right-4 font-mono text-xs text-muted-foreground/50">
                  {step.step}
                </div>
                <div className={`w-12 h-12 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
