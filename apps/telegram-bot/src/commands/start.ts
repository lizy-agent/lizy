import { Context } from 'telegraf';
import { deriveWallet, shortAddr } from '../lib/wallet.js';

export async function startCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const account = deriveWallet(userId);

  await ctx.replyWithMarkdownV2(
    escMd([
      `*LIZY — AI\\-native data layer for the Abstract ecosystem*`,
      ``,
      `Your Abstract wallet has been created:`,
      `\`${account.address}\``,
      ``,
      `All queries run on\\-chain via Abstract Mainnet\\. You get *100 free calls/day*\\.`,
      ``,
      `*What you can do:*`,
      `/balance — ETH & token balances`,
      `/activity — recent on\\-chain events`,
      `/tx \\<hash\\> — transaction details`,
      `/reputation — ERC\\-8004 trust score`,
      `/identity — Abstract identity token`,
      `/pudgy — Pudgy Penguin holder check`,
      `/price \\<token\\> — live DEX price`,
      `/help — full command reference`,
    ].join('\n'))
  );
}

// Escape special chars for MarkdownV2
export function escMd(text: string): string {
  return text.replace(/([_[\]()~`>#+\-=|{}.!])/g, (c) => {
    // Leave already-escaped markdown bold/code alone
    return ['*', '`', '\\'].includes(c) ? c : `\\${c}`;
  });
}
