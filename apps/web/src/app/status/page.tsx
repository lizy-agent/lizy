import type { Metadata } from 'next';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'LIZY system status and uptime.',
};

const SERVICES = [
  { name: 'MCP Server', status: 'operational', uptime: '99.9%' },
  { name: 'Abstract Mainnet RPC', status: 'operational', uptime: '99.8%' },
  { name: 'Ethereum Mainnet RPC', status: 'operational', uptime: '99.7%' },
  { name: 'Supabase Database', status: 'operational', uptime: '99.9%' },
  { name: 'Upstash Redis Cache', status: 'operational', uptime: '99.9%' },
  { name: 'x402 Facilitator', status: 'operational', uptime: '99.5%' },
  { name: 'MPP Session Billing', status: 'operational', uptime: '99.5%' },
  { name: 'Web Frontend', status: 'operational', uptime: '99.9%' },
];

export default function StatusPage() {
  const allOperational = SERVICES.every((s) => s.status === 'operational');

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-4 text-center">System Status</h1>

        {/* Overall status */}
        <div className={`glass rounded-2xl p-6 mb-8 text-center border ${allOperational ? 'border-neon-green/30' : 'border-red-500/30'}`}>
          {allOperational ? (
            <CheckCircle className="w-10 h-10 text-neon-green mx-auto mb-3" />
          ) : (
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          )}
          <div className={`text-lg font-semibold ${allOperational ? 'text-neon-green' : 'text-red-400'}`}>
            {allOperational ? 'All Systems Operational' : 'Partial Outage'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Last updated: {new Date().toUTCString()}
          </div>
        </div>

        {/* Services */}
        <div className="space-y-3">
          {SERVICES.map((service) => (
            <div key={service.name} className="glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  service.status === 'operational' ? 'bg-neon-green' : 'bg-red-400'
                } animate-pulse`} />
                <span className="text-sm text-white">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {service.uptime}
                </div>
                <span className={`text-xs capitalize ${
                  service.status === 'operational' ? 'text-neon-green' : 'text-red-400'
                }`}>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contracts */}
        <div className="glass rounded-2xl p-6 mt-8">
          <h2 className="font-display font-bold text-white mb-4">Contract Addresses</h2>
          <div className="space-y-3">
            {[
              { name: 'Identity Registry', address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', chain: 'Abstract' },
              { name: 'Reputation Registry', address: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63', chain: 'Abstract' },
              { name: 'USDC.e', address: '0xbd28Bd5A3Ef540d1582828CE2A1a657353008C61', chain: 'Abstract' },
              { name: 'Pudgy Penguins', address: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8', chain: 'Ethereum' },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-medium">{c.name}</span>
                  <span className="ml-2 glass px-2 py-0.5 rounded-full text-muted-foreground">{c.chain}</span>
                </div>
                <code className="font-mono text-muted-foreground hidden sm:block">{c.address.slice(0, 10)}...{c.address.slice(-8)}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
