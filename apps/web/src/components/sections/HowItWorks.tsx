'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Search, CreditCard, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    icon: MessageCircle,
    step: '01',
    title: 'Chat on Telegram',
    description: 'Message @lizy_agent on Telegram. LIZY gives you a dedicated wallet — no sign-up needed.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    icon: Search,
    step: '02',
    title: 'Ask in Plain English',
    description: 'Ask anything: "What\'s my balance?", "Check this wallet\'s reputation", "Show me recent transactions."',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: CreditCard,
    step: '03',
    title: 'Pay Automatically',
    description: 'LIZY pays for data calls via x402 using USDC.e from your wallet. No manual approval.',
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/20',
  },
  {
    icon: CheckCircle,
    step: '04',
    title: 'Get On-Chain Data',
    description: 'Receive live data sourced directly from Abstract Mainnet RPC — balances, activity, prices, reputation.',
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
            AI agent meets on-chain data
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Chat with LIZY on Telegram or integrate via API. Pay per query with USDC.e — automatically, via x402.
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
