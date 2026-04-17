'use client';

import { useState, useEffect } from 'react';
import { Play, Copy, Check, Zap } from 'lucide-react';
import { useAccount } from 'wagmi';

const ADDR = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const TOOL_DEFAULTS: Record<string, object> = {
  get_wallet_activity:    { address: ADDR, blockRange: 1000 },
  get_reputation_score:   { address: ADDR },
  get_identity_data:      { address: ADDR },
  get_pudgy_metadata:     { tokenId: 1 },
  verify_pudgy_holder:    { address: ADDR },
  get_token_price:        { tokenAddress: '0x9E18B8AF9Fe1Be6Cc9F4E5cE69cDe54F8aECe95', chainId: 2741 },
  get_cross_chain_lookup: { tokenAddress: '0x9E18B8AF9Fe1Be6Cc9F4E5cE69cDe54F8aECe95', sourceChainId: 2741, targetChainId: 1 },
  transform_data:         { operation: 'sha256', data: 'hello lizy' },
  get_acp_job:            { jobId: 1 },
  list_acp_jobs:          { address: ADDR, role: 'client', limit: 10 },
};

const EXAMPLE_CALLS = [
  { label: 'sha256 hash', body: JSON.stringify({ operation: 'sha256', data: 'hello lizy' }, null, 2), tool: 'transform_data' },
  { label: 'Validate Address', body: JSON.stringify({ operation: 'validate_address', data: ADDR }, null, 2), tool: 'transform_data' },
  { label: 'Reputation Score', body: JSON.stringify({ address: ADDR }, null, 2), tool: 'get_reputation_score' },
];

