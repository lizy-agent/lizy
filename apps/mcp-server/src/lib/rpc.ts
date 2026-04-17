import { createPublicClient, http, type PublicClient, type Chain } from 'viem';
import { config } from '../config';

const abstractMainnet: Chain = {
  id: 2741,
  name: 'Abstract Mainnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [config.ABSTRACT_RPC] },
    public: { http: [config.ABSTRACT_RPC] },
  },
  blockExplorers: {
    default: { name: 'Abstract Explorer', url: 'https://explorer.mainnet.abs.xyz' },
  },
};

const ethereumMainnet: Chain = {
  id: 1,
  name: 'Ethereum Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [config.ETHEREUM_RPC] },
    public: { http: [config.ETHEREUM_RPC] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
};


export const abstractClient: PublicClient = createPublicClient({
  chain: abstractMainnet,
  transport: http(config.ABSTRACT_RPC, {
    retryCount: 2,
    retryDelay: 500,
    timeout: 10_000,
  }),
}) as PublicClient;

export const abstractClientFallback: PublicClient = createPublicClient({
  chain: abstractMainnet,
  transport: http(config.ABSTRACT_RPC_FALLBACK, {
    retryCount: 2,
    retryDelay: 500,
    timeout: 10_000,
  }),
}) as PublicClient;

export const ethereumClient: PublicClient = createPublicClient({
  chain: ethereumMainnet,
  transport: http(config.ETHEREUM_RPC, {
    retryCount: 2,
    retryDelay: 500,
    timeout: 10_000,
  }),
}) as PublicClient;

export const ethereumClientFallback: PublicClient = createPublicClient({
  chain: ethereumMainnet,
  transport: http(config.ETHEREUM_RPC_FALLBACK, {
    retryCount: 2,
    retryDelay: 500,
    timeout: 10_000,
  }),
}) as PublicClient;

// Execute with automatic primary → fallback
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    console.warn('[RPC] Primary failed, trying fallback:', (primaryError as Error).message);
    return fallback();
  }
}

// Fetch raw JSON-RPC from Abstract
export async function abstractRpcCall<T = unknown>(
  method: string,
  params: unknown[],
): Promise<T> {
  return withFallback(
    () => jsonRpcFetch<T>(config.ABSTRACT_RPC, method, params),
    () => jsonRpcFetch<T>(config.ABSTRACT_RPC_FALLBACK, method, params),
  );
}

// Fetch raw JSON-RPC from Ethereum
export async function ethereumRpcCall<T = unknown>(
  method: string,
  params: unknown[],
): Promise<T> {
  return withFallback(
    () => jsonRpcFetch<T>(config.ETHEREUM_RPC, method, params),
    () => jsonRpcFetch<T>(config.ETHEREUM_RPC_FALLBACK, method, params),
  );
}

async function jsonRpcFetch<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`HTTP request failed.\nStatus: ${res.status}\nURL: ${url}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`RPC returned non-JSON (likely bot-protection page): ${text.slice(0, 120)}`);
  }

  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result as T;
}
