import { Context, Markup } from 'telegraf';
import { deriveWallet } from '../lib/wallet.js';

export async function walletCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const account = deriveWallet(userId);
  const isPrivate = ctx.chat?.type === 'private';

  await ctx.replyWithMarkdown(
    [
      '*Your LIZY Wallet*',
      '',
      `Address: \`${account.address}\``,
      '',
      '_This wallet is unique to your Telegram account._',
      '_Fund it with ETH on Abstract Mainnet to use paid tools._',
    ].join('\n'),
    isPrivate
      ? Markup.inlineKeyboard([
          Markup.button.callback('🔑 Export Private Key', 'export_pk'),
        ])
      : Markup.inlineKeyboard([
          Markup.button.url('Open in private chat to export key', `https://t.me/${ctx.botInfo?.username}?start=wallet`),
        ]),
  );
}

export async function handleExportPk(ctx: Context) {
  // Must be called in private chat
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCbQuery('Open a private chat with the bot to export your key.', { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();

  // Send warning first
  await ctx.replyWithMarkdown(
    [
      '⚠️ *Private Key Warning*',
      '',
      'Your private key gives *full control* of this wallet.',
      '',
      '• Never share it with anyone',
      '• Delete this message after saving',
      '• Store it offline (password manager or written down)',
      '',
      'Tap below to reveal your key:',
    ].join('\n'),
    Markup.inlineKeyboard([
      Markup.button.callback('Show Private Key', 'reveal_pk'),
    ]),
  );
}

export async function handleRevealPk(ctx: Context) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCbQuery('Only available in private chat.', { show_alert: true });
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) return;

  await ctx.answerCbQuery();

  const account = deriveWallet(userId);

  // Send PK in a separate message so user can easily delete just that message
  const msg = await ctx.replyWithMarkdown(
    [
      '🔑 *Your Private Key*',
      '',
      `\`${account.privateKey}\``,
      '',
      '_Import this into MetaMask, Rainbow, or any EVM wallet._',
      '_Network: Abstract Mainnet (Chain ID 2741)_',
      '_RPC: https://api.mainnet.abs.xyz_',
      '',
      '⚠️ Delete this message after saving.',
    ].join('\n'),
  );

  // Auto-remind to delete after 60s
  setTimeout(async () => {
    try {
      await ctx.telegram.sendMessage(
        msg.chat.id,
        '🗑 Reminder: delete the message containing your private key.',
      );
    } catch { /* ignore */ }
  }, 60_000);
}
