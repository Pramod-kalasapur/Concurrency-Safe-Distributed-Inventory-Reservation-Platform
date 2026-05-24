import Link from 'next/link'
import { MetricsDashboard } from '../components/MetricsDashboard'
import { ActiveReservations } from '../components/ActiveReservations'
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

        <div className="product-grid">

          {products.map((product:any) => {

            return (

              <section
                key={product.id}
                className="product-card"
              >

                {/* PRODUCT HEADER */}

                <div className="product-card__header">

                  <div>

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      SKU {product.sku}
                    </p>
                  </div>

                  <span className="sku-badge">

                    {
                      product.inventories.length
                    }{' '}
                    warehouses
                  </span>
                </div>

                {/* INVENTORIES */}

                <div className="warehouse-list">

                  {product.inventories.map((inv: any) => {

                    const available =
                      inv.totalStock -
                      inv.reservedStock

                    const href =
                      `/reserve?warehouseId=${inv.warehouseId}` +
                      `&productId=${product.id}` +
                      `&productName=${encodeURIComponent(product.name)}` +
                      `&warehouseName=${encodeURIComponent(
                        inv.warehouse?.name ?? ''
                      )}` +
                      `&available=${available}`

                    return (

                      <div
                        key={inv.warehouseId}
                        className="warehouse-row"
                      >

                        <div>

                          <strong>
                            {inv.warehouse?.name}
                          </strong>

                          <span>
                            {available} available
                          </span>
                        </div>

                        <Link
                          href={href}
                          className={
                            available > 0
                              ? 'button button-primary'
                              : 'button button-disabled'
                          }
                          aria-disabled={
                            available <= 0
                          }
                        >
                          Reserve
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
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

    </main>
  )
}