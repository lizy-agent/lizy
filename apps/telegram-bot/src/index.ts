import { Telegraf } from 'telegraf';
import { startCommand, handleRefreshBalance } from './commands/start.js';
import {
  balanceCommand, activityCommand, txCommand,
  reputationCommand, identityCommand, pudgyCommand,
  priceCommand, helpCommand,
} from './commands/tools.js';
import { walletCommand, handleExportPk, handleRevealPk } from './commands/wallet.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
if (!process.env.BOT_WALLET_SEED) throw new Error('BOT_WALLET_SEED is required');

const bot = new Telegraf(token);

bot.command('start',      startCommand);
bot.command('wallet',     walletCommand);
bot.command('balance',    balanceCommand);
bot.command('activity',   activityCommand);
bot.command('tx',         txCommand);
bot.command('reputation', reputationCommand);
bot.command('identity',   identityCommand);
bot.command('pudgy',      pudgyCommand);
bot.command('price',      priceCommand);
bot.command('help',       helpCommand);

bot.action('export_pk',       handleExportPk);
bot.action('reveal_pk',       handleRevealPk);
bot.action('refresh_balance', handleRefreshBalance);

bot.on('text', (ctx) => {
  ctx.reply('Use /help to see available commands.');
});

bot.launch();
console.log('[LIZY Bot] Running...');

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
