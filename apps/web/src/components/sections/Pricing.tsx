'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

const TIERS = [
  {
    name: 'Pay Per Call',
    price: 'From $0.001',
    period: '/call',
    description: 'x402 micropayment per request',
    highlight: false,
    features: [
      'x402 single-call payments',
      'All 9 MCP + A2A tools',
      'USDC.e on Abstract Mainnet',
      'Abstract Global Wallet auth',
      'Standard rate limits',
    ],
    cta: { label: 'Get Started', href: '/start' },
  },
  {
    name: 'MPP Session',
    price: 'From $0.001',
    period: '/call',
    description: 'Open a session, stream micro-payments',
    highlight: true,
    badge: 'Most Efficient',
    features: [
      'One on-chain tx to open session',
      'Off-chain vouchers per call',
      'Lower overhead per request',
      'USDC.e on Abstract Mainnet',
      'Ideal for high-volume agents',
    ],
    cta: { label: 'Get Started', href: '/start' },
  },
  {
    name: 'Pudgy Holder',
    price: '50% off',
    period: 'all tools',
    description: 'Own any Pudgy Penguin on Ethereum',
    highlight: false,
    badge: 'NFT Perk',
    features: [
      '50% discount on every call',
      'Automatic on-chain detection',
      'Works with x402 and MPP',
      'No sign-up or codes needed',
      'Verified via Ethereum Mainnet',
    ],
    cta: { label: 'View Collection', href: 'https://pudgypenguins.com', external: true },
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
            Pricing
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pay per call with x402 or open an MPP session. Pudgy holders get 50% off automatically.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                tier.highlight
                  ? 'bg-neon-green/5 border border-neon-green/30 shadow-[0_0_40px_rgba(0,255,136,0.1)]'
                  : 'glass'
              }`}
            >
              {tier.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                  tier.highlight ? 'bg-neon-green text-black' : 'glass text-neon-green border border-neon-green/30'
                }`}>
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display font-bold text-white text-lg mb-1">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{tier.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {'external' in tier.cta && tier.cta.external ? (
                <a
                  href={tier.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    tier.highlight
                      ? 'bg-neon-green text-black hover:bg-neon-green/90'
                      : 'glass hover:border-neon-green/30 text-white'
                  }`}
                >
                  {tier.cta.label}
                  {tier.highlight && <Zap className="w-4 h-4" />}
                </a>
              ) : (
                <Link
                  href={tier.cta.href}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    tier.highlight
                      ? 'bg-neon-green text-black hover:bg-neon-green/90'
                      : 'glass hover:border-neon-green/30 text-white'
                  }`}
                >
                  {tier.cta.label}
                  {tier.highlight && <Zap className="w-4 h-4" />}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
