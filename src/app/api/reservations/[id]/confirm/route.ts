import { NextResponse } from 'next/server'
import { confirmReservation } from '@/lib/reservation'

export async function POST(
  _req: Request,
  {
    params,
  }: {
    params: { id: string }
  }
) {
  try {
    const reservation = await confirmReservation(params.id)

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        status: reservation.status,
        confirmedAt: reservation.confirmedAt,
      },
      {
        status: 200,
      }
    )
  } catch (err: any) {
    console.error(err)

    if (err?.message === 'Reservation expired') {
      return NextResponse.json(
        {
          error: 'Reservation expired',
        },
        {
          status: 410,
        }
      )
    }

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
        error: err?.message ?? 'Failed to confirm reservation',
      },
      {
        status: 500,
      }
    )
  }
}