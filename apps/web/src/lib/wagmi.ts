'use client';

import { createConfig, http } from 'wagmi';
import { abstractMainnet } from '@abstract-foundation/agw-react/chains';
import { mainnet } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [abstractMainnet, mainnet],
  transports: {
    [abstractMainnet.id]: http(process.env.NEXT_PUBLIC_ABSTRACT_RPC ?? 'https://api.mainnet.abs.xyz'),
    [mainnet.id]: http(),
  },
  ssr: true,
});
