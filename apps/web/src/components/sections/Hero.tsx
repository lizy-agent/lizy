'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-neon-green/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-neon-green/20 text-xs text-neon-green mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          Live on Abstract Mainnet · chainId 2741
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6"
        >
          The data layer
          <br />
          <span className="gradient-text">AI agents pay to use.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          LIZY provides monetized on-chain data tools through the Model Context Protocol.
          AI agents query live blockchain data and pay per call using x402 micropayments.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/start"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-green text-black font-semibold hover:bg-neon-green/90 transition-all shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(0,255,136,0.5)]"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-medium hover:border-neon-green/20 transition-all"
          >
            Read the Docs
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 max-w-md mx-auto"
        >
          {[
            { icon: Zap, label: '8 Tools', sub: 'Available' },
            { icon: Shield, label: '100 Free', sub: 'Calls/day' },
            { icon: Globe, label: 'x402 + MPP', sub: 'Payments' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-neon-green mx-auto mb-1" />
              <div className="text-sm font-semibold text-white font-display">{label}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Code snippet */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl p-1 neon-border">
            <div className="rounded-xl bg-black/40 p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">agent.ts</span>
              </div>
              <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-purple-400">const</span>
                  <span className="text-white"> result </span>
                  <span className="text-purple-400">= await</span>
                  <span className="text-yellow-400"> callTool</span>
                  <span className="text-white">{'({'}</span>
                  {'\n'}
                  <span className="text-white">{'  '}</span>
                  <span className="text-neon-green">name</span>
                  <span className="text-white">: </span>
                  <span className="text-orange-400">"get_wallet_activity"</span>
                  <span className="text-white">,</span>
                  {'\n'}
                  <span className="text-white">{'  '}</span>
                  <span className="text-neon-green">args</span>
                  <span className="text-white">: {'{'}</span>
                  <span className="text-neon-green"> address</span>
                  <span className="text-white">: </span>
                  <span className="text-orange-400">"0xABC..."</span>
                  <span className="text-white"> {'}'}</span>
                  {'\n'}
                  <span className="text-white">{'}'}</span>
                  <span className="text-white">)</span>
                  {'\n'}
                  <span className="text-muted-foreground">// Paid $0.005 USDC.e via x402</span>
                </code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
