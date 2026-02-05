import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Store } from '@/types';
import { useReservationTimer } from '@/hooks/useTimer';
import { useReservation } from '@/hooks/useReservation';
import { useReservationStore } from '@/stores/useReservationStore';
import { useUserStore } from '@/stores/useUserStore';
import { db, ref, runTransaction } from '@/services/firebase';
import './Sidebar.css';

type DisplayMode = 'activeOnly' | 'all';

const DINING_DURATION_SEC = 20 * 60; // 20分

interface SidebarProps {
  stores: Store[];
  selectedStoreId: string | null;
  onStoreSelect: (store: Store) => void;
}

// =========================================================
// アラーム音再生
// =========================================================
function playAlarm() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 1500);
  } catch {
    // AudioContext 非対応環境では無視
  }
}

// =========================================================
// 秒 → mm:ss
// =========================================================
function formatSec(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Sidebar({ stores, selectedStoreId, onStoreSelect }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('activeOnly');

  const { activeReservation, phase, diningStartedAt, overtimeHandled } = useReservationStore();
  const { setPhase, setDiningStartedAt, setOvertimeHandled } = useReservationStore();
  const { completeReservation, cancelReservation } = useReservation();
  const user = useUserStore(s => s.user);

  // --- 到着確認 ---
  const [showArrivalConfirm, setShowArrivalConfirm] = useState(false);

  // --- 写真 ---
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // --- ダイニングタイマー ---
  const [diningRemaining, setDiningRemaining] = useState(DINING_DURATION_SEC);
  const diningIntervalRef = useRef<number | null>(null);
  const overtimeHandledRef = useRef(false);

  // overtimeHandled の同期
  useEffect(() => { overtimeHandledRef.current = overtimeHandled; }, [overtimeHandled]);

  // 移動タイマー (既存 hook)
  const { formattedTime } = useReservationTimer(() => {
    if (activeReservation) {
      cancelReservation(activeReservation.id, activeReservation.storeId);
    }
  });

  // 予約中の店舗
  const reservedStore = useMemo(() => {
    if (!activeReservation) return null;
    return stores.find(s => s.id === activeReservation.storeId) || null;
  }, [activeReservation, stores]);

  // =========================================================
  // ダイニングタイマー制御
  // =========================================================
  useEffect(() => {
    if (phase !== 'dining' || !diningStartedAt) {
      if (diningIntervalRef.current) clearInterval(diningIntervalRef.current);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - diningStartedAt) / 1000);
      const remaining = DINING_DURATION_SEC - elapsed;
      setDiningRemaining(remaining);

      // 超過検知（1回だけ）
      if (remaining <= 0 && !overtimeHandledRef.current) {
        overtimeHandledRef.current = true;
        setOvertimeHandled(true);
        playAlarm();
        // DB カウンター加算
        if (user?.uid) {
          runTransaction(ref(db, `users/${user.uid}/overtimeCount`), (current) => {
            return (current || 0) + 1;
          }).catch(err => console.error('Overtime counter error:', err));
        }
      }
    };

    tick();
    diningIntervalRef.current = window.setInterval(tick, 1000);
    return () => { if (diningIntervalRef.current) clearInterval(diningIntervalRef.current); };
  }, [phase, diningStartedAt, user?.uid, setOvertimeHandled]);

  // =========================================================
  // ハンドラ
  // =========================================================
  const handleArrived = () => setShowArrivalConfirm(true);

  const handleConfirmArrival = () => {
    setShowArrivalConfirm(false);
    setPhase('photo');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoNext = () => {
    setDiningStartedAt(Date.now());
    setPhase('dining');
  };

  const handleComplete = useCallback(async () => {
    if (!activeReservation) return;
    await completeReservation(activeReservation.id);
  }, [activeReservation, completeReservation]);

  const handleCancel = useCallback(async () => {
    if (!activeReservation) return;
    await cancelReservation(activeReservation.id, activeReservation.storeId);
  }, [activeReservation, cancelReservation]);

  // =========================================================
  // フィルタリング（通常モード用）
  // =========================================================
  const filteredStores = useMemo(() => {
    let filtered = stores;
    if (displayMode === 'activeOnly') {
      filtered = filtered.filter(
        s => s.realtimeStatus?.isOpen && (s.realtimeStatus.remainingCount ?? 0) > 0
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(q)
          || s.genre?.toLowerCase().includes(q)
          || s.address?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [stores, displayMode, searchQuery]);

  // =========================================================
  // 予約フェーズ別レンダリング
  // =========================================================
  if (activeReservation && reservedStore && phase) {

    // --- Phase: navigating ---
    if (phase === 'navigating') {
      return (
        <div className="sidebar">
          <div className="nav-view">
            <h2 className="nav-title">お店へ移動中</h2>
            <div className="nav-timer">{formattedTime}</div>
            <p className="nav-store-name">{reservedStore.name}</p>
            <hr className="nav-divider" />
            <div className="nav-actions">
              <button className="nav-arrive-btn" onClick={handleArrived}>
                到着しました
              </button>
              <button className="nav-cancel-btn" onClick={handleCancel}>
                予約をキャンセル
              </button>
            </div>
          </div>

          {/* 到着確認モーダル */}
          {showArrivalConfirm && (
            <div className="arrival-overlay" onClick={() => setShowArrivalConfirm(false)}>
              <div className="arrival-modal" onClick={e => e.stopPropagation()}>
                <h3 className="arrival-modal-title">到着確認</h3>
                <p className="arrival-modal-text">
                  {reservedStore.name} に無事到着しましたか？
                </p>
                <div className="arrival-modal-actions">
                  <button
                    className="arrival-modal-cancel"
                    onClick={() => setShowArrivalConfirm(false)}
                  >
                    まだです
                  </button>
                  <button
                    className="arrival-modal-confirm"
                    onClick={handleConfirmArrival}
                  >
                    到着しました
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- Phase: photo ---
    if (phase === 'photo') {
      return (
        <div className="sidebar">
          <div className="photo-view">
            <h2 className="photo-title">定食の写真を撮影</h2>
            <p className="photo-desc">
              エビデンスとして、提供された定食の写真を撮影してください。
            </p>

            <label className="photo-upload-area">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="photo-preview-img" />
              ) : (
                <div className="photo-placeholder">
                  <span className="photo-placeholder-icon">📷</span>
                  <span>タップして撮影</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="photo-file-input"
              />
            </label>

            <button
              className="photo-next-btn"
              onClick={handlePhotoNext}
              disabled={!photoPreview}
            >
              次へ
            </button>
          </div>
        </div>
      );
    }

    // --- Phase: dining ---
    if (phase === 'dining') {
      const isOvertime = diningRemaining <= 0;

      return (
        <div className={`sidebar ${isOvertime ? 'sidebar-overtime' : ''}`}>
          <div className="dining-view">
            {!isOvertime ? (
              <>
                <h2 className="dining-title">お食事中</h2>
                <p className="dining-message">
                  いつもファストイートのご協力<br />ありがとうございます
                </p>
                <div className="dining-timer">{formatSec(diningRemaining)}</div>
                <p className="dining-store-name">{reservedStore.name}</p>
              </>
            ) : (
              <>
                <h2 className="dining-title dining-title-overtime">お時間です</h2>
                <p className="dining-overtime-message">
                  お食事の完了と<br />ご退席をお願いいたします
                </p>
                <div className="dining-timer dining-timer-overtime">
                  {formatSec(0)}
                </div>
                <p className="dining-overtime-sub">
                  次のお客様のためにご協力をお願いいたします
                </p>
              </>
            )}

            <hr className="nav-divider" />

            <button className="dining-complete-btn" onClick={handleComplete}>
              食事完了
            </button>
          </div>
        </div>
      );
    }
  }

  // =========================================================
  // 通常のサイドバー（予約なし）
  // =========================================================
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">現在近くで夜定食が食べられる飲食店</h2>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="場所、料理名などで検索..."
          className="search-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="display-mode-toggle">
        <label className="mode-label">
          <input
            type="radio"
            name="displayMode"
            value="activeOnly"
            checked={displayMode === 'activeOnly'}
            onChange={() => setDisplayMode('activeOnly')}
          />
          提供中のみ
        </label>
        <label className="mode-label">
          <input
            type="radio"
            name="displayMode"
            value="all"
            checked={displayMode === 'all'}
            onChange={() => setDisplayMode('all')}
          />
          全て表示 (未提供含む)
        </label>
      </div>

      <ul className="shop-list">
        {filteredStores.map(store => {
          const isProviding = store.realtimeStatus?.isOpen && (store.realtimeStatus.remainingCount ?? 0) > 0;
          const remaining = store.realtimeStatus?.remainingCount ?? 0;
          const status = store.realtimeStatus;

          return (
            <li
              key={store.id}
              className={`shop-item${selectedStoreId === store.id ? ' is-active' : ''}${!isProviding ? ' is-inactive' : ''}`}
              onClick={() => onStoreSelect(store)}
            >
              <div className="shop-name">
                {store.name}
                {' '}
                {isProviding ? (
                  <span className="shop-status providing">提供中 ({remaining}席)</span>
                ) : (
                  <span className="shop-status stopped">
                    {status?.isOpen ? '売り切れ' : '停止中'}
                  </span>
                )}
              </div>
              <div className="shop-detail">
                {store.genre || 'その他'}
                {' | '}
                {store.childrenPolicy || '未設定'}
                {' | '}
                {store.allergyPolicy ? `アレルギー: ${store.allergyPolicy}` : '未設定'}
              </div>
            </li>
          );
        })}
        {filteredStores.length === 0 && (
          <li className="shop-item-empty">該当する店舗がありません</li>
        )}
      </ul>
    </div>
  );
}
