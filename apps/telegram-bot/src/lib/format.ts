import type { WalletBalanceResult, ActivityEvent, TxResult, ReputationResult, IdentityResult, PudgyResult, TokenPriceResult } from './lizy.js';

const USD = (n: number | null) => n != null ? `$${n.toFixed(2)}` : '';
const addr = (a: string) => `\`${a.slice(0, 6)}...${a.slice(-4)}\``;

export function fmtBalance(d: WalletBalanceResult): string {
  const lines = [
    `*Wallet Balance*`,
    `Address: ${addr(d.address)}`,
    ``,
    `ETH: *${parseFloat(d.ethBalance).toFixed(6)}* ${USD(d.ethValueUsd)}`,
  ];
  if (d.tokens.length > 0) {
    lines.push(``);
    lines.push(`*ERC-20 Tokens:*`);
    for (const t of d.tokens) {
      lines.push(`${t.symbol}: *${parseFloat(t.balance).toFixed(4)}* ${USD(t.valueUsd)}`);
    }
  }
  return lines.join('\n');
}

export function fmtActivity(events: ActivityEvent[], address: string): string {
  if (events.length === 0) return `No recent activity found for ${addr(address)}.`;
  const lines = [`*Recent Activity* for ${addr(address)}`, ``];
  for (const e of events.slice(0, 8)) {
    const ts = e.timestamp ? new Date(e.timestamp).toLocaleDateString() : `#${e.blockNumber}`;
    lines.push(`${e.type} · ${ts}`);
    lines.push(`  ${addr(e.from)} → ${e.to ? addr(e.to) : 'contract'}`);
    if (e.value !== '0') lines.push(`  ${e.value} ETH`);
    lines.push(``);
  }
  return lines.join('\n').trim();
}

export function fmtTx(d: TxResult): string {
  const status = d.status === 'success' ? '✅ Success' : '❌ Failed';
  return [
    `*Transaction*`,
    `Hash: \`${d.hash.slice(0, 10)}...\``,
    `Status: ${status}`,
    `From: ${addr(d.from)}`,
    `To: ${d.to ? addr(d.to) : 'contract creation'}`,
    `Value: ${d.value} ETH`,
    `Gas used: ${d.gasUsed}`,
    d.timestamp ? `Time: ${new Date(d.timestamp).toLocaleString()}` : '',
  ].filter(Boolean).join('\n');
}

export function fmtReputation(d: ReputationResult): string {
  const bar = '█'.repeat(Math.min(10, Math.floor(d.score / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(d.score / 10)));
  const lines = [
    `*Reputation Score*`,
    `Address: ${addr(d.address)}`,
    ``,
    `Score: *${d.score}* / 100`,
    `[${bar}]`,
    `Feedback count: ${d.totalFeedback}`,
  ];
  if (Object.keys(d.breakdown).length > 0) {
    lines.push(``);
    lines.push(`*Breakdown:*`);
    for (const [k, v] of Object.entries(d.breakdown)) {
      lines.push(`  ${k}: ${v}`);
    }
  }
  return lines.join('\n');
}

export function fmtIdentity(d: IdentityResult): string {
  if (!d.tokenId) return `No identity token found for ${addr(d.address)}.`;
  return [
    `*Abstract Identity*`,
    `Address: ${addr(d.address)}`,
    `Token ID: #${d.tokenId}`,
    d.name ? `Name: *${d.name}*` : '',
  ].filter(Boolean).join('\n');
}

export function fmtPudgy(d: PudgyResult): string {
  if (!d.isHolder) return `${addr(d.address)} does not hold any Pudgy Penguins.`;
  return `${addr(d.address)} holds *${d.count}* Pudgy Penguin${d.count !== 1 ? 's' : ''}. 🐧\n50% discount on LIZY paid tools automatically applied.`;
}

export function fmtPrice(d: TokenPriceResult): string {
  return [
    `*Token Price*`,
    `Symbol: *${d.symbol || 'Unknown'}*`,
    `Price: *$${d.priceUsd.toFixed(6)}*`,
    `Source: ${d.source}`,
    `Chain: Abstract Mainnet`,
  ].join('\n');
}
