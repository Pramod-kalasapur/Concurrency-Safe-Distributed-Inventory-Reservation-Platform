import React from 'react';

interface ReservationDetailsProps {
  reservationId: string;
  status: string;
  expiresAt: string;
  warehouseName: string;
  quantity: number;
  onConfirm: () => void;
  onRelease: () => void;
  expired: boolean;
  countdown: string;
}

export const ReservationDetails: React.FC<ReservationDetailsProps> = ({
  reservationId,
  status,
  expiresAt,
  warehouseName,
  quantity,
  onConfirm,
  onRelease,
  expired,
  countdown,
}) => (
  <section className="reservation-card">
    <div className="reservation-card__header">
      <div>
        <span className="eyebrow">Reservation</span>
        <h2>{reservationId}</h2>
      </div>
      <span className={`status-pill status-pill--${status.toLowerCase()}`}>{status}</span>
    </div>

    <div className="countdown-box">
      <span>{expired ? 'Reservation expired' : 'Expires in'}</span>
      <strong>{expired ? '0:00' : countdown || '--:--'}</strong>
    </div>

    <div className="detail-grid">
      <div>
        <span>Warehouse</span>
        <strong>{warehouseName}</strong>
      </div>
      <div>
        <span>Quantity</span>
        <strong>{quantity}</strong>
      </div>
      <div className="detail-grid__wide">
        <span>Expiry timestamp</span>
        <strong>{new Date(expiresAt).toLocaleString()}</strong>
      </div>
    </div>

    <div className="action-row">
      <button
        className="button button-success"
        onClick={onConfirm}
        disabled={expired || status !== 'PENDING'}
      >
        Confirm
      </button>
      <button
        className="button button-secondary"
        onClick={onRelease}
        disabled={expired || status !== 'PENDING'}
      >
        Cancel
      </button>
    </div>
  </section>
);
