import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { reserveInventory } from '@/lib/reservation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const bodySchema = z.object({ productId: z.string(), warehouseId: z.string(), quantity: z.number().int().min(1) });

export async function POST(req: Request) {
  const bypassRateLimit = process.env.NODE_ENV !== 'production' && req.headers.get('x-test-bypass-rate-limit') === 'true';
  const rateLimit = bypassRateLimit ? null : checkRateLimit(`reserve:${getClientIp(req)}`);

  if (rateLimit && !rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many reservation attempts. Please retry shortly.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      }
    );
  }

  const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key') || undefined;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  try {
    const requestHash = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
    const res = await reserveInventory({ ...parsed.data, idempotencyKey, requestHash });
    return NextResponse.json(res, { status: 201 });
  } catch (err: any) {
    const status = err?.status || 500;
    return NextResponse.json({ error: err?.message ?? 'error' }, { status });
  }
}
