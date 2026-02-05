import type { Store } from '@/types';
import './StoreInfoWindow.css';

interface StoreInfoWindowProps {
  store: Store;
  onBook: () => void;
  hasActiveReservation: boolean;
}

export default function StoreInfoWindow({
  store,
  onBook,
  hasActiveReservation,
}: StoreInfoWindowProps) {
  const status = store.realtimeStatus;
  const isAvailable = status?.isOpen && (status.remainingCount ?? 0) > 0;
  const remaining = status?.remainingCount ?? 0;

  const detailString = [
    store.genre || 'その他',
    `${remaining}席`,
    store.childrenPolicy || '未設定',
    store.allergyPolicy ? `アレルギー: ${store.allergyPolicy}` : '未設定',
  ].join(' | ');

  return (
    <div className="store-info-window">
      <h3 className="store-iw-name">{store.name}</h3>
      <p className="store-iw-detail">{detailString}</p>
      <hr className="store-iw-divider" />
      <div className="store-iw-action">
        {hasActiveReservation ? (
          <p className="store-iw-reserved">すでに予約があります</p>
        ) : isAvailable ? (
          <button className="store-iw-book-btn" onClick={onBook}>
            決済して予約する
          </button>
        ) : (
          <p className="store-iw-closed">
            {status?.isOpen ? '売り切れ' : '現在提供停止中'}
          </p>
        )}
      </div>
    </div>
  );
}
