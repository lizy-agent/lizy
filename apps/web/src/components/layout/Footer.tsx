import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Github, Globe } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { href: '/docs', label: 'Documentation' },
    { href: '/playground', label: 'Playground' },
    { href: '/start', label: 'Get Started' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/status', label: 'Status' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
  ],
  Community: [
    { href: 'https://twitter.com/lizy_agent', label: 'Twitter', external: true },
    { href: 'https://github.com/lizy-agent/lizy', label: 'GitHub', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image src="/lizy.png" alt="LIZY" width={32} height={32} className="w-full h-full object-cover object-top" />
              </div>
              <span className="font-display font-bold text-lg text-white">LIZY</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The data layer AI agents pay to use. Built on Abstract Mainnet.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://twitter.com/lizy_agent"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-white hover:border-neon-green/30 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/lizy-agent/lizy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-white hover:border-neon-green/30 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://lizy.world"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-white hover:border-neon-green/30 transition-colors"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4 font-display">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LIZY Labs. Licensed under{' '}
            <Link href="/terms" className="underline hover:text-white">BUSL-1.1</Link>.
          </p>
          <p className="text-xs text-muted-foreground">
            Built on{' '}
            <a
              href="https://abs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              Abstract Mainnet
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
