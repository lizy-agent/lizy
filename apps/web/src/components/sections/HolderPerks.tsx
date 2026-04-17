'use client';

import { motion } from 'framer-motion';
import { Gift, Percent, Plus } from 'lucide-react';

const PERKS = [
  {
    icon: Percent,
    title: 'Pudgy Penguin Holders',
    subtitle: '50% off all tools',
    description: 'Own any Pudgy Penguin NFT on Ethereum Mainnet and every tool call costs half price — automatically applied to both x402 and MPP payments.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    how: 'Verified via eth_call on Ethereum Mainnet (no API keys)',
  },
  {
    icon: Plus,
    title: 'PENGU Holders',
    subtitle: 'Exclusive future perks',
    description: 'Hold PENGU tokens on Abstract Mainnet. Token-gated features and priority access are being rolled out for PENGU holders.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    how: 'Automatic detection via eth_call on Abstract Mainnet',
  },
];

export function HolderPerks() {
  return (
    <section id="holder-perks" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
            <Gift className="w-3 h-3" /> Holder Perks
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            NFT holders get real benefits
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Perks are automatically applied on-chain. No sign-ups, no codes, no manual verification.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PERKS.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`glass rounded-2xl p-8 border ${perk.border} relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full ${perk.bg} blur-[60px] -translate-y-1/2 translate-x-1/2`} />
                <div className={`w-14 h-14 rounded-xl ${perk.bg} border ${perk.border} flex items-center justify-center mb-6`}>
                  <Icon className={`w-7 h-7 ${perk.color}`} />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-1">{perk.title}</h3>
                <div className={`text-lg font-semibold ${perk.color} mb-3`}>{perk.subtitle}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{perk.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green/50" />
                  {perk.how}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
