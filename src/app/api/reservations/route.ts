import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'

import { prisma } from '@/lib/prisma'

import { reserveInventory }
from '@/lib/reservation'

import {
  checkRateLimit,
  getClientIp,
} from '@/lib/rate-limit'

export const dynamic =
  'force-dynamic'

/*
====================================
VALIDATION
====================================
*/

const bodySchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().min(1),
})

/*
====================================
GET ALL RESERVATIONS
====================================
*/

export async function GET() {

  try {

    const reservations =
      await prisma.reservation.findMany({

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
      reservations,
      {
        status: 200,
      }
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

/*
====================================
CREATE RESERVATION
====================================
*/

export async function POST(
  req: Request
) {

  try {

    /*
    ================================
    RATE LIMIT
    ================================
    */

    const bypassRateLimit =
      process.env.NODE_ENV !==
        'production' &&
      req.headers.get(
        'x-test-bypass-rate-limit'
      ) === 'true'

    const rateLimit =
      bypassRateLimit
        ? null
        : checkRateLimit(
            `reserve:${getClientIp(req)}`
          )

    if (
      rateLimit &&
      !rateLimit.allowed
    ) {

      return NextResponse.json(
        {
          error:
            'Too many reservation attempts. Please retry shortly.',
        },
        {
          status: 429,

          headers: {
            'X-RateLimit-Limit':
              String(rateLimit.limit),

            'X-RateLimit-Remaining':
              String(
                rateLimit.remaining
              ),

            'X-RateLimit-Reset':
              String(
                Math.ceil(
                  rateLimit.resetAt / 1000
                )
              ),
          },
        }
      )
    }

    /*
    ================================
    REQUEST BODY
    ================================
    */

    const body =
      await req.json().catch(
        () => null
      )

    const parsed =
      bodySchema.safeParse(body)

    if (!parsed.success) {

      return NextResponse.json(
        {
          error:
            'Invalid request body',
        },
        {
          status: 400,
        }
      )
    }

    /*
    ================================
    IDEMPOTENCY
    ================================
    */

    const idempotencyKey =
      req.headers.get(
        'idempotency-key'
      ) ||
      req.headers.get(
        'Idempotency-Key'
      ) ||
      undefined

    const requestHash =
      createHash('sha256')
        .update(
          JSON.stringify(parsed.data)
        )
        .digest('hex')

    /*
    ================================
    RESERVE INVENTORY
    ================================
    */

    const result =
      await reserveInventory({
        ...parsed.data,

        idempotencyKey,

        requestHash,
      })

    /*
    ================================
    SUCCESS
    ================================
    */

    return NextResponse.json(
      result,
      {
        status: 201,
      }
    )

  } catch (err: any) {

    console.error(err)

    return NextResponse.json(
      {
        error:
          err?.message ??
          'Reservation failed',
      },
      {
        status:
          err?.status || 500,
      }
    )
  }
}