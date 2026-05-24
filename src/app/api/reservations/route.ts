import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic =
  'force-dynamic'

export async function GET() {

  try {

    const reservations =
      await prisma.reservation.findMany({

        where: {
          status: {
            in: [
              'PENDING',
              'CONFIRMED',
            ],
          },
        },

        include: {
          inventory: {
            include: {
              product: true,
              warehouse: true,
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

    console.error(err)

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