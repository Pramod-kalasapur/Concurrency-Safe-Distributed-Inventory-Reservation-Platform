'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { ReservationDetails } from '@/components/ReservationDetails'

export default function ReservationStatusPage() {

  const router = useRouter()

  const searchParams =
    useSearchParams()

  const reservationId =
    searchParams.get('id') ?? ''

  const [reservation, setReservation] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [countdown, setCountdown] =
    useState<string>('')

  const [expired, setExpired] =
    useState(false)

  // =========================
  // FETCH RESERVATION
  // =========================

  useEffect(() => {

    if (!reservationId) {
      setLoading(false)
      setError('Missing reservation ID')
      return
    }

    async function fetchReservation() {
      try {

        const res = await fetch(
          `/api/reservations/${reservationId}`,
          {
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(
            data.error ||
              'Reservation not found'
          )
        }

        setReservation(data)

        setError(null)

      } catch (err: any) {

        setError(
          err?.message ??
            'Failed to fetch reservation'
        )

      } finally {

        setLoading(false)
      }
    }

    fetchReservation()

    // AUTO REFRESH EVERY 5s
    const interval = setInterval(
      fetchReservation,
      5000
    )

    return () =>
      clearInterval(interval)

  }, [reservationId])

  // =========================
  // COUNTDOWN TIMER
  // =========================

  useEffect(() => {

    if (!reservation?.expiresAt) return

    const timer = setInterval(() => {

      const now = Date.now()

      const expiry =
        new Date(
          reservation.expiresAt
        ).getTime()

      const diff =
        Math.max(0, expiry - now)

      const minutes =
        Math.floor(diff / 60000)

      const seconds =
        Math.floor(
          (diff % 60000) / 1000
        )

      setCountdown(
        `${minutes}:${seconds
          .toString()
          .padStart(2, '0')}`
      )

      // EXPIRED
      if (diff <= 0) {

        setExpired(true)

        clearInterval(timer)

        router.refresh()
      }

    }, 1000)

    return () =>
      clearInterval(timer)

  }, [reservation?.expiresAt])

  // =========================
  // CONFIRM PURCHASE
  // =========================

  async function onConfirm() {

    try {

      const res = await fetch(
        `/api/reservations/${reservationId}/confirm`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {

        if (res.status === 410) {
          throw new Error(
            'Reservation expired'
          )
        }

        throw new Error(
          data.error ||
            'Failed to confirm'
        )
      }

      alert('Purchase confirmed')

      setReservation((prev: any) => ({
        ...prev,
        status: 'CONFIRMED',
      }))

      router.refresh()

    } catch (err: any) {

      setError(
        err?.message ??
          'Failed to confirm reservation'
      )
    }
  }

  // =========================
  // RELEASE RESERVATION
  // =========================

  async function onRelease() {

    try {

      const res = await fetch(
        `/api/reservations/${reservationId}/release`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to release'
        )
      }

      alert('Reservation cancelled')

      setReservation((prev: any) => ({
        ...prev,
        status: 'RELEASED',
      }))

      router.refresh()

    } catch (err: any) {

      setError(
        err?.message ??
          'Failed to release reservation'
      )
    }
  }

  // =========================
  // LOADING STATE
  // =========================

  if (loading) {
    return (
      <main className="app-shell app-shell--narrow">
        <div className="surface-card loading-card">
          Loading reservation...
        </div>
      </main>
    )
  }

  // =========================
  // PAGE UI
  // =========================

  return (
    <main className="app-shell app-shell--narrow">

      <Link
        href="/"
        className="back-link"
      >
        ← Back to catalog
      </Link>

      <div className="page-title">

        <div className="eyebrow">
          Checkout Hold
        </div>

        <h1>
          Reservation Status
        </h1>
      </div>

      {error ? (

        <div className="surface-card error-card">
          {error}
        </div>

      ) : reservation ? (

        <ReservationDetails
          reservationId={
            reservation.id
          }

          status={
            reservation.status
          }

          expiresAt={
            reservation.expiresAt
          }

          warehouseName={
            reservation.warehouse
              ?.name ??
            reservation.warehouseName ??
            ''
          }

          quantity={
            reservation.quantity
          }

          onConfirm={
            onConfirm
          }

          onRelease={
            onRelease
          }

          expired={
            expired ||
            reservation.status ===
              'EXPIRED' ||
            countdown === '0:00'
          }

          countdown={
            countdown
          }
        />

      ) : (

        <div className="surface-card error-card">
          Reservation not found
        </div>
      )}
    </main>
  )
}