import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()

    const [inventories, reservations] = await Promise.all([
      prisma.inventory.findMany({
        select: {
          totalStock: true,
          reservedStock: true,
        },
      }),
      prisma.reservation.findMany({
        select: {
          status: true,
          expiresAt: true,
        },
      }),
    ])

    const totalStock = inventories.reduce(
      (sum, item) => sum + Math.max(item.totalStock ?? 0, 0),
      0
    )

    const reservedStock = inventories.reduce(
      (sum, item) => sum + Math.max(item.reservedStock ?? 0, 0),
      0
    )

    const availableStock = Math.max(totalStock - reservedStock, 0)

    const activeReservations = reservations.filter(
      (r) =>
        r.status === 'PENDING' &&
        (!r.expiresAt || r.expiresAt > now)
    ).length

    const expiredReservations = reservations.filter(
      (r) => r.status === 'EXPIRED'
    ).length

    const confirmedReservations = reservations.filter(
      (r) => r.status === 'CONFIRMED'
    ).length

    const releasedReservations = reservations.filter(
      (r) => r.status === 'RELEASED'
    ).length

    const totalReservations = reservations.length

    const reservationSuccessRate =
      totalReservations > 0
        ? Number(
            ((confirmedReservations / totalReservations) * 100).toFixed(1)
          )
        : 0

    const stockUtilization =
      totalStock > 0
        ? Number(((reservedStock / totalStock) * 100).toFixed(1))
        : 0

    return NextResponse.json({
      success: true,
      activeReservations,
      expiredReservations,
      confirmedReservations,
      releasedReservations,
      totalReservations,
      totalStock,
      reservedStock,
      availableStock,
      stockUtilization,
      reservationSuccessRate,
    })
  } catch (err: any) {
    console.error(err)

    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? 'error',
      },
      { status: 500 }
    )
  }
}