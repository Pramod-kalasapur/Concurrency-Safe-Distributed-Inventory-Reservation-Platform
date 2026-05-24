import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      checks: {
        postgres: 'ok',
      },
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      checks: {
        postgres: 'error',
      },
      message: err?.message ?? 'health check failed',
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
