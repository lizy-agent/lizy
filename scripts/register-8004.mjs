// Register LIZY as an ERC-8004 agent on Abstract Mainnet
// Usage: REGISTRAR_PRIVATE_KEY=0x... node scripts/register-8004.mjs
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ABSTRACT_MAINNET = {
  id: 2741,
  name: 'Abstract Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://api.mainnet.abs.xyz'] } },
};

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const AGENT_CARD_URI = 'https://lizy.world/.well-known/agent-card.json';

const ABI = parseAbi([
  'function register(string agentURI) returns (uint256 agentId)',
  'function setAgentURI(uint256 agentId, string newURI)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
]);

async function main() {
  const pk = process.env.REGISTRAR_PRIVATE_KEY;
  if (!pk) throw new Error('REGISTRAR_PRIVATE_KEY env var required');

  const account = privateKeyToAccount(pk);
  console.log('Registrar wallet:', account.address);

  const publicClient = createPublicClient({ chain: ABSTRACT_MAINNET, transport: http() });
  const walletClient = createWalletClient({ account, chain: ABSTRACT_MAINNET, transport: http() });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('ETH balance:', Number(balance) / 1e18, 'ETH');
  if (balance === 0n) throw new Error('No ETH for gas. Fund the wallet first.');

  console.log('Registering LIZY with agent card:', AGENT_CARD_URI);
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'register',
    args: [AGENT_CARD_URI],
  });

  console.log('Transaction sent:', hash);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Confirmed in block:', receipt.blockNumber);

  // Parse agentId from Registered event
  const registeredLog = receipt.logs.find(
    (log) => log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase()
  );
  if (registeredLog) {
    const agentId = BigInt(registeredLog.topics[1]);
    console.log('\n✓ LIZY registered as ERC-8004 agent!');
    console.log('  agentId:', agentId.toString());
    console.log('  View on 8004scan: https://8004scan.io/agents/' + agentId.toString() + '?chain=2741');
    console.log('\nNext: update agentId in apps/web/public/.well-known/agent-card.json to', agentId.toString());
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
