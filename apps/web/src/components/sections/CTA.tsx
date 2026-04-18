'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative glass rounded-3xl p-16 text-center overflow-hidden neon-border"
        >
          <div className="absolute inset-0 bg-gradient-radial from-neon-green/5 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto mb-6 animate-float">
              <MessageCircle className="w-8 h-8 text-neon-green" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Try LIZY on{' '}
              <span className="gradient-text">Telegram</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
              Chat with an on-chain AI agent. Ask about any wallet, check live prices, verify identity — all from Telegram.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://t.me/lizy_agentbot"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-neon-green text-black font-semibold text-lg hover:bg-neon-green/90 transition-all shadow-[0_0_40px_rgba(0,255,136,0.3)]"
              >
                <MessageCircle className="w-5 h-5" />
                Open in Telegram
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                href="/playground"
                className="px-8 py-4 rounded-xl glass text-white font-medium text-lg hover:border-neon-green/20 transition-all"
              >
                API Playground
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
