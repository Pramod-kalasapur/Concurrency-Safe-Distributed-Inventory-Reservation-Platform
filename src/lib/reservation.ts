import { Inventory, Prisma } from '@prisma/client'
import { addMinutes } from 'date-fns'
import { prisma } from './prisma'

const MAX_RETRIES = 10

function isTransientError(e: any) {
  const code =
    e?.code ||
    e?.meta?.code ||
    e?.originalError?.code

  if (!code) return false

  return (
    code === 'P2034' ||
    code === 'P2010' ||
    code === '40001' ||
    code === '40P01'
  )
}

export async function reserveInventory({
  productId,
  warehouseId,
  quantity,
  idempotencyKey,
  requestHash,
}: {
  productId: string
  warehouseId: string
  quantity: number
  idempotencyKey?: string
  requestHash?: string
}) {
  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      return await prisma.$transaction(
        async (tx: any) => {

          // =========================
          // IDEMPOTENCY CHECK
          // =========================

          if (idempotencyKey) {
            const existing =
              await tx.idempotencyRequest.findUnique({
                where: {
                  key: idempotencyKey,
                },
              })

            if (existing) {
              if (
                requestHash &&
                existing.requestHash !== requestHash
              ) {
                const err: any = new Error(
                  'Idempotency key reused with different payload'
                )

                err.status = 409

                throw err
              }

              return existing.response as any
            }
          }

          // =========================
          // LOCK INVENTORY ROW
          // =========================

          const inventoryRows =
            await tx.$queryRaw<Inventory[]>`
              SELECT *
              FROM "Inventory"
              WHERE "productId" = ${productId}
                AND "warehouseId" = ${warehouseId}
              FOR UPDATE
            `

          const inventory = inventoryRows[0]

          if (!inventory) {
            const err: any = new Error(
              'Inventory not found'
            )

            err.status = 404

            throw err
          }

          // =========================
          // CHECK AVAILABLE STOCK
          // =========================

          const available =
            inventory.totalStock -
            inventory.reservedStock

          if (available < quantity) {
            const err: any = new Error(
              'Insufficient stock'
            )

            err.status = 409

            throw err
          }

          // =========================
          // UPDATE RESERVED STOCK
          // =========================

          await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              reservedStock: {
                increment: quantity,
              },
            },
          })

          // =========================
          // CREATE RESERVATION
          // =========================

          const reservation =
            await tx.reservation.create({
              data: {
                inventoryId: inventory.id,
                quantity,
                status: 'PENDING',
                expiresAt: addMinutes(
                  new Date(),
                  10
                ),
                idempotencyKey:
                  idempotencyKey ?? undefined,
              },
            })

          // =========================
          // SAVE IDEMPOTENCY RESPONSE
          // =========================

          if (idempotencyKey) {
            await tx.idempotencyRequest.create({
              data: {
                key: idempotencyKey,
                endpoint: '/api/reservations',
                requestHash: requestHash ?? '',
                response: {
                  reservationId: reservation.id,
                  expiresAt:
                    reservation.expiresAt,
                },
                statusCode: 201,
              },
            })
          }

          // =========================
          // AUDIT LOG
          // =========================

          await tx.auditLog.create({
            data: {
              reservationId: reservation.id,
              action:
                'RESERVATION_CREATED',
              metadata: {
                quantity,
                warehouseId,
                productId,
              },
            },
          })

          return {
            reservationId: reservation.id,
            expiresAt: reservation.expiresAt,
          }
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      )
    } catch (err: any) {

      // =========================
      // RETRY SERIALIZATION FAILURES
      // =========================

      if (
        isTransientError(err) &&
        attempt < MAX_RETRIES
      ) {
        const jitter = Math.floor(
          Math.random() * 50
        )

        await new Promise((resolve) =>
          setTimeout(
            resolve,
            2 ** attempt * 25 + jitter
          )
        )

        continue
      }

      throw err
    }
  }
}

