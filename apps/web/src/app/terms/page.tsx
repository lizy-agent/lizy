import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'LIZY Terms of Service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto prose prose-invert prose-sm">
        <h1 className="font-display text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Version 1 · Effective January 1, 2024</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">1. Acceptance</h2>
            <p>By connecting your wallet and using LIZY, you agree to these Terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">2. Service Description</h2>
            <p>LIZY provides monetized on-chain data APIs via the Model Context Protocol (MCP). All data is sourced exclusively from public blockchain RPCs on Abstract Mainnet (chainId 2741) and Ethereum Mainnet.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">3. Free Tier & Payments</h2>
            <p>The free tier provides 100 API calls per day. PENGU token holders receive 150 calls per day. Beyond the free tier, payment is required via x402 or MPP in USDC.e on Abstract Mainnet. Pudgy Penguin NFT holders receive a 50% discount on paid calls. All payments are final and non-refundable.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
            <p>You may not use LIZY to circumvent rate limits, share API access across wallets, scrape data for redistribution, or use the service for illegal purposes. Automated abuse will result in immediate termination.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">5. Data & Privacy</h2>
            <p>LIZY logs wallet addresses, IP hashes (SHA-256), and tool call metadata for fraud prevention and service improvement. We do not sell personal data. See our Privacy Policy for details.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">6. Disclaimers</h2>
            <p>LIZY is provided &ldquo;as is&rdquo; without warranty. On-chain data is provided in good faith but may have delays or errors. LIZY Labs is not responsible for decisions made based on tool outputs.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">7. License</h2>
            <p>The LIZY source code is licensed under BUSL-1.1. See the <a href="https://github.com/lizy-agent/lizy/blob/main/LICENSE" className="text-neon-green underline" target="_blank" rel="noopener noreferrer">LICENSE file</a> for details.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">8. Contact</h2>
            <p>For legal matters: legal@lizy.world · Twitter: @lizy_agent</p>
          </section>
        </div>
      </div>
    </div>
  );
}
