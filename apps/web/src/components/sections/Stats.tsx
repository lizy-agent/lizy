'use client';

import { motion } from 'framer-motion';

const STATS = [
  { value: '8', label: 'MCP Tools', sub: 'production ready' },
  { value: '2', label: 'Chains', sub: 'Abstract + Ethereum' },
  { value: '<30ms', label: 'Cached Response', sub: 'via Upstash Redis' },
  { value: '100%', label: 'On-Chain Data', sub: 'no scraping' },
];

export function Stats() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-2xl neon-border p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-white mb-0.5">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
