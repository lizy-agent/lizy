'use client';

import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { type Chain } from 'viem';

const abstractMainnet = {
  id: 2741,
  name: 'Abstract Mainnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ABSTRACT_RPC ?? 'https://api.mainnet.abs.xyz'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ABSTRACT_RPC ?? 'https://api.mainnet.abs.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Abstract Explorer', url: 'https://explorer.mainnet.abs.xyz' },
  },
} as const satisfies Chain;

export const wagmiConfig = createConfig({
  chains: [abstractMainnet, mainnet],
  transports: {
    [abstractMainnet.id]: http(process.env.NEXT_PUBLIC_ABSTRACT_RPC ?? 'https://api.mainnet.abs.xyz'),
    [mainnet.id]: http(),
  },
  ssr: true,
});
