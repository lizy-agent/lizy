import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Abstract Chain
  ABSTRACT_RPC: z.string().url().default('https://api.mainnet.abs.xyz'),
  ABSTRACT_RPC_FALLBACK: z.string().url().default('https://api.mainnet.abs.xyz'),
  ABSTRACT_CHAIN_ID: z.coerce.number().default(2741),

  // Ethereum
  ETHEREUM_RPC: z.string().url().default('https://eth.llamarpc.com'),
  ETHEREUM_RPC_FALLBACK: z.string().url().default('https://eth.llamarpc.com'),

  // Payments
  X402_FACILITATOR: z.string().url().default('https://facilitator.x402.abs.xyz'),
  MPP_ENDPOINT: z.string().url().default('https://mpp.abs.xyz'),
  // Mainnet USDC.e on Abstract (source: docs.abs.xyz)
  USDC_E_ADDRESS: z.string().default('0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1'),
  PAYMENT_RECIPIENT: z.string().default('0x0000000000000000000000000000000000000000'),

  // Contracts
  IDENTITY_REGISTRY: z.string().default('0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'),
  REPUTATION_REGISTRY: z.string().default('0x8004BAa17C55a88189AE136b182e5fdA19dE9b63'),
  PUDGY_PENGUINS: z.string().default('0xBd3531dA5CF5857e7CfAA92426877b022e612cf8'),
  PENGU_TOKEN: z.string().default('0x9E18B8AF9Fe1Be6Cc9F4E5cE69cDe54F8aECe95'),
  // ERC-8183 Agentic Commerce Protocol contract (Abstract Mainnet)
  ACP_CONTRACT: z.string().default(''),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Redis
  UPSTASH_REDIS_URL: z.string().url(),
  UPSTASH_REDIS_TOKEN: z.string(),

  // Security
  SERVER_SECRET: z.string().min(32),
  ADMIN_SECRET: z.string().min(16),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // Terms
  TERMS_VERSION: z.coerce.number().default(1),


});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
