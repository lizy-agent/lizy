'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I start using LIZY?',
    a: 'The fastest way is Telegram — just message @lizy_agent. LIZY will create a wallet for you automatically. For API access, use the MCP endpoint at mcp.lizy.world with your wallet address header.',
  },
  {
    q: 'What chains does LIZY support?',
    a: 'LIZY primarily uses Abstract Mainnet (chainId 2741) for all on-chain data and payments. Pudgy Penguins verification uses Ethereum Mainnet only for reading the NFT contract.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'LIZY accepts x402 micropayments using USDC.e on Abstract Mainnet. In the Telegram bot, payments happen automatically — LIZY signs and pays on your behalf from your derived wallet.',
  },
  {
    q: 'What wallet do I need for the Telegram bot?',
    a: 'None — LIZY derives a dedicated wallet for you from your Telegram user ID. You can check your wallet address with /wallet, and top it up with USDC.e to enable paid queries.',
  },
  {
    q: 'Is LIZY a real AI agent?',
    a: 'Yes. LIZY is registered on-chain as an ERC-8004 agent on Abstract Mainnet. It uses Claude (Anthropic) for natural language understanding and autonomously calls on-chain tools, pays for data via x402, and returns verified results.',
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
