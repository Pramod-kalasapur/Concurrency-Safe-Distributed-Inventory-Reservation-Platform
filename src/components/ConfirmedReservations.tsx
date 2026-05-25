'use client'

import { useEffect, useState } from 'react'

export function ConfirmedReservations() {

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
          '/api/reservations?status=CONFIRMED'
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
        Loading confirmed reservations...
      </div>
    )
  }

  return (
    <section className="surface-card">

      <h2>
        Confirmed Reservations
      </h2>

      {reservations.length === 0 ? (

        <p>
          No confirmed reservations
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
                    '1px solid #4caf50',
                  borderLeft:
                    '4px solid #4caf50',
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor:
                    '#f1f8f4',
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

                <p
                  style={{
                    color: '#4caf50',
                    fontWeight: 'bold',
                  }}
                >
                  Status:{' '}
                  {
                    reservation.status
                  }
                </p>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                  }}
                >
                  Confirmed at:{' '}
                  {
                    reservation
                      .confirmedAt ?
                      new Date(
                        reservation
                          .confirmedAt
                      ).toLocaleDateString() : 'N/A'
                  }
                </p>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                  }}
                >
                  ID: {reservation.id}
                </p>

              </div>
            )
          )}

        </div>
      )}

    </section>
  )
}
