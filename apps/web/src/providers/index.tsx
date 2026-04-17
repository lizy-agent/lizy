'use client';

import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { AbstractWalletProvider } from '@abstract-foundation/agw-react';
import { abstractMainnet } from '@/lib/wagmi';

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
    <AbstractWalletProvider chain={abstractMainnet} queryClient={queryClient}>
      {children}
    </AbstractWalletProvider>
  );
}
