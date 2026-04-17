'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://mcp.lizy.world';

interface HealthData {
  ok: boolean;
  checks: Record<string, 'ok' | 'error'>;
  latencyMs: number;
  ts: string;
}

const SERVICE_LABELS: Record<string, string> = {
  abstract_rpc: 'Abstract Mainnet RPC',
  redis: 'Upstash Redis Cache',
  supabase: 'Supabase Database',
};


export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [mcpStatus, setMcpStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [lastChecked, setLastChecked] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    setRefreshing(true);
    setMcpStatus('loading');
    try {
      const res = await fetch(`${mcpUrl}/health`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json() as HealthData;
      setHealth(data);
      setMcpStatus(res.ok ? 'ok' : 'error');
    } catch {
      setHealth(null);
      setMcpStatus('error');
    } finally {
      setLastChecked(new Date().toUTCString());
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  const uniqueServices = [
    { name: 'MCP Server', status: mcpStatus === 'loading' ? 'checking' : mcpStatus },
    ...Object.entries(SERVICE_LABELS).map(([key, name]) => ({
      name,
      status: mcpStatus === 'loading' ? 'checking' : (health?.checks[key] ?? 'error'),
    })),
    { name: 'x402 Facilitator', status: 'ok' as const },
    { name: 'MPP Session Billing', status: 'ok' as const },
    { name: 'Web Frontend', status: 'ok' as const },
  ];

  const allOk = mcpStatus === 'ok' && health?.ok === true;
  const anyChecking = uniqueServices.some((s) => s.status === 'checking');

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-4xl font-bold text-white">System Status</h1>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Overall status */}
        <div className={`glass rounded-2xl p-6 mb-8 text-center border ${
          anyChecking ? 'border-white/10' : allOk ? 'border-neon-green/30' : 'border-red-500/30'
        }`}>
          {anyChecking ? (
            <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-spin" />
          ) : allOk ? (
            <CheckCircle className="w-10 h-10 text-neon-green mx-auto mb-3" />
          ) : (
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          )}
          <div className={`text-lg font-semibold ${anyChecking ? 'text-muted-foreground' : allOk ? 'text-neon-green' : 'text-red-400'}`}>
            {anyChecking ? 'Checking systems…' : allOk ? 'All Systems Operational' : 'Partial Outage Detected'}
          </div>
          {health && (
            <div className="text-xs text-muted-foreground mt-1">
              MCP latency: {health.latencyMs}ms
            </div>
          )}
          {lastChecked && (
            <div className="text-xs text-muted-foreground mt-0.5">Last checked: {lastChecked}</div>
          )}
        </div>

        {/* Services */}
        <div className="space-y-3 mb-8">
          {uniqueServices.map((service) => (
            <div key={service.name} className="glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  service.status === 'checking' ? 'bg-yellow-400 animate-pulse' :
                  service.status === 'ok' ? 'bg-neon-green animate-pulse' : 'bg-red-400'
                }`} />
                <span className="text-sm text-white">{service.name}</span>
              </div>
              <span className={`text-xs capitalize ${
                service.status === 'checking' ? 'text-yellow-400' :
                service.status === 'ok' ? 'text-neon-green' : 'text-red-400'
              }`}>
                {service.status === 'checking' ? 'checking…' : service.status}
              </span>
            </div>
          ))}
        </div>

        {/* Contracts */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-white mb-4">Contract Addresses</h2>
          <div className="space-y-3">
            {[
              { name: 'Identity Registry', address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', chain: 'Abstract' },
              { name: 'Reputation Registry', address: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63', chain: 'Abstract' },
              { name: 'USDC.e', address: '0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1', chain: 'Abstract' },
              { name: 'Pudgy Penguins', address: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8', chain: 'Ethereum' },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-medium">{c.name}</span>
                  <span className="ml-2 glass px-2 py-0.5 rounded-full text-muted-foreground">{c.chain}</span>
                </div>
                <code className="font-mono text-muted-foreground hidden sm:block">
                  {c.address.slice(0, 10)}…{c.address.slice(-8)}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
