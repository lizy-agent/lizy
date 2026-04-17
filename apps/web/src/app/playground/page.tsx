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
};

const EXAMPLE_CALLS = [
  {
    label: 'Transform Data (sha256)',
    body: JSON.stringify({ operation: 'sha256', data: 'hello lizy' }, null, 2),
    tool: 'transform_data',
  },
  {
    label: 'Validate Address',
    body: JSON.stringify({ operation: 'validate_address', data: ADDR }, null, 2),
    tool: 'transform_data',
  },
  {
    label: 'Reputation Score',
    body: JSON.stringify({ address: ADDR }, null, 2),
    tool: 'get_reputation_score',
  },
];

interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
}

export default function PlaygroundPage() {
  const [tool, setTool] = useState('transform_data');
  const [body, setBody] = useState(EXAMPLE_CALLS[0].body);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [termsNeeded, setTermsNeeded] = useState(false);
  const [agreeingTerms, setAgreeingTerms] = useState(false);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  const { address: walletAddress } = useAccount();
  const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://mcp.lizy.world';

  useEffect(() => {
    if (!walletAddress) { setQuota(null); return; }
    const fetchQuota = async () => {
      try {
        const res = await fetch(`${mcpUrl}/quota`, { headers: { 'X-Wallet-Address': walletAddress } });
        if (!res.ok) return;
        const data = await res.json() as { ok: boolean; quotaUsed: number; quotaLimit: number; quotaRemaining: number };
        if (data.ok) setQuota({ used: data.quotaUsed, limit: data.quotaLimit, remaining: data.quotaRemaining });
      } catch { /* non-fatal */ }
    };
    fetchQuota();
    const id = setInterval(fetchQuota, 30_000);
    return () => clearInterval(id);
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
    setQuotaExhausted(false);
    try {
      const res = await fetch(`${mcpUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': walletAddress },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: tool, arguments: JSON.parse(body) },
        }),
      });
      const data = await res.json() as {
        error?: { code: number; message: string; data?: { x402?: unknown } };
        result?: { content?: Array<{ text: string }> };
      };

      if (data?.error?.code === -32603 && data?.error?.message?.includes('Terms')) {
        setTermsNeeded(true);
        setResult(null);
        return;
      }

      if (res.status === 402 || data?.error?.data?.x402) {
        setQuotaExhausted(true);
        setResult(JSON.stringify(data, null, 2));
        // Refresh quota display
        const qRes = await fetch(`${mcpUrl}/quota`, { headers: { 'X-Wallet-Address': walletAddress } });
        const qData = await qRes.json() as { ok: boolean; quotaUsed: number; quotaLimit: number; quotaRemaining: number };
        if (qData.ok) setQuota({ used: qData.quotaUsed, limit: qData.quotaLimit, remaining: qData.quotaRemaining });
        return;
      }

      setTermsNeeded(false);

      // Parse quotaRemaining from tool response content
      if (data?.result?.content?.[0]?.text) {
        try {
          const inner = JSON.parse(data.result.content[0].text) as { meta?: { quotaRemaining?: number } };
          if (inner?.meta?.quotaRemaining !== undefined && quota) {
            const newUsed = quota.limit - inner.meta.quotaRemaining;
            setQuota({ used: newUsed, limit: quota.limit, remaining: inner.meta.quotaRemaining });
          }
        } catch { /* non-fatal */ }
      }

      setResult(JSON.stringify(data, null, 2));
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

  const quotaPct = quota ? quota.used / quota.limit : 0;
  const quotaColor = quotaPct >= 0.9 ? 'text-red-400' : quotaPct >= 0.6 ? 'text-yellow-400' : 'text-neon-green';
  const quotaBarColor = quotaPct >= 0.9 ? 'bg-red-400' : quotaPct >= 0.6 ? 'bg-yellow-400' : 'bg-neon-green';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-display text-4xl font-bold text-white mb-1">Playground</h1>
            <p className="text-muted-foreground">Test LIZY tools interactively. Connect your wallet to use the live server.</p>
          </div>
          {quota && walletAddress && (
            <div className="glass rounded-xl p-3 text-right min-w-[120px]">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-neon-green" />
                <span className="text-xs text-muted-foreground">Daily Quota</span>
              </div>
              <div className={`font-display text-xl font-bold ${quotaColor}`}>
                {quota.remaining}<span className="text-sm font-normal text-muted-foreground">/{quota.limit}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${quotaBarColor}`}
                  style={{ width: `${Math.max(2, (quota.remaining / quota.limit) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">remaining</div>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-6 mt-6">
          {EXAMPLE_CALLS.map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setTool(ex.tool); setBody(ex.body); setResult(null); }}
              className="px-3 py-1.5 rounded-lg glass text-xs text-muted-foreground hover:text-white hover:border-neon-green/30 transition-all"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Tool Name</label>
              <select
                value={tool}
                onChange={(e) => {
                  const t = e.target.value;
                  setTool(t);
                  setBody(JSON.stringify(TOOL_DEFAULTS[t] ?? {}, null, 2));
                  setResult(null);
                }}
                className="w-full glass rounded-xl p-3 text-sm text-white bg-transparent border border-white/10 focus:border-neon-green/50 outline-none font-mono"
              >
                {Object.keys(TOOL_DEFAULTS).map((t) => (
                  <option key={t} value={t} className="bg-gray-900">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Arguments (JSON)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full glass rounded-xl p-4 text-sm font-mono text-white bg-transparent border border-white/10 focus:border-neon-green/50 outline-none resize-none"
                spellCheck={false}
              />
            </div>
            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 disabled:opacity-50 transition-all"
            >
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
                <pre className={`text-xs font-mono whitespace-pre-wrap ${quotaExhausted ? 'text-yellow-400' : 'text-neon-green'}`}>{result}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Response will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        {termsNeeded && walletAddress && (
          <div className="mt-6 glass rounded-xl p-4 border border-neon-green/30 text-sm text-center">
            <p className="text-white mb-3">You need to agree to the Terms of Service before using LIZY tools.</p>
            <button
              onClick={agreeToTerms}
              disabled={agreeingTerms}
              className="px-6 py-2 rounded-xl bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 disabled:opacity-50 transition-all"
            >
              {agreeingTerms ? 'Agreeing...' : 'Agree to Terms & Run'}
            </button>
          </div>
        )}

        {quotaExhausted && (
          <div className="mt-6 glass rounded-xl p-4 border border-yellow-500/30 text-sm">
            <p className="text-yellow-400 font-semibold mb-1">Free quota exhausted</p>
            <p className="text-muted-foreground text-xs">
              You&apos;ve used all {quota?.limit} daily free calls. Calls beyond the free tier require x402 or MPP payment.
              Quota resets at UTC midnight.
            </p>
          </div>
        )}

        {!walletAddress && (
          <div className="mt-6 glass rounded-xl p-4 border border-yellow-500/20 text-sm text-yellow-400/80 text-center">
            Connect your Abstract Global Wallet in the navigation bar to use the live API.
          </div>
        )}
      </div>
    </div>
  );
}
