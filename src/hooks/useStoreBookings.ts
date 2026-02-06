import { useEffect, useState, useRef, useCallback } from 'react';
import { db, ref, onValue, off, update } from '@/services/firebase';
import type { Reservation, FirebaseReservationData } from '@/types';
import { useNotificationSound } from './useNotificationSound';

const DEFAULT_DINING_MINUTES = 30;

interface UseStoreBookingsResult {
  bookings: Reservation[];
  isLoading: boolean;
  error: string | null;
  markAsArrived: (reservationId: string, maxDiningMinutes?: number) => Promise<void>;
}

/**
 * 店舗の予約リストをリアルタイム監視するフック
 * 新規予約が入った際に通知音を鳴らす
 */
export function useStoreBookings(storeId: string): UseStoreBookingsResult {
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playNotification } = useNotificationSound();
  const previousBookingIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!storeId) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const reservationsRef = ref(db, 'reservations');

    const handleValue = (snapshot: import('firebase/database').DataSnapshot) => {
      try {
        const data = snapshot.val();

        if (!data) {
          setBookings([]);
          setIsLoading(false);
          return;
        }

        // この店舗のアクティブな予約のみをフィルタ
        const storeBookings: Reservation[] = [];
        const currentBookingIds = new Set<string>();

        Object.entries(data).forEach(([id, value]) => {
          const reservation = value as FirebaseReservationData;

          if (reservation.storeId !== storeId) return;
          if (reservation.status !== 'active' && reservation.status !== 'arrived') return;

          currentBookingIds.add(id);

          // createdAtがサーバータイムスタンプの場合の処理
          const createdAt = typeof reservation.createdAt === 'object'
            ? Date.now()
            : reservation.createdAt;

          storeBookings.push({
            id,
            storeId: reservation.storeId,
            userId: reservation.userId,
            status: reservation.status as Reservation['status'],
            createdAt,
            expiresAt: reservation.expiresAt,
            quantity: reservation.quantity,
            userDisplayName: reservation.userDisplayName,
            userLocation: reservation.userLocation,
            estimatedArrival: reservation.estimatedArrival,
            arrivedAt: reservation.arrivedAt,
            diningExpiresAt: reservation.diningExpiresAt,
          });
        });

        // 新規予約の検出（初回ロード時は鳴らさない）
        if (!isFirstLoadRef.current) {
          currentBookingIds.forEach((id) => {
            if (!previousBookingIdsRef.current.has(id)) {
              // 新規予約を検出 → 通知音を鳴らす
              playNotification();
            }
          });
        }

        // 予約IDを記録
        previousBookingIdsRef.current = currentBookingIds;
        isFirstLoadRef.current = false;

        // createdAtでソート（新しい順）
        storeBookings.sort((a, b) => b.createdAt - a.createdAt);

        setBookings(storeBookings);
        setIsLoading(false);
      } catch (err) {
        console.error('予約データの解析エラー:', err);
        setError('予約データの取得に失敗しました');
        setIsLoading(false);
      }
    };

    onValue(reservationsRef, handleValue, (err) => {
      console.error('予約監視エラー:', err);
      setError('予約の監視に失敗しました');
      setIsLoading(false);
    });

    return () => {
      off(reservationsRef);
    };
  }, [storeId, playNotification]);

  /**
   * 予約を「来店済み」に変更
   * プライバシー保護のためuserLocationをnullにクリア
   */
  const markAsArrived = useCallback(async (
    reservationId: string,
    maxDiningMinutes: number = DEFAULT_DINING_MINUTES
  ) => {
    const now = Date.now();
    const diningExpiresAt = now + maxDiningMinutes * 60 * 1000;

    const updates: Record<string, unknown> = {
      [`reservations/${reservationId}/status`]: 'arrived',
      [`reservations/${reservationId}/arrivedAt`]: now,
      [`reservations/${reservationId}/diningExpiresAt`]: diningExpiresAt,
      // プライバシー保護: 位置情報をクリア
      [`reservations/${reservationId}/userLocation`]: null,
      [`reservations/${reservationId}/estimatedArrival`]: null,
    };

    await update(ref(db), updates);
  }, []);

  return {
    bookings,
    isLoading,
    error,
    markAsArrived,
  };
}
