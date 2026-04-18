import { Context } from 'telegraf';
import { deriveWallet } from '../lib/wallet.js';
import { runAgent } from '../lib/ai.js';

export async function chatHandler(ctx: Context) {
  const text = (ctx.message as { text?: string })?.text;
  if (!text) return;

  const userId = ctx.from?.id;
  if (!userId) return;

  const wallet = deriveWallet(userId);
  const msg = await ctx.reply('Thinking...');

  try {
    const reply = await runAgent(text, wallet.address, wallet.privateKey);
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      msg.message_id,
      undefined,
      reply,
      { parse_mode: 'Markdown' },
    );
  } catch (err) {
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      msg.message_id,
      undefined,
      `Error: ${(err as Error).message}`,
    );
  }
}
