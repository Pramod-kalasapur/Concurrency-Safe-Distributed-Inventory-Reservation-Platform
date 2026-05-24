import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: { id: string }
  }
) {
  try {

    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: params.id,
        },

        include: {
          inventory: {
            include: {
              warehouse: true,
              product: true,
            },
          },
        },
      })

    if (!reservation) {
      return NextResponse.json(
        {
          error:
            'Reservation not found',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json({
      id: reservation.id,

      status: reservation.status,

      quantity: reservation.quantity,

      expiresAt:
        reservation.expiresAt,

      createdAt:
        reservation.createdAt,

      product: {
        id:
          reservation.inventory
            ?.product?.id,

        name:
          reservation.inventory
            ?.product?.name,

        sku:
          reservation.inventory
            ?.product?.sku,
      },

      warehouse: {
        id:
          reservation.inventory
            ?.warehouse?.id,

        name:
          reservation.inventory
            ?.warehouse?.name,

        city:
          reservation.inventory
            ?.warehouse?.city,
      },

      inventory: {
        totalStock:
          reservation.inventory
            ?.totalStock,

        reservedStock:
          reservation.inventory
            ?.reservedStock,

        available:
          (reservation.inventory
            ?.totalStock ?? 0) -
          (reservation.inventory
            ?.reservedStock ?? 0),
      },
    })
  } catch (err: any) {

    console.error(err)

    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to fetch reservation',
      },
      {
        status: 500,
      }
    )
  }
}