import { NextResponse } from 'next/server'
import { releaseReservation } from '@/lib/reservation'

export async function POST(
  _req: Request,
  {
    params,
  }: {
    params: { id: string }
  }
) {
  try {
    const reservation = await releaseReservation(params.id)

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        status: reservation.status,
        releasedAt: reservation.releasedAt,
      },
      {
        status: 200,
      }
    )
  } catch (err: any) {
    console.error(err)

    if (err?.message === 'Reservation not found') {
      return NextResponse.json(
        {
          error: 'Reservation not found',
        },
        {
          status: 404,
        }
      )
    }

    if (err?.message === 'Reservation not pending') {
      return NextResponse.json(
        {
          error: 'Reservation already processed',
        },
        {
          status: 409,
        }
      )
    }

    return NextResponse.json(
      {
        error: err?.message ?? 'Failed to release reservation',
      },
      {
        status: 500,
      }
    )
  }
}