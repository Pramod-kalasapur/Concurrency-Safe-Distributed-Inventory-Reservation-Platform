import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {

    const warehouses =
      await prisma.warehouse.findMany()

    return NextResponse.json(
      warehouses
    )

  } catch (err: any) {

    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to fetch warehouses',
      },
      {
        status: 500,
      }
    )
  }
}