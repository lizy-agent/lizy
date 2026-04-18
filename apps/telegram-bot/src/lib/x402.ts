import { privateKeyToAccount } from 'viem/accounts';

const USDC_E_ADDRESS = '0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1' as const;
const CHAIN_ID = 2741;

const EIP712_DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: CHAIN_ID,
  verifyingContract: USDC_E_ADDRESS,
} as const;

const TRANSFER_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

export interface X402Details {
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  network: string;
  resource: string;
}

export async function buildX402Payment(privateKey: `0x${string}`, details: X402Details): Promise<string> {
  const account = privateKeyToAccount(privateKey);

  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min window
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const nonceHex = ('0x' + Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

  const authorization = {
    from: account.address,
    to: details.payTo as `0x${string}`,
    value: BigInt(details.maxAmountRequired),
    validAfter: BigInt(0),
    validBefore,
    nonce: nonceHex,
  };

  const signature = await account.signTypedData({
    domain: EIP712_DOMAIN,
    types: TRANSFER_TYPES,
    primaryType: 'TransferWithAuthorization',
    message: authorization,
  });

  const payload = {
    scheme: 'exact',
    network: details.network,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value.toString(),
        validAfter: authorization.validAfter.toString(),
        validBefore: authorization.validBefore.toString(),
        nonce: nonceHex,
      },
    },
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
