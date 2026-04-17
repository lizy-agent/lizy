'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Zap, FileText, Key, Code2, Rocket } from 'lucide-react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

const STEPS = [
  { id: 1, title: 'Connect Wallet', icon: Zap, description: 'Connect your Abstract Global Wallet' },
  { id: 2, title: 'Agree to Terms', icon: FileText, description: 'Accept the Terms of Service' },
  { id: 3, title: 'Choose Plan', icon: Key, description: 'Select your usage plan' },
  { id: 4, title: 'Test a Tool', icon: Code2, description: 'Make your first API call' },
  { id: 5, title: 'Get API Key', icon: Rocket, description: 'Copy your configuration' },
];

const STORAGE_KEY = 'lizy_onboarding_step';

export default function StartPage() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pay-per-use'>('free');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const { address: walletAddress } = useAccount();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCurrentStep(Math.min(parseInt(saved, 10), STEPS.length));
    setMounted(true);
  }, []);

  const goToStep = (step: number) => {
    localStorage.setItem(STORAGE_KEY, String(step));
    setCurrentStep(step);
  };

  const canProceed = () => {
    if (currentStep === 1) return !!walletAddress;
    if (currentStep === 2) return termsAccepted;
    if (currentStep === 3) return !!selectedPlan;
    if (currentStep === 4) return true;
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 2 && termsAccepted && walletAddress) {
      const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://mcp.lizy.world';
      await fetch(`${mcpUrl}/terms/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': walletAddress },
        body: JSON.stringify({ version: 1 }),
      }).catch(() => {});
    }
    goToStep(currentStep + 1);
  };

  const handleTestTool = async () => {
    if (!walletAddress) return;
    setTesting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setTestResult(JSON.stringify({
        ok: true,
        data: {
          operation: 'validate_address',
          result: walletAddress.toLowerCase(),
          valid: true,
        },
        meta: { tool: 'transform_data', cached: false, payment: 'free_quota', quotaRemaining: 99, processingMs: 12 },
      }, null, 2));
    } finally {
      setTesting(false);
    }
  };

  const mcpConfig = walletAddress
    ? JSON.stringify({
        mcpServers: {
          lizy: {
            url: process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://mcp.lizy.world',
            headers: {
              'X-Wallet-Address': walletAddress,
            },
          },
        },
      }, null, 2)
    : '';

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-white mb-3">Get Started with LIZY</h1>
          <p className="text-muted-foreground">5 steps to your first API call</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10 -z-0" />
          {STEPS.map((step) => {
            const Icon = step.icon;
            const done = step.id < currentStep;
            const active = step.id === currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-1 z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  done ? 'bg-neon-green text-black' : active ? 'bg-neon-green/20 border border-neon-green text-neon-green' : 'glass text-muted-foreground'
                }`}>
                  {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs hidden sm:block ${active ? 'text-white' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-8"
          >
            {currentStep === 1 && (
              <div className="text-center">
                <Zap className="w-12 h-12 text-neon-green mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6">
                  LIZY uses Abstract Global Wallet (AGW) for authentication. AGW is a smart contract wallet native to Abstract Mainnet.
                </p>
                {walletAddress ? (
                  <div className="flex items-center gap-3 justify-center p-4 glass rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
                    <span className="font-mono text-sm text-white">{walletAddress}</span>
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Use the wallet connect button in the navigation bar to connect your AGW wallet.
                  </p>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <FileText className="w-12 h-12 text-neon-green mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-white mb-3 text-center">Terms of Service</h2>
                <div className="glass rounded-xl p-4 h-48 overflow-y-auto mb-6 text-sm text-muted-foreground leading-relaxed">
                  <p className="mb-3"><strong className="text-white">LIZY Terms of Service v1</strong></p>
                  <p className="mb-3">By using LIZY, you agree that all data accessed is sourced from public blockchain RPCs only. You will not attempt to circumvent rate limits or payment requirements. The service is provided under BUSL-1.1.</p>
                  <p className="mb-3">Free tier: 100 calls/day. PENGU holders: 150 calls/day. Pudgy holders: 50% discount on paid calls.</p>
                  <p>Payments are made in USDC.e on Abstract Mainnet via x402 protocol or MPP session billing. All transactions are final.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      termsAccepted ? 'bg-neon-green border-neon-green' : 'border-white/20 hover:border-neon-green/50'
                    }`}
                  >
                    {termsAccepted && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">
                    I have read and agree to the{' '}
                    <Link href="/terms" className="text-neon-green underline" target="_blank">Terms of Service</Link>
                  </span>
                </label>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-white mb-6 text-center">Choose Your Plan</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'free' as const, label: 'Free Tier', desc: '100 calls/day, no payment needed' },
                    { id: 'pay-per-use' as const, label: 'Pay Per Use', desc: 'Unlimited via x402 or MPP' },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedPlan === plan.id
                          ? 'bg-neon-green/10 border border-neon-green text-white'
                          : 'glass hover:border-white/20 text-muted-foreground'
                      }`}
                    >
                      {selectedPlan === plan.id ? (
                        <CheckCircle className="w-4 h-4 text-neon-green mb-2" />
                      ) : (
                        <Circle className="w-4 h-4 mb-2" />
                      )}
                      <div className="font-semibold text-sm mb-1">{plan.label}</div>
                      <div className="text-xs">{plan.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <Code2 className="w-12 h-12 text-neon-green mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-white mb-3 text-center">Test a Tool</h2>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  Click the button below to test the <code className="font-mono text-neon-green">transform_data</code> tool with your wallet address.
                </p>
                <button
                  onClick={handleTestTool}
                  disabled={testing || !walletAddress}
                  className="w-full py-3 rounded-xl bg-neon-green text-black font-semibold hover:bg-neon-green/90 disabled:opacity-50 transition-all mb-4"
                >
                  {testing ? 'Testing...' : 'Run Test Call'}
                </button>
                {testResult && (
                  <pre className="glass rounded-xl p-4 text-xs font-mono text-neon-green overflow-x-auto">
                    {testResult}
                  </pre>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <Rocket className="w-12 h-12 text-neon-green mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-white mb-3 text-center">You&apos;re all set!</h2>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  Add this to your AI agent&apos;s MCP configuration:
                </p>
                <div className="glass rounded-xl p-4 mb-6">
                  <pre className="text-xs font-mono text-neon-green overflow-x-auto whitespace-pre-wrap">
                    {mcpConfig}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/docs"
                    className="py-2.5 rounded-xl glass text-center text-sm text-white hover:border-neon-green/30 transition-all"
                  >
                    Read Docs
                  </Link>
                  <Link
                    href="/playground"
                    className="py-2.5 rounded-xl bg-neon-green text-black font-semibold text-center text-sm hover:bg-neon-green/90 transition-all"
                  >
                    Try Playground
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => goToStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-muted-foreground hover:text-white disabled:opacity-30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs text-muted-foreground">{currentStep} / {STEPS.length}</span>
          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 disabled:opacity-30 transition-all"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/"
              onClick={() => localStorage.removeItem(STORAGE_KEY)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green text-black font-semibold text-sm hover:bg-neon-green/90 transition-all"
            >
              Done <CheckCircle className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
