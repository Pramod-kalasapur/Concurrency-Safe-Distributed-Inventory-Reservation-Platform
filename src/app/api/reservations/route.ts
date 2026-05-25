import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reserveInventory } from '@/lib/reservation'
import crypto from 'crypto'

export const dynamic =
  'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      productId,
      warehouseId,
      quantity,
    } = body

    if (!productId || !warehouseId || !quantity) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    const idempotencyKey =
      req.headers.get('Idempotency-Key')

    const requestBody = JSON.stringify(body)
    const requestHash = crypto
      .createHash('sha256')
      .update(requestBody)
      .digest('hex')

    const result =
      await reserveInventory({
        productId,
        warehouseId,
        quantity: Number(quantity),
        idempotencyKey: idempotencyKey ?? undefined,
        requestHash,
      })

    return NextResponse.json(result, {
      status: 201,
    })
  } catch (err: any) {
    console.error(err)

    const status = err?.status ?? 500

    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to create reservation',
      },
      { status }
    )
  }
}

export async function GET() {

  try {

    const now = new Date()

    const reservations =
      await prisma.reservation.findMany({

        where: {
          status: {
            in: [
              'PENDING',
              'CONFIRMED',
            ],
          },
          expiresAt: {
            gt: now,
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