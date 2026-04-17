'use client';

import { useState } from 'react';
import { Play, Copy, Check } from 'lucide-react';
import { useAccount } from 'wagmi';

const EXAMPLE_CALLS = [
  {
    label: 'Transform Data (sha256)',
    body: JSON.stringify({ operation: 'sha256', data: 'hello lizy' }, null, 2),
    tool: 'transform_data',
  },
  {
    label: 'Validate Address',
    body: JSON.stringify({ operation: 'validate_address', data: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' }, null, 2),
    tool: 'transform_data',
  },
  {
    label: 'Reputation Score',
    body: JSON.stringify({ address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' }, null, 2),
    tool: 'get_reputation_score',
  },
];

export default function PlaygroundPage() {
  const [tool, setTool] = useState('transform_data');
  const [body, setBody] = useState(EXAMPLE_CALLS[0].body);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { address: walletAddress } = useAccount();

  const handleRun = async () => {
    if (!walletAddress) {
      setResult(JSON.stringify({ ok: false, error: { code: 'MISSING_WALLET', message: 'Connect wallet first' } }, null, 2));
      return;
    }
    setLoading(true);
    try {
      const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://mcp.lizy.world';
      const res = await fetch(`${mcpUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': walletAddress,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: tool, arguments: JSON.parse(body) },
        }),
      });
      const data = await res.json();
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

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-3">Playground</h1>
        <p className="text-muted-foreground mb-8">Test LIZY tools interactively. Connect your wallet to use the live server.</p>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mb-6">
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
                onChange={(e) => setTool(e.target.value)}
                className="w-full glass rounded-xl p-3 text-sm text-white bg-transparent border border-white/10 focus:border-neon-green/50 outline-none font-mono"
              >
                {['get_wallet_activity', 'get_reputation_score', 'get_identity_data', 'get_pudgy_metadata', 'verify_pudgy_holder', 'get_token_price', 'get_cross_chain_lookup', 'transform_data'].map((t) => (
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
                <pre className="text-xs font-mono text-neon-green whitespace-pre-wrap">{result}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Response will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        {!walletAddress && (
          <div className="mt-6 glass rounded-xl p-4 border border-yellow-500/20 text-sm text-yellow-400/80 text-center">
            Connect your Abstract Global Wallet in the navigation bar to use the live API.
          </div>
        )}
      </div>
    </div>
  );
}
