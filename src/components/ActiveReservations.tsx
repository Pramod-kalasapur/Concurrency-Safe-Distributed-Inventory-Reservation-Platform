'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Reservation = {
  id: string
  quantity: number
  status: string
  expiresAt?: string

  inventory?: {
    product?: {
      name?: string
      sku?: string
    }

    warehouse?: {
      name?: string
      city?: string
    }
  }
}

export function ActiveReservations() {
  const router = useRouter()

  const [reservations, setReservations] =
    useState<Reservation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [actionId, setActionId] =
    useState<string | null>(null)

  async function fetchReservations() {
    try {
      const res = await fetch(
        '/api/reservations',
        {
          cache: 'no-store',
        }
      )

      const data =
        await res.json()

      const list = Array.isArray(data)
        ? data
        : data?.reservations ?? []

      setReservations(
        list.filter(
          (r: Reservation) =>
            r.status === 'PENDING'
        )
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()

    const interval =
      setInterval(
        fetchReservations,
        5000
      )

    return () =>
      clearInterval(interval)
  }, [])

  async function confirmReservation(
    id: string
  ) {
    try {
      setActionId(id)

      await fetch(
        `/api/reservations/${id}/confirm`,
        {
          method: 'POST',
        }
      )

      await fetchReservations()

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  async function cancelReservation(
    id: string
  ) {
    try {
      setActionId(id)

      await fetch(
        `/api/reservations/${id}/release`,
        {
          method: 'POST',
        }
      )

      await fetchReservations()

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        Loading reservations...
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-slate-500 shadow-sm">
        No active reservations
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Active Reservations
          </h2>

          <p className="text-slate-500">
            Pending checkout holds
          </p>
        </div>

        <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
          {reservations.length} Pending
        </div>
      </div>

      <div className="grid gap-4">
        {reservations.map(
          (reservation) => {
            const isBusy =
              actionId ===
              reservation.id

            return (
              <div
                key={reservation.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {
                          reservation
                            .inventory
                            ?.product
                            ?.name
                        }
                      </h3>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        PENDING
                      </span>
                    </div>

                    <div className="grid gap-1 text-sm text-slate-600">
                      <p>
                        Warehouse:{' '}
                        <span className="font-medium">
                          {
                            reservation
                              .inventory
                              ?.warehouse
                              ?.name
                          }
                        </span>
                      </p>

                      <p>
                        Quantity:{' '}
                        <span className="font-medium">
                          {
                            reservation.quantity
                          }
                        </span>
                      </p>

                      <p className="text-xs text-slate-400">
                        Reservation ID:{' '}
                        {
                          reservation.id
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        confirmReservation(
                          reservation.id
                        )
                      }
                      disabled={isBusy}
                      className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {isBusy
                        ? 'Processing...'
                        : 'Confirm'}
                    </button>

                    <button
                      onClick={() =>
                        cancelReservation(
                          reservation.id
                        )
                      }
                      disabled={isBusy}
                      className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {isBusy
                        ? 'Processing...'
                        : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        )}
      </div>
    </section>
  )
}