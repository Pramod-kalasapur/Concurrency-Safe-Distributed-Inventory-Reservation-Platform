'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface WarehouseInventory {
  warehouseId: string
  warehouseName: string | null
  available: number
}

interface Product {
  id: string
  name: string
  sku: string
  warehouses: WarehouseInventory[]
}

export function ProductListContainer() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchProducts() {
    try {
      setError(null)
      const res = await fetch('/api/products')
      if (!res.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError(err?.message ?? 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    const interval = setInterval(fetchProducts, 3000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="product-grid">
        <p>Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="product-grid">
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <h2>No products available</h2>
        <p>
          Set up DATABASE_URL, run migrations, and seed the database to load inventory.
        </p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product: Product) => {
        return (
          <section key={product.id} className="product-card">
            {/* PRODUCT HEADER */}
            <div className="product-card__header">
              <div>
                <h3>{product.name}</h3>
                <p>SKU {product.sku}</p>
              </div>
              <span className="sku-badge">
                {product.warehouses.length} warehouses
              </span>
            </div>

            {/* INVENTORIES */}
            <div className="warehouse-list">
              {product.warehouses.map((inv: WarehouseInventory) => {
                const available = inv.available

                const href =
                  `/reserve?warehouseId=${inv.warehouseId}` +
                  `&productId=${product.id}` +
                  `&productName=${encodeURIComponent(product.name)}` +
                  `&warehouseName=${encodeURIComponent(inv.warehouseName ?? '')}` +
                  `&available=${available}`

                return (
                  <div key={inv.warehouseId} className="warehouse-row">
                    <div>
                      <strong>{inv.warehouseName}</strong>
                      <span>{available} available</span>
                    </div>

                    <Link
                      href={href}
                      className={
                        available > 0 ? 'button button-primary' : 'button button-disabled'
                      }
                      aria-disabled={available <= 0}
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
  )
}
