/**
 * ERC-8183 Agentic Commerce Protocol (ACP) Tools
 *
 * Reads job state from the on-chain ACP contract:
 *   - get_acp_job   → read a single job by ID
 *   - list_acp_jobs → list recent jobs for a client or provider address
 *
 * EIP reference: https://eips.ethereum.org/EIPS/eip-8183
 * Status enum: Open(0) Funded(1) Submitted(2) Completed(3) Rejected(4) Expired(5)
 */

import { z } from 'zod';
import { isAddress } from 'viem';
import { config } from '../config';
import { abstractClient, withFallback, abstractClientFallback } from '../lib/rpc';
import { cacheGet, cacheSet } from '../lib/redis';
import { ACP_ABI } from '../lib/contracts';

export const PRICES = {
  get_acp_job:   0.002,
  list_acp_jobs: 0.003,
} as const;

const CACHE_TTL = 30; // seconds — job status changes, keep short

const JOB_STATUS = ['Open', 'Funded', 'Submitted', 'Completed', 'Rejected', 'Expired'] as const;

function statusLabel(n: number): string {
  return JOB_STATUS[n] ?? `Unknown(${n})`;
}

function formatJob(raw: {
  id:          bigint;
  client:      string;
  provider:    string;
  evaluator:   string;
  description: string;
  budget:      bigint;
  expiredAt:   bigint;
  status:      number;
  hook:        string;
}) {
  return {
    id:          Number(raw.id),
    client:      raw.client,
    provider:    raw.provider,
    evaluator:   raw.evaluator === '0x0000000000000000000000000000000000000000' ? null : raw.evaluator,
    description: raw.description,
    budgetUsdc:  Number(raw.budget) / 1_000_000,
    expiredAt:   new Date(Number(raw.expiredAt) * 1000).toISOString(),
    status:      statusLabel(raw.status),
    statusCode:  raw.status,
    hook:        raw.hook === '0x0000000000000000000000000000000000000000' ? null : raw.hook,
  };
}

// ── Schemas ───────────────────────────────────────────────────────────────────

export const getAcpJobSchema = z.object({
  jobId: z.coerce.number().int().min(1),
});

export const listAcpJobsSchema = z.object({
  address: z.string().refine(isAddress, { message: 'Invalid Ethereum address' }),
  role:    z.enum(['client', 'provider']).default('client'),
  limit:   z.coerce.number().int().min(1).max(50).default(10),
});

// ── Tool Functions ────────────────────────────────────────────────────────────

export async function getAcpJob(input: z.infer<typeof getAcpJobSchema>) {
  if (!config.ACP_CONTRACT) {
    throw new Error('ACP_CONTRACT address not configured');
  }

  const cacheKey = `acp:job:${input.jobId}`;
  const cached = await cacheGet<ReturnType<typeof formatJob>>(cacheKey);
  if (cached) return { ...cached, cachedAt: new Date().toISOString() };

  const raw = await withFallback(
    () => abstractClient.readContract({
      address:      config.ACP_CONTRACT as `0x${string}`,
      abi:          ACP_ABI,
      functionName: 'getJob',
      args:         [BigInt(input.jobId)],
    }),
    () => abstractClientFallback.readContract({
      address:      config.ACP_CONTRACT as `0x${string}`,
      abi:          ACP_ABI,
      functionName: 'getJob',
      args:         [BigInt(input.jobId)],
    }),
  ) as {
    id: bigint; client: string; provider: string; evaluator: string;
    description: string; budget: bigint; expiredAt: bigint; status: number; hook: string;
  };

  const result = formatJob(raw);
  await cacheSet(cacheKey, result, CACHE_TTL).catch(() => {});
  return result;
}

export async function listAcpJobs(input: z.infer<typeof listAcpJobsSchema>) {
  if (!config.ACP_CONTRACT) {
    throw new Error('ACP_CONTRACT address not configured');
  }

  const cacheKey = `acp:list:${input.address}:${input.role}:${input.limit}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return { ...(cached as object), cachedAt: new Date().toISOString() };

  // Get total job count
  const totalCount = await withFallback(
    () => abstractClient.readContract({
      address: config.ACP_CONTRACT as `0x${string}`,
      abi: ACP_ABI,
      functionName: 'jobCount',
    }),
    () => abstractClientFallback.readContract({
      address: config.ACP_CONTRACT as `0x${string}`,
      abi: ACP_ABI,
      functionName: 'jobCount',
    }),
  ) as bigint;

  const total = Number(totalCount);
  if (total === 0) {
    return { address: input.address, role: input.role, jobs: [], total: 0 };
  }

  // Scan recent jobs (up to 200) and filter by address + role
  const scanLimit = Math.min(total, 200);
  const startId   = Math.max(1, total - scanLimit + 1);
  const ids       = Array.from({ length: total - startId + 1 }, (_, i) => startId + i);

  const results: ReturnType<typeof formatJob>[] = [];

  // Batch read — avoid too many parallel calls
  const BATCH = 20;
  for (let i = 0; i < ids.length && results.length < input.limit; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const jobs = await Promise.allSettled(
      batch.map((id) =>
        abstractClient.readContract({
          address:      config.ACP_CONTRACT as `0x${string}`,
          abi:          ACP_ABI,
          functionName: 'getJob',
          args:         [BigInt(id)],
        }) as Promise<{
          id: bigint; client: string; provider: string; evaluator: string;
          description: string; budget: bigint; expiredAt: bigint; status: number; hook: string;
        }>
      ),
    );

    for (const settled of jobs) {
      if (settled.status !== 'fulfilled') continue;
      const raw = settled.value;
      const match = input.role === 'client'
        ? raw.client.toLowerCase() === input.address.toLowerCase()
        : raw.provider.toLowerCase() === input.address.toLowerCase();
      if (match) results.push(formatJob(raw));
      if (results.length >= input.limit) break;
    }
  }

  const output = { address: input.address, role: input.role, jobs: results, total: results.length };
  await cacheSet(cacheKey, output, CACHE_TTL).catch(() => {});
  return output;
}
