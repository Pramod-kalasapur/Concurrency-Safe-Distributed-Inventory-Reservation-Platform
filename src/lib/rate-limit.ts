type Bucket = {
  resetAt: number;
  hits: number[];
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { resetAt: now + windowMs, hits: [] };

  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - bucket.hits.length),
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return req.headers.get('x-real-ip') ?? 'local';
}
