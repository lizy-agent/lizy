import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'LIZY Privacy Policy.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2024</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Data We Collect</h2>
            <ul className="space-y-2">
              <li>• Wallet address (public blockchain data)</li>
              <li>• IP address hash (SHA-256, not reversible)</li>
              <li>• Tool call logs (tool name, timestamp, payment method)</li>
              <li>• Terms agreement timestamp and version</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">How We Use Data</h2>
            <p>We use this data to enforce rate limits, process payments, detect abuse, and improve the service. We do not sell data to third parties.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Data Retention</h2>
            <p>Tool call logs are retained for 90 days. Rate limit data is retained for 24 hours. Holder perk cache is retained for 1 hour.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Third-Party Services</h2>
            <ul className="space-y-2">
              <li>• <strong className="text-white">Supabase</strong> — database hosting</li>
              <li>• <strong className="text-white">Upstash</strong> — Redis caching</li>
              <li>• <strong className="text-white">Sentry</strong> — error monitoring</li>
              <li>• <strong className="text-white">Abstract Mainnet RPC</strong> — blockchain data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Contact</h2>
            <p>Privacy inquiries: legal@lizy.world</p>
          </section>
        </div>
      </div>
    </div>
  );
}
