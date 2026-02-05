import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import { useStoresStore } from '@/stores/useStoresStore';
import { useStoreRealtime } from '@/hooks/useStoreRealtime';
import { useReservation } from '@/hooks/useReservation';
import { useReservationStore } from '@/stores/useReservationStore';
import { logout } from '@/services/auth';
import MapContainer from '@/components/map/MapContainer';
import Sidebar from '@/components/map/Sidebar';
import BookingModal from '@/components/map/BookingModal';
import type { Store } from '@/types';
import './MapPage.css';

export default function MapPage() {
  const navigate = useNavigate();
  const { user, logout: clearUser } = useUserStore();

  // リアルタイム監視を開始
  useStoreRealtime();

  const { getAllStores, isLoading } = useStoresStore();
  const stores = getAllStores();

  const { createReservation } = useReservation();
  const { activeReservation, isProcessing, phase, error: reservationError, setError: setReservationError } = useReservationStore();

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [bookingStore, setBookingStore] = useState<Store | null>(null);

  // 移動中フェーズのみルート表示
  const routeDestination = useMemo(() => {
    if (phase !== 'navigating' || !activeReservation) return null;
    const store = stores.find(s => s.id === activeReservation.storeId);
    const loc = store?.realtimeStatus?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  }, [phase, activeReservation, stores]);

  // ログインしていない場合はリダイレクト
  useEffect(() => {
    if (!user || user.role !== 'user') {
      navigate('/user/login');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    clearUser();
    navigate('/');
  };

  // サイドバーから店舗を選択
  const handleSidebarStoreSelect = (store: Store) => {
    setSelectedStore(store);
  };

  // マップから店舗を選択/解除
  const handleMapStoreSelect = (store: Store | null) => {
    setSelectedStore(store);
  };

  // 予約モーダルを開く
  const handleBookRequest = (store: Store) => {
    setReservationError(null);
    setBookingStore(store);
  };

  // 予約を確定
  const handleConfirmBooking = async () => {
    if (!bookingStore) return;
    const result = await createReservation(bookingStore.id);
    if (result.success) {
      setBookingStore(null);
      setSelectedStore(null);
    }
  };

  // 認証チェック中はローディング表示
  if (!user || user.role !== 'user') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* サイドバー */}
      <Sidebar
        stores={stores}
        selectedStoreId={selectedStore?.id || null}
        onStoreSelect={handleSidebarStoreSelect}
      />

      {/* メインマップエリア */}
      <div className="map-main">
        {/* ヘッダー（マップ上に重ねる） */}
        <header className="map-header">
          <h1 className="logo">よる定</h1>
          <div className="header-right">
            <button className="user-menu" onClick={handleLogout}>
              {user.nickname || 'ユーザー'} ▼
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p>店舗情報を読み込み中...</p>
          </div>
        ) : (
          <MapContainer
            selectedStore={selectedStore}
            onStoreSelect={handleMapStoreSelect}
            onBookRequest={handleBookRequest}
            hasActiveReservation={!!activeReservation}
            routeDestination={routeDestination}
          />
        )}
      </div>

      {/* 予約確認モーダル */}
      {bookingStore && (
        <BookingModal
          store={bookingStore}
          onConfirm={handleConfirmBooking}
          onCancel={() => { setReservationError(null); setBookingStore(null); }}
          isProcessing={isProcessing}
          error={reservationError}
        />
      )}
    </div>
  );
}
