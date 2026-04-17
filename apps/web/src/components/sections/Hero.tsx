'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-neon-green/5 blur-[140px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — text content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
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
              className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-4"
            >
              Meet{' '}
              <span className="gradient-text">LIZY</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="font-display text-xl sm:text-2xl font-semibold mb-6"
            >
              <span className="text-neon-green">she queries.</span>{' '}
              <span className="text-white/70">you build.</span>
            </motion.p>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-10"
            >
              The data layer AI agents pay to use. Monetized on-chain tools via MCP —
              live blockchain data, paid per call with x402 micropayments.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-12"
            >
              <Link
                href="/start"
                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-green text-black font-semibold hover:bg-neon-green/90 transition-all shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(0,255,136,0.5)]"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/playground"
                className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-medium hover:border-neon-green/20 transition-all"
              >
                Try Playground
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center lg:justify-start gap-4 flex-wrap"
            >
              {[
                { icon: Zap, label: '8 Tools' },
                { icon: Shield, label: '100 Free/day' },
                { icon: Globe, label: 'x402 + MPP' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-neon-green" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — character */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              {/* Glow behind character */}
              <div className="absolute inset-0 -m-16 rounded-full bg-neon-green/10 blur-[80px]" />
              <div className="absolute inset-0 -m-8 rounded-full bg-neon-green/5 blur-[40px]" />

              {/* Character image */}
              <div className="relative w-72 h-96 sm:w-80 sm:h-[440px] lg:w-96 lg:h-[520px]">
                <Image
                  src="/lizy.png"
                  alt="LIZY"
                  fill
                  className="object-contain object-top drop-shadow-[0_0_40px_rgba(0,255,136,0.3)]"
                  priority
                />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
