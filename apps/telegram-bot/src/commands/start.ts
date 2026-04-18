import { Context } from 'telegraf';
import { deriveWallet } from '../lib/wallet.js';
import { lizy } from '../lib/lizy.js';

const LIZY_URL = process.env.LIZY_API_URL ?? 'https://mcp.lizy.world';
const ABSCAN = 'https://abscan.org/address';

function walletCard(address: string, eth: string, usdce: string): string {
  return [
    '💰 *Your Wallet*',
    '',
    '*Balance:*',
    `ETH: *${parseFloat(eth).toFixed(6)}*`,
    `USDC.e: *${parseFloat(usdce).toFixed(2)}*`,
    '',
    '*Address:*',
    `\`${address}\``,
  ].join('\n');
}

function walletKeyboard(address: string) {
  return {
    inline_keyboard: [
      [{ text: '🔍 View on AbstractScan', url: `${ABSCAN}/${address}` }],
      [{ text: '🔄 Refresh Balance', callback_data: 'refresh_balance' }],
    ],
  };
}

async function fetchBalances(wallet: ReturnType<typeof deriveWallet>) {
  let eth = '0', usdce = '0';
  try {
    const b = await lizy.balance(wallet.address, wallet.privateKey, wallet.address);
    eth = b.ethBalance;
    const tok = b.tokens.find(t => t.symbol.toLowerCase().includes('usdc'));
    if (tok) usdce = tok.balance;
  } catch {}
  return { eth, usdce };
}

export async function startCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const wallet = deriveWallet(userId);

  await fetch(`${LIZY_URL}/terms/agree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': wallet.address },
    body: JSON.stringify({ version: 1 }),
  }).catch(() => {});

  const { eth, usdce } = await fetchBalances(wallet);

  await ctx.replyWithMarkdown(walletCard(wallet.address, eth, usdce), {
    reply_markup: walletKeyboard(wallet.address),
  });
}

export async function handleRefreshBalance(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) { await ctx.answerCbQuery(); return; }

  const wallet = deriveWallet(userId);
  const { eth, usdce } = await fetchBalances(wallet);

  await ctx.editMessageText(walletCard(wallet.address, eth, usdce), {
    parse_mode: 'Markdown',
    reply_markup: walletKeyboard(wallet.address),
  });
  await ctx.answerCbQuery('Balance updated');
}
