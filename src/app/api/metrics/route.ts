import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [active, expired, confirmed, released, totalStock, reservedStock, totalReservations] = await Promise.all([
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.reservation.count({ where: { status: 'EXPIRED' } }),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.reservation.count({ where: { status: 'RELEASED' } }),
      prisma.inventory.aggregate({ _sum: { totalStock: true } }),
      prisma.inventory.aggregate({ _sum: { reservedStock: true } }),
      prisma.reservation.count(),
    ]);
    const totalStockValue = totalStock._sum.totalStock ?? 0;
    const reservedStockValue = reservedStock._sum.reservedStock ?? 0;

    return NextResponse.json({
      activeReservations: active,
      expiredReservations: expired,
      confirmedReservations: confirmed,
      releasedReservations: released,
      totalReservations,
      totalStock: totalStockValue,
      reservedStock: reservedStockValue,
      availableStock: totalStockValue - reservedStockValue,
      stockUtilization: totalStockValue ? (reservedStockValue / totalStockValue) : 0,
      reservationSuccessRate: totalReservations ? (confirmed / totalReservations) : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 500 });
  }
}
