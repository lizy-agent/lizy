import { createHash } from 'crypto';
import { Request } from 'express';

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + process.env.SERVER_SECRET).digest('hex');
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? '0.0.0.0';
}

export function hashInput(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16);
}
