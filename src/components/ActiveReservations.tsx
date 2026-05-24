'use client'

import {
  useEffect,
  useState,
} from 'react'

export function ActiveReservations() {

  const [
    reservations,
    setReservations,
  ] = useState<any[]>([])

  async function fetchReservations() {

    try {

      const res = await fetch(
        '/api/reservations/active',
        {
          cache: 'no-store',
        }
      )

      const data = await res.json()

      setReservations(data)

    } catch (err) {

      console.error(err)
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

      const res = await fetch(
        `/api/reservations/${id}/confirm`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error
        )
      }

      alert(
        'Reservation confirmed'
      )

      fetchReservations()

    } catch (err: any) {

      alert(err.message)
    }
  }

  async function cancelReservation(
    id: string
  ) {

    try {

      const res = await fetch(
        `/api/reservations/${id}/release`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error
        )
      }

      alert(
        'Reservation cancelled'
      )

      fetchReservations()

    } catch (err: any) {

      alert(err.message)
    }
  }

  if (
    reservations.length === 0
  ) {
    return (
      <div className="empty-state">
        No active reservations
      </div>
    )
  }

  return (
    <div className="product-grid">

      {reservations.map(
        (reservation) => {

          return (
            <section
              key={reservation.id}
              className="product-card"
            >

              <div className="product-card__header">

                <div>

                  <h3>
                    {
                      reservation
                        .inventory
                        ?.product
                        ?.name
                    }
                  </h3>

                  <p>
                    {
                      reservation
                        .inventory
                        ?.warehouse
                        ?.name
                    }
                  </p>
                </div>

                <span className="sku-badge">
                  {
                    reservation.status
                  }
                </span>
              </div>

              <div className="warehouse-list">

                <div className="warehouse-row">

                  <div>

                    <strong>
                      Quantity
                    </strong>

                    <span>
                      {
                        reservation.quantity
                      }
                    </span>
                  </div>
                </div>

                <div className="warehouse-row">

                  <button
                    onClick={() =>
                      confirmReservation(
                        reservation.id
                      )
                    }
                    className="button button-primary"
                  >
                    Confirm
                  </button>

                  <button
                    onClick={() =>
                      cancelReservation(
                        reservation.id
                      )
                    }
                    className="button button-danger"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          )
        }
      )}
    </div>
  )
}