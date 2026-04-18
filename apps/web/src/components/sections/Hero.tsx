'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Shield, MessageCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-neon-green/6 blur-[160px]" />
        <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10 flex flex-col items-center">

        {/* Floating framed character */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-2xl bg-neon-green/15 blur-[50px] scale-110" />
            <div className="absolute inset-0 rounded-2xl bg-neon-green/8 blur-[100px] scale-150" />
            <div className="relative rounded-2xl p-1 bg-gradient-to-br from-neon-green/60 via-neon-green/20 to-blue-500/40">
              <div className="rounded-xl p-1 bg-background">
                <div className="relative w-52 h-60 sm:w-60 sm:h-72 rounded-xl overflow-hidden">
                  <div className="animate-float absolute inset-x-0 top-0 h-[140%]">
                    <Image
                      src="/lizy.png"
                      alt="LIZY"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-4"
        >
          Meet <span className="gradient-text">LIZY</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-muted-foreground text-lg sm:text-xl max-w-md mx-auto mb-8"
        >
          AI agent and data layer for the Abstract ecosystem
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <a
            href="https://t.me/lizy_agent"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-green text-black font-semibold hover:bg-neon-green/90 transition-all shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(0,255,136,0.5)]"
          >
            <MessageCircle className="w-4 h-4" />
            Try on Telegram
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <Link
            href="/playground"
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-medium hover:border-neon-green/20 transition-all"
          >
            API Playground
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          {[
            { icon: MessageCircle, label: 'Telegram Bot' },
            { icon: Shield, label: 'ERC-8004 Agent' },
            { icon: Zap, label: 'x402 Auto-Pay' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground border border-white/5">
              <Icon className="w-3 h-3 text-neon-green" />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
