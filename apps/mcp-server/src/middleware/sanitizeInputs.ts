import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { isAddress } from 'viem';

// Strip any prototype pollution or dangerous keys
function deepSanitize(obj: unknown, depth = 0): unknown {
  if (depth > 10) return null;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj.slice(0, 4096); // cap string length
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.slice(0, 100).map((item) => deepSanitize(item, depth + 1));
  if (typeof obj === 'object') {
    const safe: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      safe[key] = deepSanitize(val, depth + 1);
    }
    return safe;
  }
  return obj;
}

export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body) as typeof req.body;
  }
  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(req.query) as typeof req.query;
  }
  next();
}

// Reusable Zod validators
export const addressSchema = z
  .string()
  .refine(isAddress, { message: 'Invalid EVM address' })
  .transform((s) => s.toLowerCase() as `0x${string}`);

export const tokenIdSchema = z.coerce.number().int().nonnegative().max(999999);

export const blockRangeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(1000)
  .default(1000);

export const chainIdSchema = z.coerce.number().int().positive();