export default function PlaygroundPage() {
  const [tool, setTool] = useState('transform_data');
  const [body, setBody] = useState(EXAMPLE_CALLS[0].body);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [termsNeeded, setTermsNeeded] = useState(false);
  const [agreeingTerms, setAgreeingTerms] = useState(false);
  const [demoQuota, setDemoQuota] = useState<{ remaining: number; limit: number } | null>(null);

  const { address: walletAddress } = useAccount();
  const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://mcp.lizy.world';

  useEffect(() => {
    if (!walletAddress) { setDemoQuota(null); return; }
    fetch(`${mcpUrl}/playground/quota`, { headers: { 'X-Wallet-Address': walletAddress } })
      .then((r) => r.json())
      .then((d: { ok: boolean; remaining: number; limit: number }) => {
        if (d.ok) setDemoQuota({ remaining: d.remaining, limit: d.limit });
      })
      .catch(() => {});
  }, [walletAddress, mcpUrl]);

  const agreeToTerms = async () => {
    if (!walletAddress) return;
    setAgreeingTerms(true);
    try {
      await fetch(`${mcpUrl}/terms/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': walletAddress },
        body: JSON.stringify({ version: 1 }),
      });
      setTermsNeeded(false);
      await handleRun();
    } finally {
      setAgreeingTerms(false);
    }
  };

  const handleRun = async () => {
    if (!walletAddress) {
      setResult(JSON.stringify({ ok: false, error: { code: 'MISSING_WALLET', message: 'Connect wallet first' } }, null, 2));
      return;
    }
    setLoading(true);
    try {
      let args: unknown;
      try { args = JSON.parse(body); } catch {
        setResult(JSON.stringify({ ok: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON in arguments' } }, null, 2));
        return;
      }

      const res = await fetch(`${mcpUrl}/playground/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': walletAddress },
        body: JSON.stringify({ tool, arguments: args }),
      });
      const data = await res.json() as {
        ok: boolean;
        meta?: { demoQuotaRemaining?: number };
        error?: { code: string; message: string; details?: { remaining?: number; limit?: number } };
      };

      if (!data.ok && data.error?.code === 'TERMS_REQUIRED') {
        setTermsNeeded(true);
        setResult(null);
        return;
      }

      setTermsNeeded(false);
      setResult(JSON.stringify(data, null, 2));

      if (data.ok && data.meta?.demoQuotaRemaining !== undefined) {
        setDemoQuota((prev) => prev ? { ...prev, remaining: data.meta!.demoQuotaRemaining! } : null);
      }
      if (!data.ok && data.error?.code === 'DEMO_QUOTA_EXHAUSTED') {
        setDemoQuota({ remaining: 0, limit: data.error.details?.limit ?? 20 });
      }
    } catch (err) {
      setResult(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isQuotaExhausted = result?.includes('DEMO_QUOTA_EXHAUSTED') ?? false;
  const quotaPct = demoQuota ? (demoQuota.limit - demoQuota.remaining) / demoQuota.limit : 0;
  const quotaColor = quotaPct >= 0.9 ? 'text-red-400' : quotaPct >= 0.6 ? 'text-yellow-400' : 'text-neon-green';
  const quotaBarColor = quotaPct >= 0.9 ? 'bg-red-400' : quotaPct >= 0.6 ? 'bg-yellow-400' : 'bg-neon-green';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-white mb-1">Playground</h1>
            <p className="text-muted-foreground text-sm">Test LIZY tools live. {demoQuota !== null ? `${demoQuota.remaining}/${demoQuota.limit} demo calls remaining today.` : 'Connect wallet to start.'}</p>
          </div>
          {demoQuota !== null && walletAddress && (
            <div className="glass rounded-xl p-3 text-right min-w-[110px] shrink-0">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-neon-green" />
                <span className="text-xs text-muted-foreground">Demo</span>
              </div>
              <div className={`font-display text-xl font-bold ${quotaColor}`}>
                {demoQuota.remaining}<span className="text-sm font-normal text-muted-foreground">/{demoQuota.limit}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${quotaBarColor}`} style={{ width: `${Math.max(4, (demoQuota.remaining / demoQuota.limit) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLE_CALLS.map((ex) => (
            <button key={ex.label} onClick={() => { setTool(ex.tool); setBody(ex.body); setResult(null); }}
              className="px-3 py-1.5 rounded-lg glass text-xs text-muted-foreground hover:text-white hover:border-neon-green/30 transition-all">
              {ex.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Tool</label>
              <select value={tool} onChange={(e) => { const t = e.target.value; setTool(t); setBody(JSON.stringify(TOOL_DEFAULTS[t] ?? {}, null, 2)); setResult(null); }}
                className="w-full glass rounded-xl p-3 text-sm text-white bg-transparent border border-white/10 focus:border-neon-green/50 outline-none font-mono">
                {Object.keys(TOOL_DEFAULTS).map((t) => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Arguments (JSON)</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
                className="w-full glass rounded-xl p-4 text-sm font-mono text-white bg-transparent border border-white/10 focus:border-neon-green/50 outline-none resize-none" spellCheck={false} />
            </div>
            <button onClick={handleRun} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 disabled:opacity-50 transition-all">
              <Play className="w-4 h-4" />
              {loading ? 'Running...' : 'Run'}
            </button>
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Response</label>
              {result && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
                  {copied ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className="glass rounded-xl p-4 h-[340px] overflow-auto">
              {result ? (
                <pre className={`text-xs font-mono whitespace-pre-wrap ${isQuotaExhausted ? 'text-yellow-400' : 'text-neon-green'}`}>{result}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Response will appear here</div>
              )}
            </div>
          </div>
        </div>

        {termsNeeded && walletAddress && (
          <div className="mt-6 glass rounded-xl p-4 border border-neon-green/30 text-sm text-center">
            <p className="text-white mb-3">Agree to the Terms of Service to use the playground.</p>
            <button onClick={agreeToTerms} disabled={agreeingTerms}
              className="px-6 py-2 rounded-xl bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 disabled:opacity-50 transition-all">
              {agreeingTerms ? 'Agreeing...' : 'Agree & Run'}
            </button>
          </div>
        )}

        {isQuotaExhausted && (
          <div className="mt-6 glass rounded-xl p-4 border border-yellow-500/30 text-sm">
            <p className="text-yellow-400 font-semibold mb-1">Demo quota exhausted (20/day)</p>
            <p className="text-muted-foreground text-xs">
              Use x402 or MPP for unlimited access. See <a href="/docs#payment" className="text-neon-green underline">docs</a> for integration guide.
            </p>
          </div>
        )}

        {!walletAddress && (
          <div className="mt-6 glass rounded-xl p-4 border border-white/10 text-sm text-muted-foreground text-center">
            Connect your Abstract Global Wallet to use the playground.
          </div>
        )}
      </div>
    </div>
  );
}
