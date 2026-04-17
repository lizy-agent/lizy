'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'LIZY is the cleanest on-chain data layer I\'ve integrated. The x402 payment flow just works.',
    author: 'Agent Developer',
    handle: '@agent_dev',
    avatar: 'AD',
  },
  {
    quote: 'Finally, an MCP server where the data actually comes from the chain, not some scraped API.',
    author: 'Abstract Builder',
    handle: '@abstractbuidl',
    avatar: 'AB',
  },
  {
    quote: 'The Pudgy holder discount is a nice touch — and it\'s verified fully on-chain.',
    author: 'NFT Collector',
    handle: '@penguinfren',
    avatar: 'NF',
  },
];

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            What builders are saying
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-hover rounded-2xl p-6"
            >
              <Quote className="w-6 h-6 text-neon-green/40 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-xs font-mono text-neon-green">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.handle}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
