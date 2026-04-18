import { keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Derive a deterministic EOA per Telegram user ID from a secret seed.
// Same user always gets the same address — no DB storage needed.
export function deriveWallet(telegramUserId: number) {
  const seed = `${process.env.BOT_WALLET_SEED}:${telegramUserId}`;
  const pk = keccak256(toBytes(seed)) as `0x${string}`;
  const account = privateKeyToAccount(pk);
  return { ...account, privateKey: pk };
}

export function shortAddr(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
