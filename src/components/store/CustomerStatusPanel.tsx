import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Reservation } from '@/types';
import { calculateSimpleETA, type SimpleETAResult } from '@/utils/geo';
import './CustomerStatusPanel.css';

interface StoreLocation {
  lat: number;
  lng: number;
}

interface CustomerStatusPanelProps {
  bookings: Reservation[];
  isLoading: boolean;
  onMarkArrived: (reservationId: string) => void;
  storeLocation?: StoreLocation | null;
}

export default function CustomerStatusPanel({
  bookings,
  isLoading,
  onMarkArrived,
  storeLocation,
}: CustomerStatusPanelProps) {
  const activeCount = bookings.filter((b) => b.status === 'active').length;
  const arrivedCount = bookings.filter((b) => b.status === 'arrived').length;

  return (
    <div className="customer-status-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          現在の予約・来客状況
        </h2>
        <div className="panel-badges">
          {activeCount > 0 && (
            <span className="panel-badge badge-moving">{activeCount}名 移動中</span>
          )}
          {arrivedCount > 0 && (
            <span className="panel-badge badge-dining">{arrivedCount}名 食事中</span>
          )}
        </div>
      </div>

      <div className="panel-content">
        {isLoading ? (
          <div className="panel-loading">
            <div className="loading-spinner small" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="panel-empty">
            現在、予約・来客はありません
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <CustomerCard
                key={booking.id}
                booking={booking}
                onMarkArrived={onMarkArrived}
                storeLocation={storeLocation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CustomerCardProps {
  booking: Reservation;
  onMarkArrived: (reservationId: string) => void;
  storeLocation?: StoreLocation | null;
}

function CustomerCard({ booking, onMarkArrived, storeLocation }: CustomerCardProps) {
  const [now, setNow] = useState(Date.now());

  // 1秒ごとに現在時刻を更新（カウントダウン用）
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isMoving = booking.status === 'active';
  const isDining = booking.status === 'arrived';

  // 簡易ETA計算（ハバーシン公式）
  const simpleETA: SimpleETAResult | null = useMemo(() => {
    if (!booking.userLocation || !storeLocation) return null;

    return calculateSimpleETA(
      booking.userLocation.lat,
      booking.userLocation.lng,
      storeLocation.lat,
      storeLocation.lng
    );
  }, [booking.userLocation, storeLocation]);

  // 予約期限までの残り時間（移動中）
  const reservationRemainingMs = booking.expiresAt - now;
  const reservationRemainingSeconds = Math.max(0, Math.floor(reservationRemainingMs / 1000));

  // 滞在残り時間（食事中）
  const diningRemainingMs = (booking.diningExpiresAt || 0) - now;
  const diningRemainingSeconds = Math.max(0, Math.floor(diningRemainingMs / 1000));

  // 5分未満で警告表示
  const isUrgent = isMoving && reservationRemainingSeconds < 300 && reservationRemainingSeconds > 0;
  const isExpired = isMoving && reservationRemainingSeconds <= 0;
  const isDiningOvertime = isDining && diningRemainingSeconds <= 0;

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  const formatTargetTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }, []);

  // ETA表示テキストを生成
  const renderETAText = useCallback(() => {
    if (!simpleETA) {
      return <span className="eta-unknown">位置情報取得中...</span>;
    }

    // 0分 = 到着済み
    if (simpleETA.hasArrived) {
      return (
        <span className="eta-arrived">
          到着済み、または目の前です
        </span>
      );
    }

    // 300m未満 = まもなく到着
    if (simpleETA.isVeryClose) {
      return (
        <span className="eta-very-close">
          まもなく到着！
          <span className="eta-distance">
            （残り約{simpleETA.estimatedDistanceMeters}m）
          </span>
        </span>
      );
    }

    // 通常表示
    return (
      <span className="eta-time">
        到着まで約{simpleETA.estimatedMinutes}分
        <span className="eta-distance">
          （約{Math.round(simpleETA.estimatedDistanceMeters / 100) * 100}m）
        </span>
      </span>
    );
  }, [simpleETA]);

  const handleMarkArrived = () => {
    onMarkArrived(booking.id);
  };

  const displayName = booking.userDisplayName || `お客様`;

  return (
    <div
      className={`customer-card ${isMoving ? 'moving' : 'dining'} ${isUrgent ? 'urgent' : ''} ${isExpired ? 'expired' : ''} ${isDiningOvertime ? 'overtime' : ''}`}
    >
      <div className="card-header">
        <div className="card-status">
          {isMoving ? (
            <>
              <span className={`status-badge ${isUrgent ? 'badge-urgent' : 'badge-moving'}`}>
                {isUrgent ? '間もなく到着' : '移動中'}
              </span>
              <span className={`countdown ${isUrgent ? 'urgent' : ''}`}>
                残り {formatTime(reservationRemainingSeconds)}
              </span>
            </>
          ) : (
            <>
              <span className={`status-badge ${isDiningOvertime ? 'badge-overtime' : 'badge-dining'}`}>
                {isDiningOvertime ? '時間超過' : '食事中'}
              </span>
              <span className={`countdown ${isDiningOvertime ? 'overtime' : ''}`}>
                残り {formatTime(diningRemainingSeconds)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="customer-info">
          <span className="customer-name">{displayName}</span>
          <span className="customer-quantity">({booking.quantity}名)</span>
        </div>

        {isMoving && (
          <div className="eta-info">
            {renderETAText()}
          </div>
        )}

        {isDining && booking.diningExpiresAt && (
          <div className="dining-info">
            <span className="dining-target">
              退店目安: {formatTargetTime(booking.diningExpiresAt)}
            </span>
          </div>
        )}
      </div>

      {isMoving && (
        <div className="card-actions">
          <button
            className="arrival-btn"
            onClick={handleMarkArrived}
          >
            来店確認
          </button>
        </div>
      )}
    </div>
  );
}
