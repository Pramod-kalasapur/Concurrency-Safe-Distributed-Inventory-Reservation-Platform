'use client';

import React, { useEffect, useState } from 'react';

const metricItems = [
  { key: 'activeReservations', label: 'Active Reservations' },
  { key: 'confirmedReservations', label: 'Confirmed' },
  { key: 'releasedReservations', label: 'Released' },
  { key: 'expiredReservations', label: 'Expired' },
  { key: 'totalStock', label: 'Total Stock' },
  { key: 'availableStock', label: 'Available Stock' },
  { key: 'reservedStock', label: 'Reserved' },
  { key: 'totalReservations', label: 'Total Reservations' },
];

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/metrics');
        if (!res.ok) throw new Error('Failed to fetch metrics');
        setMetrics(await res.json());
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="surface-card loading-card">Loading metrics...</div>;
  if (error) return <div className="surface-card error-card">{error}</div>;
  if (!metrics) return null;

  return (
    <section className="metrics-panel" aria-label="Inventory metrics">
      <div className="metrics-panel__header">
        <div>
          <h2>Operations Snapshot</h2>
          <p>Auto-refreshes every 5 seconds</p>
        </div>
        <span>{(metrics.reservationSuccessRate * 100).toFixed(1)}% success rate</span>
      </div>

      <div className="metrics-grid">
        {metricItems.map((item) => (
          <div className="metric-card" key={item.key}>
            <span>{item.label}</span>
            <strong>{metrics[item.key]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
};
