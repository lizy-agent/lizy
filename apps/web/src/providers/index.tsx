'use client';

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { AbstractWalletProvider } from '@abstract-foundation/agw-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AbstractWalletProvider>
          {children}
        </AbstractWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
