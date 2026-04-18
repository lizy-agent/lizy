import { Context } from 'telegraf';
import { deriveWallet } from '../lib/wallet.js';
import { lizy } from '../lib/lizy.js';
import { fmtBalance, fmtActivity, fmtTx, fmtReputation, fmtIdentity, fmtPudgy, fmtPrice } from '../lib/format.js';
import { isAddress } from 'viem';

function walletOf(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) throw new Error('No user');
  return deriveWallet(userId);
}

// Parse optional address arg from message text, fall back to user wallet
function resolveAddress(ctx: Context, arg?: string): string {
  if (arg && isAddress(arg)) return arg;
  return walletOf(ctx).address;
}

async function run(ctx: Context, fn: () => Promise<string>) {
  const msg = await ctx.reply('Fetching from Abstract Mainnet...');
  try {
    const text = await fn();
    await ctx.telegram.editMessageText(ctx.chat!.id, msg.message_id, undefined, text, { parse_mode: 'Markdown' });
  } catch (err) {
    const e = err as Error;
    await ctx.telegram.editMessageText(ctx.chat!.id, msg.message_id, undefined, `Error: ${e.message}`);
  }
}

export async function balanceCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const address = resolveAddress(ctx, args[1]);
  const wallet = walletOf(ctx);
  await run(ctx, async () => fmtBalance(await lizy.balance(wallet.address, address)));
}

export async function activityCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const address = resolveAddress(ctx, args[1]);
  const wallet = walletOf(ctx);
  await run(ctx, async () => {
    const r = await lizy.activity(wallet.address, address);
    return fmtActivity(r.events, address);
  });
}

export async function txCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const hash = args[1];
  if (!hash || !hash.startsWith('0x')) {
    await ctx.reply('Usage: /tx <transaction_hash>');
    return;
  }
  const wallet = walletOf(ctx);
  await run(ctx, async () => fmtTx(await lizy.tx(wallet.address, hash)));
}

export async function reputationCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const address = resolveAddress(ctx, args[1]);
  const wallet = walletOf(ctx);
  await run(ctx, async () => fmtReputation(await lizy.reputation(wallet.address, address)));
}

export async function identityCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const address = resolveAddress(ctx, args[1]);
  const wallet = walletOf(ctx);
  await run(ctx, async () => fmtIdentity(await lizy.identity(wallet.address, address)));
}

export async function pudgyCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const address = resolveAddress(ctx, args[1]);
  const wallet = walletOf(ctx);
  await run(ctx, async () => fmtPudgy(await lizy.pudgy(wallet.address, address)));
}

export async function priceCommand(ctx: Context) {
  const args = (ctx.message as { text?: string })?.text?.split(' ') ?? [];
  const tokenAddress = args[1];
  if (!tokenAddress || !isAddress(tokenAddress)) {
    await ctx.reply('Usage: /price <token_contract_address>\n\nExample: /price 0x9E18B8AF9Fe1Be6Cc9F4E5cE69cDe54F8aECe95');
    return;
  }
  const wallet = walletOf(ctx);
  await run(ctx, async () => fmtPrice(await lizy.price(wallet.address, tokenAddress)));
}

export async function helpCommand(ctx: Context) {
  const wallet = walletOf(ctx);
  await ctx.replyWithMarkdown([
    '*LIZY — Abstract Ecosystem Data*',
    `Your wallet: \`${wallet.address}\``,
    '',
    '*Commands:*',
    '/balance `[address]` — ETH & token balances',
    '/activity `[address]` — recent on-chain events',
    '/tx `<hash>` — transaction details',
    '/reputation `[address]` — ERC-8004 trust score',
    '/identity `[address]` — Abstract identity token',
    '/pudgy `[address]` — Pudgy Penguin holder check',
    '/price `<token_address>` — live DEX price on Abstract',
    '',
    '_Omit address to query your own wallet._',
    '_100 free calls/day. Powered by [LIZY](https://lizy.world)._',
  ].join('\n'));
}
