import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {

    const reservations =
      await prisma.reservation.findMany({
        where: {
          status: 'PENDING',
        },

        include: {
          inventory: {
            include: {
              warehouse: true,
              product: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

    return NextResponse.json(
      reservations
    )

  } catch (err: any) {

    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to fetch reservations',
      },
      {
        status: 500,
      }
    )
  }
}