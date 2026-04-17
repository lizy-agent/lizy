import { Redis } from '@upstash/redis';
import { config } from '../config';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: config.UPSTASH_REDIS_URL,
      token: config.UPSTASH_REDIS_TOKEN,
    });
  }
  return _redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const val = await redis.get<T>(key);
    return val;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // cache write failures are non-fatal
  }
}

export async function rateLimitCheck(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  const redisKey = `rl:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, windowSeconds);

  const results = await pipeline.exec();
  const count = (results[2] as number) ?? 0;
  const allowed = count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - count),
    reset: now + windowSeconds,
  };
}

export async function quotaGet(walletAddress: string, date: string): Promise<number> {
  const redis = getRedis();
  const key = `quota:${walletAddress.toLowerCase()}:${date}`;
  const val = await redis.get<number>(key);
  return val ?? 0;
}

export async function quotaIncrement(walletAddress: string, date: string): Promise<number> {
  const redis = getRedis();
  const key = `quota:${walletAddress.toLowerCase()}:${date}`;
  const ttl = 86400; // 24 hours
  const newVal = await redis.incr(key);
  if (newVal === 1) await redis.expire(key, ttl);
  return newVal;
}
