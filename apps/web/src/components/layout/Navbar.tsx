'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/playground', label: 'Playground' },
  { href: '/status', label: 'Status' },
  { href: '/changelog', label: 'Changelog' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-white/5' : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/lizy.png" alt="LIZY" width={32} height={32} className="w-full h-full object-cover object-top" />
            </div>
            <span className="font-display font-bold text-lg text-white">LIZY</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <ConnectButton />
            <Link
              href="/start"
              className="px-4 py-2 rounded-lg bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 transition-colors animate-glow-pulse"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile: connect button always visible + burger */}
          <div className="flex items-center gap-2 md:hidden">
            <ConnectButton />
            <button
              className="text-muted-foreground hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass border-b border-white/5"
          >
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted-foreground hover:text-white py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/start"
                className="block w-full text-center px-4 py-2 rounded-lg bg-neon-green text-black font-semibold text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function ConnectButton() {
  const { address } = useAccount();
  const { login, logout } = useLoginWithAbstract();

  if (!address) {
    return (
      <button
        onClick={login}
        className="px-3 py-1.5 rounded-lg glass text-sm text-muted-foreground hover:text-white hover:border-neon-green/30 transition-all"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm text-muted-foreground hover:text-white transition-all"
    >
      <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
      {`${address.slice(0, 6)}...${address.slice(-4)}`}
    </button>
  );
}
