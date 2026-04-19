// Deploy/verify AGW from EOA private key on Abstract Mainnet
// The AGW address is deterministic — same EOA always gets same AGW address
import { createPublicClient, http, formatEther, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createAbstractClient, getSmartAccountAddressFromInitialSigner } from '@abstract-foundation/agw-client';

const ABSTRACT_MAINNET = {
  id: 2741,
  name: 'Abstract Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://api.mainnet.abs.xyz'] } },
};

const PENGU = getAddress('0x9e18b8af9fe1be6cc9f4e5ce69cde54f8aece95');
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
];

async function main() {
  const raw = process.env.REGISTRAR_PRIVATE_KEY ?? process.env.AGENT_PRIVATE_KEY ?? process.env.WALLET_PRIVATE_KEY;
  if (!raw) throw new Error('No private key env var found');

  const pk = ('0x' + raw.trim().replace(/^0x/, ''));
  const signer = privateKeyToAccount(pk);

  const publicClient = createPublicClient({ chain: ABSTRACT_MAINNET, transport: http('https://api.mainnet.abs.xyz') });

  const agwAddress = await getSmartAccountAddressFromInitialSigner(signer.address, publicClient);
  const [eoaEth, agwEth] = await Promise.all([
    publicClient.getBalance({ address: signer.address }),
    publicClient.getBalance({ address: agwAddress }),
  ]);

  console.log('EOA address:', signer.address);
  console.log('AGW address:', agwAddress);
  console.log('EOA ETH:    ', formatEther(eoaEth));
  console.log('AGW ETH:    ', formatEther(agwEth));

  // Check if AGW is deployed
  const code = await publicClient.getBytecode({ address: agwAddress });
  const deployed = code && code !== '0x';
  console.log('AGW deployed:', deployed ? 'YES' : 'NO');

  if (!deployed) {
    if (eoaEth < BigInt('5000000000000000')) {
      throw new Error('Need at least 0.005 ETH in EOA to deploy AGW. Fund: ' + signer.address);
    }
    console.log('Deploying AGW...');
    const abstractClient = await createAbstractClient({
      signer,
      transport: http('https://api.mainnet.abs.xyz'),
      chain: ABSTRACT_MAINNET,
    });
    console.log('AGW deployed at:', abstractClient.account.address);
  } else {
    console.log('AGW already deployed, ready to use.');
  }

  const [decimals, penguBal] = await Promise.all([
    publicClient.readContract({ address: PENGU, abi: ERC20_ABI, functionName: 'decimals' }),
    publicClient.readContract({ address: PENGU, abi: ERC20_ABI, functionName: 'balanceOf', args: [agwAddress] }),
  ]);
  const pengu = Number(penguBal) / 10 ** decimals;
  console.log('AGW PENGU:  ', pengu.toFixed(3));
  console.log('');
  console.log(agwEth >= BigInt('10000000000000000') ? '✓' : '✗', 'AGW ETH >= 0.01');
  console.log(pengu >= 8.888 ? '✓' : '✗', 'AGW PENGU >= 8.888');

  // Export AGW address for next steps
  console.log('::set-output name=agw_address::' + agwAddress);
}

main().catch(e => { console.error(e.message); process.exit(1); });
