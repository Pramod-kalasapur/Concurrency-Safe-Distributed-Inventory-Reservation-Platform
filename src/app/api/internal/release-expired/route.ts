import { NextResponse } from 'next/server';
import { releaseExpiredReservations } from '@/lib/reservation';

async function runCleanup() {
  try {
    await releaseExpiredReservations();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 500 });
  }
}

export async function GET() {
  return runCleanup();
}

export async function POST() {
  return runCleanup();
}
