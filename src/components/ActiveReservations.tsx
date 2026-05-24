'use client'

import { useEffect, useState } from 'react'

export function ActiveReservations() {

  const [
    reservations,
    setReservations,
  ] = useState<any[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  async function fetchReservations() {

    try {

      const res =
        await fetch(
          '/api/reservations'
        )

      const data =
        await res.json()

      setReservations(data)

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

  if (loading) {

    return (
      <div>
        Loading reservations...
      </div>
    )
  }

  return (
    <section className="surface-card">

      <h2>
        Active Reservations
      </h2>

      {reservations.length === 0 ? (

        <p>
          No active reservations
        </p>

      ) : (

        <div
          style={{
            display: 'grid',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >

          {reservations.map(
            (reservation) => (

              <div
                key={reservation.id}
                style={{
                  border:
                    '1px solid #333',
                  padding: '1rem',
                  borderRadius: '12px',
                }}
              >

                <h3>
                  {
                    reservation
                      ?.inventory
                      ?.product
                      ?.name
                  }
                </h3>

                <p>
                  Warehouse:{' '}
                  {
                    reservation
                      ?.inventory
                      ?.warehouse
                      ?.name
                  }
                </p>

                <p>
                  Quantity:{' '}
                  {
                    reservation.quantity
                  }
                </p>

                <p>
                  Status:{' '}
                  {
                    reservation.status
                  }
                </p>

              </div>
            )
          )}

        </div>
      )}

    </section>
  )
}