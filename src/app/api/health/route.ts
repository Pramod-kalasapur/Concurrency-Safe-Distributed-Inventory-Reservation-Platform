import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {

  return NextResponse.json(
    {
      status: 'ok',

      service:
        'Concurrency-Safe Inventory Reservation Platform',

      timestamp:
        new Date().toISOString(),

      uptimeSeconds:
        Math.round(process.uptime()),
    },
    {
      status: 200,
    }
  )
}