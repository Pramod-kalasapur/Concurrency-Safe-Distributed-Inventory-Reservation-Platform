'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ReservePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId') ?? '';
  const warehouseId = searchParams.get('warehouseId') ?? '';
  const productName = searchParams.get('productName') ?? 'Selected product';
  const warehouseName = searchParams.get('warehouseName') ?? 'Selected warehouse';
  const available = searchParams.get('available');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onReserve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ productId, warehouseId, quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reservation failed');
      // Redirect to reservation status page
      router.push(`/reservation?id=${data.reservationId}`);
    } catch (err: any) {
      setMessage(err?.message ?? 'Reservation failed');
      setLoading(false);
    }
  }

  return (
    <main className="app-shell app-shell--narrow">
      <Link href="/" className="back-link">Back to catalog</Link>

      <section className="checkout-card">
        <div className="checkout-card__header">
          <div>
            <div className="eyebrow">Create Reservation</div>
            <h1>Reserve Inventory</h1>
            <p>A hold will be created for 10 minutes while you confirm checkout.</p>
          </div>
        </div>

        <div className="summary-box">
          <div>
            <span>Product</span>
            <strong>{productName}</strong>
          </div>
          <div>
            <span>Warehouse</span>
            <strong>{warehouseName}</strong>
          </div>
          <div>
            <span>Available</span>
            <strong>{available ?? 'Live check'}</strong>
          </div>
        </div>

        <form onSubmit={onReserve} className="reservation-form">
          <label>
            <span>Quantity</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>

          <button type="submit" disabled={loading || !productId || !warehouseId} className="button button-primary button-wide">
            {loading ? 'Reserving...' : 'Create reservation'}
          </button>

          {message ? <div className="form-message">{message}</div> : null}
        </form>
      </section>
    </main>
  );
}
