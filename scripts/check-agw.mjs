// Derive AGW address from EOA private key and check balances
// Usage: REGISTRAR_PRIVATE_KEY=0x... node scripts/check-agw.mjs
import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getSmartAccountAddressFromInitialSigner } from '@abstract-foundation/agw-client';

const ABSTRACT_MAINNET = {
  id: 2741,
  name: 'Abstract Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://api.mainnet.abs.xyz'] } },
};

// PENGU on Abstract Mainnet
const PENGU_ADDRESS = '0x9E18B8AF9Fe1Be6Cc9F4E5cE69cDe54F8aECe95';
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
];

async function main() {
  const pk = process.env.REGISTRAR_PRIVATE_KEY;
  if (!pk) throw new Error('REGISTRAR_PRIVATE_KEY env var required');

  const account = privateKeyToAccount(pk);
  const eoaAddress = account.address;

  const agwAddress = await getSmartAccountAddressFromInitialSigner(eoaAddress);

  const client = createPublicClient({ chain: ABSTRACT_MAINNET, transport: http() });

  const [eoaEth, agwEth, penguDecimals, agwPengu] = await Promise.all([
    client.getBalance({ address: eoaAddress }),
    client.getBalance({ address: agwAddress }),
    client.readContract({ address: PENGU_ADDRESS, abi: ERC20_ABI, functionName: 'decimals' }),
    client.readContract({ address: PENGU_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [agwAddress] }),
  ]);

  const penguBalance = Number(agwPengu) / 10 ** penguDecimals;

  console.log('=== LIZY Agent Wallet Info ===');
  console.log('');
  console.log('EOA (signer):  ', eoaAddress);
  console.log('AGW (smart):   ', agwAddress);
  console.log('');
  console.log('--- Balances ---');
  console.log('EOA ETH:       ', formatEther(eoaEth), 'ETH');
  console.log('AGW ETH:       ', formatEther(agwEth), 'ETH');
  console.log('AGW PENGU:     ', penguBalance.toFixed(3), 'PENGU');
  console.log('');
  console.log('--- Claw Council Checklist ---');
  console.log(agwEth >= BigInt('10000000000000000') ? '✓' : '✗', 'AGW has >= 0.01 ETH  (needed for gas)');
  console.log(penguBalance >= 8.888 ? '✓' : '✗', 'AGW has >= 8.888 PENGU  (needed for swap)');
  console.log('');

  if (agwEth < BigInt('10000000000000000')) {
    console.log('ACTION NEEDED: Send ETH to AGW address:', agwAddress);
    console.log('Bridge ETH to Abstract: https://relay.link/bridge/abstract');
  }
  if (penguBalance < 8.888) {
    console.log('ACTION NEEDED: AGW needs PENGU. Buy on Abstract DEX or send to:', agwAddress);
    console.log('PENGU contract: ' + PENGU_ADDRESS);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
