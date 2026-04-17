/**
 * Simple Data Transform Utility Tool
 *
 * Operations: JSON↔CSV, sha256, keccak256, validate_address, validate_json
 * Pure CPU transforms only — no off-chain data fetching.
 */

import { z } from 'zod';
import { createHash } from 'crypto';
import { keccak256, isAddress, toBytes } from 'viem';
import { TransformDataOutput, TransformOperation } from '@lizy/types';

// ── Pricing ───────────────────────────────────────────────────────────────────
export const PRICE = 0.001; // $0.001 USDC.e

// ── Zod Schema ────────────────────────────────────────────────────────────────
export const transformDataSchema = z.object({
  operation: z.enum([
    'json_to_csv',
    'csv_to_json',
    'sha256',
    'keccak256',
    'validate_address',
    'validate_json',
  ] as const),
  data: z.string().max(65536), // 64KB cap
  options: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
});

// ── Tool: transform_data ──────────────────────────────────────────────────────
export async function transformData(
  input: z.infer<typeof transformDataSchema>,
): Promise<TransformDataOutput> {
  const { operation, data, options } = input;

  switch (operation) {
    case 'json_to_csv': {
      const result = jsonToCsv(data, options);
      return { operation, result: result.csv, error: result.error };
    }

    case 'csv_to_json': {
      const result = csvToJson(data);
      return { operation, result: result.json, error: result.error };
    }

    case 'sha256': {
      const hash = createHash('sha256').update(data, 'utf8').digest('hex');
      return { operation, result: `0x${hash}` };
    }

    case 'keccak256': {
      const hash = keccak256(toBytes(data));
      return { operation, result: hash };
    }

    case 'validate_address': {
      const trimmed = data.trim();
      const valid = isAddress(trimmed);
      return {
        operation,
        result: valid ? trimmed.toLowerCase() : '',
        valid,
        error: valid ? undefined : 'Invalid EVM address',
      };
    }

    case 'validate_json': {
      try {
        const parsed = JSON.parse(data) as unknown;
        return {
          operation,
          result: JSON.stringify(parsed),
          valid: true,
        };
      } catch (e) {
        return {
          operation,
          result: '',
          valid: false,
          error: (e as Error).message,
        };
      }
    }

    default:
      return { operation, result: '', error: `Unknown operation: ${String(operation)}` };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonToCsv(
  json: string,
  options: Record<string, string | number | boolean>,
): { csv: string; error?: string } {
  try {
    const parsed = JSON.parse(json) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    if (arr.length === 0) return { csv: '' };

    const delimiter = (options.delimiter as string) ?? ',';
    const headers = Object.keys(arr[0] as Record<string, unknown>);
    const rows = [
      headers.join(delimiter),
      ...arr.map((row) => {
        const r = row as Record<string, unknown>;
        return headers
          .map((h) => {
            const val = r[h];
            const str = val === null || val === undefined ? '' : String(val);
            return str.includes(delimiter) || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(delimiter);
      }),
    ];

    return { csv: rows.join('\n') };
  } catch (e) {
    return { csv: '', error: (e as Error).message };
  }
}

function csvToJson(csv: string): { json: string; error?: string } {
  try {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return { json: '[]' };

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = parseCsvLine(lines[0], delimiter);
    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line, delimiter);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });
      return obj;
    });

    return { json: JSON.stringify(rows) };
  } catch (e) {
    return { json: '[]', error: (e as Error).message };
  }
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
