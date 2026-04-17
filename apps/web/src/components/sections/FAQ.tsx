'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What chains does LIZY support?',
    a: 'LIZY primarily uses Abstract Mainnet (chainId 2741) for all on-chain data and payments. Pudgy Penguins verification uses Ethereum Mainnet only for reading the NFT contract.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'LIZY accepts x402 micropayments and MPP (session billing). Both use USDC.e on Abstract Mainnet. The first 100 calls per day are free, no payment required.',
  },
  {
    q: 'How are holder perks verified?',
    a: 'Perks are verified entirely on-chain via eth_call. PENGU balance is checked on Abstract Mainnet, Pudgy Penguin ownership is checked on Ethereum Mainnet. No API keys or off-chain data are used.',
  },
  {
    q: 'What wallet do I need?',
    a: 'LIZY uses Abstract Global Wallet (AGW) exclusively. AGW is a smart contract wallet native to Abstract Mainnet. No MetaMask or RainbowKit needed.',
  },
  {
    q: 'Is the data sourced from external APIs?',
    a: 'No. All data comes directly from on-chain sources: eth_getLogs, eth_call on view functions, and CPU-only transforms. No scraping, no Portal API, no paid data providers.',
  },
  {
    q: 'What is the MCP protocol?',
    a: 'MCP (Model Context Protocol) is an open standard for connecting AI agents to data sources and tools. LIZY implements a JSON-RPC 2.0 MCP server that AI agents can call directly.',
  },
  {
    q: 'What is the rate limit?',
    a: '60 requests per minute per IP, and 30 requests per minute per wallet. After exceeding the free quota, each call requires x402 or MPP payment.',
  },
  {
    q: 'Is LIZY open source?',
    a: 'LIZY is licensed under BUSL-1.1. Source code is available on GitHub. The license permits non-production use and becomes MIT on 2028-01-01.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full glass-hover rounded-xl p-4 text-left flex items-start justify-between gap-4"
              >
                <span className="font-medium text-white text-sm">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
