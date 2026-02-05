import type { Store } from '@/types';
import './BookingModal.css';

interface BookingModalProps {
  store: Store;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  error?: string | null;
}

export default function BookingModal({ store, onConfirm, onCancel, isProcessing, error }: BookingModalProps) {
  const remaining = store.realtimeStatus?.remainingCount ?? 0;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header-img" />
        <div className="modal-body">
          <h2 className="modal-shop-name">{store.name}</h2>
          <p className="modal-shop-detail">
            {store.genre || 'その他'}
            {' | '}
            {store.childrenPolicy || '未設定'}
            {' | '}
            アレルギー: {store.allergyPolicy || '未設定'}
          </p>
          <div className="modal-info-box">
            <span>残り {remaining} 席 / 1名様で予約</span>
          </div>
          <p className="modal-note">15分以内に到着してください</p>
          {error && <p className="modal-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button
            className="modal-cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            キャンセル
          </button>
          <button
            className="modal-confirm-btn"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? '処理中...' : '予約を確定する'}
          </button>
        </div>
      </div>
    </div>
  );
}
