import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'LIZY release history and updates.',
};

const CHANGES = [
  {
    version: '0.1.0',
    date: '2024-01-01',
    type: 'release',
    changes: [
      'Initial release of LIZY MCP server',
      '8 production-ready MCP tools',
      'x402 micropayment support via Abstract Mainnet',
      'MPP session billing integration',
      'Abstract Global Wallet (AGW) authentication',
      '100 free calls/day per wallet',
      'PENGU holder bonus: 150 calls/day',
      'Pudgy Penguin holder discount: 50% off all tools',
      'Dual-RPC with automatic fallback',
      'Upstash Redis caching',
      'Supabase backend with 10 tables + RLS',
      'Full MCP JSON-RPC 2.0 protocol compliance',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-4">Changelog</h1>
        <p className="text-muted-foreground mb-12">All notable changes to LIZY.</p>

        <div className="space-y-8">
          {CHANGES.map((release) => (
            <div key={release.version} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display font-bold text-neon-green text-lg">v{release.version}</span>
                <span className="glass px-2 py-0.5 rounded-full text-xs text-muted-foreground">{release.date}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  release.type === 'release' ? 'bg-neon-green/20 text-neon-green' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {release.type}
                </span>
              </div>
              <ul className="space-y-2">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-neon-green mt-1">+</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
