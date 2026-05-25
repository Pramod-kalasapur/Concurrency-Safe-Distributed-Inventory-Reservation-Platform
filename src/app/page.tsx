import Link from 'next/link'
import { MetricsDashboard } from '../components/MetricsDashboard'
import { ActiveReservations } from '../components/ActiveReservations'
import { ConfirmedReservations } from '../components/ConfirmedReservations'
import { ProductListContainer } from '../components/ProductListContainer'
import { prisma } from '../lib/prisma'

export const dynamic = 'force-dynamic'

export default async function HomePage() {

  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
  })

  const inventoryCount = products.reduce(
    (sum: number, product: any) => {
      return sum + product.inventories.length
    },
    0
  )

  return (
    <main className="app-shell">

      {/* HERO SECTION */}

      <section className="page-hero">

        <div>

          <div className="eyebrow">
            Inventory Control
          </div>

          <h1>
            Distributed Inventory Reservation
          </h1>

          <p>
            Concurrency-safe checkout
            reservations across warehouses,
            backed by PostgreSQL row locks,
            serializable transactions,
            idempotency keys,
            and automatic expiry.
          </p>
        </div>

        <div
          className="hero-panel"
          aria-label="System status"
        >

          <span className="status-dot" />

          <div>

            <strong>
              Live stock protection
            </strong>

            <span>
              Row-level locking active
            </span>
          </div>
        </div>
      </section>

      {/* DASHBOARD */}

      <MetricsDashboard />

      {/* PRODUCTS HEADER */}

      <section className="section-header">

        <div>

          <h2>
            Product Availability
          </h2>

          <p>
            {products.length} products across{' '}
            {inventoryCount} warehouse stock positions
          </p>
        </div>
      </section>

      {/* EMPTY STATE */}

      {products.length === 0 ? (

        <div className="empty-state">

          <h2>
            No products available
          </h2>

          <p>
            Set up DATABASE_URL,
            run migrations,
            and seed the database
            to load inventory.
          </p>
        </div>

      ) : (

        <ProductListContainer />
      )}

      {/* ACTIVE RESERVATIONS */}

      <section className="section-header mt-12">

        <div>

          <h2>
            Active Reservations
          </h2>

          <p>
            Manage pending checkout
            reservations in real time
          </p>
        </div>
      </section>

      <ActiveReservations />

      {/* CONFIRMED RESERVATIONS */}

      <section className="section-header mt-12">

        <div>

          <h2>
            Confirmed Reservations
          </h2>

          <p>
            View all confirmed
            and completed reservations
          </p>
        </div>
      </section>

      <ConfirmedReservations />

    </main>
  )
}