export async function releaseExpiredReservations() {
  const expired =
    await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
    })

  for (const reservation of expired) {
    try {
      await prisma.$transaction(
        async (tx: any) => {

          const inventory =
            await tx.inventory.findUnique({
              where: {
                id: reservation.inventoryId,
              },
            })

          if (!inventory) return

          // RELEASE RESERVED STOCK
          await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              reservedStock: {
                decrement:
                  reservation.quantity,
              },
            },
          })

          // MARK EXPIRED
          await tx.reservation.update({
            where: {
              id: reservation.id,
            },
            data: {
              status: 'EXPIRED',
            },
          })

          // AUDIT
          await tx.auditLog.create({
            data: {
              reservationId: reservation.id,
              action:
                'RESERVATION_EXPIRED',
            },
          })
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      )
    } catch (error: any) {
      console.error(
        'Failed releasing expired reservation',
        reservation.id,
        error?.message ?? error
      )
    }
  }
}

export async function lazyCleanup() {
  await releaseExpiredReservations()
}

export async function confirmReservation(
  reservationId: string
) {
  return await prisma.$transaction(
    async (tx: any) => {

      const reservation =
        await tx.reservation.findUnique({
          where: {
            id: reservationId,
          },
        })

      if (!reservation) {
        throw new Error(
          'Reservation not found'
        )
      }

      if (reservation.status !== 'PENDING') {
        throw new Error(
          'Reservation not pending'
        )
      }

      if (
        reservation.expiresAt < new Date()
      ) {
        throw new Error(
          'Reservation expired'
        )
      }

      // LOCK INVENTORY
      const inventoryRows =
        await tx.$queryRaw<Inventory[]>`
          SELECT *
          FROM "Inventory"
          WHERE id = ${reservation.inventoryId}
          FOR UPDATE
        `

      const inventory = inventoryRows[0]

      if (!inventory) {
        throw new Error(
          'Inventory not found'
        )
      }

      // PERMANENTLY DECREMENT STOCK
      await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          reservedStock: {
            decrement:
              reservation.quantity,
          },
          totalStock: {
            decrement:
              reservation.quantity,
          },
        },
      })

      // CONFIRM RESERVATION
      const updatedReservation =
        await tx.reservation.update({
          where: {
            id: reservationId,
          },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
          },
        })

      // AUDIT
      await tx.auditLog.create({
        data: {
          reservationId,
          action:
            'RESERVATION_CONFIRMED',
        },
      })

      return updatedReservation
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .Serializable,
    }
  )
}

export async function releaseReservation(
  reservationId: string,
  reason = 'RELEASED'
) {
  return await prisma.$transaction(
    async (tx: any) => {

      const reservation =
        await tx.reservation.findUnique({
          where: {
            id: reservationId,
          },
        })

      if (!reservation) {
        throw new Error(
          'Reservation not found'
        )
      }

      if (reservation.status !== 'PENDING') {
        throw new Error(
          'Reservation not pending'
        )
      }

      // LOCK INVENTORY
      const inventoryRows =
        await tx.$queryRaw<Inventory[]>`
          SELECT *
          FROM "Inventory"
          WHERE id = ${reservation.inventoryId}
          FOR UPDATE
        `

      const inventory = inventoryRows[0]

      if (!inventory) {
        throw new Error(
          'Inventory not found'
        )
      }

      // RELEASE STOCK
      await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          reservedStock: {
            decrement:
              reservation.quantity,
          },
        },
      })

      // UPDATE RESERVATION
      const updatedReservation =
        await tx.reservation.update({
          where: {
            id: reservationId,
          },
          data: {
            status:
              reason === 'EXPIRED'
                ? 'EXPIRED'
                : 'RELEASED',
            releasedAt: new Date(),
          },
        })

      // AUDIT
      await tx.auditLog.create({
        data: {
          reservationId,
          action:
            updatedReservation.status ===
            'EXPIRED'
              ? 'RESERVATION_EXPIRED'
              : 'RESERVATION_RELEASED',
        },
      })

      return updatedReservation
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .Serializable,
    }
  )
}

export async function getProductsWithAvailability() {
  await lazyCleanup()

  const products =
    await prisma.product.findMany({
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
        },
      },
    })

  return products.map((product: any) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,

    warehouses:
      product.inventories.map(
        (inventory: any) => ({
          warehouseId:
            inventory.warehouseId,

          warehouseName:
            (inventory as any).warehouse
              ?.name ?? null,

          available:
            inventory.totalStock -
            inventory.reservedStock,
        })
      ),
  }))
}