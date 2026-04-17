'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

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
          {/* Static frame */}
          <div className="relative inline-block">
            {/* Glow layers (static) */}
            <div className="absolute inset-0 rounded-2xl bg-neon-green/15 blur-[50px] scale-110" />
            <div className="absolute inset-0 rounded-2xl bg-neon-green/8 blur-[100px] scale-150" />

            {/* Frame border (static) */}
            <div className="relative rounded-2xl p-1 bg-gradient-to-br from-neon-green/60 via-neon-green/20 to-blue-500/40">
              {/* Inner dark ring */}
              <div className="rounded-xl p-1 bg-background">
                {/* Image floats inside frame */}
                <div className="relative w-52 h-60 sm:w-60 sm:h-72 rounded-xl overflow-hidden">
                  {/* Image is taller than container so bottom crop is clipped out */}
                  <div className="animate-float absolute inset-x-0 top-0 h-[140%]">
                    <Image
                      src="/lizy.png"
                      alt="LIZY"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                  {/* Bottom fade — fully covers the fade-out area */}
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
          className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-8"
        >
          Meet <span className="gradient-text">LIZY</span>
        </motion.h1>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
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

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          {[
            { icon: Zap, label: '8 Tools' },
            { icon: Shield, label: '100 Free/day' },
            { icon: Globe, label: 'x402 + MPP' },
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
