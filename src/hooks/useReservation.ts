import { db, ref, runTransaction, push, set, serverTimestamp } from '@/services/firebase';
import { useUserStore } from '@/stores/useUserStore';
import { useReservationStore } from '@/stores/useReservationStore';
import type { Reservation } from '@/types';

const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15分

export function useReservation() {
  const user = useUserStore((state) => state.user);
  const { setActiveReservation, setProcessing, setError, clearReservation } = useReservationStore();

  /**
   * 予約を作成
   */
  const createReservation = async (storeId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: '認証が必要です' };
    }

    setProcessing(true);

    try {
      const storeRef = ref(db, `stores/${storeId}`);

      // 1. トランザクションで在庫確認 & 減少
      let abortReason = '';
      const result = await runTransaction(storeRef, (currentData) => {
        if (currentData === null) {
          abortReason = '店舗データが見つかりません';
          return; // abort
        }

        if (!currentData.isOpen) {
          abortReason = '現在この店舗は提供停止中です';
          return; // 提供停止中
        }

        if (currentData.remainingCount <= 0) {
          abortReason = '在庫がありません（売り切れ）';
          return; // 在庫切れ
        }

        return {
          ...currentData,
          remainingCount: currentData.remainingCount - 1,
          lastUpdated: Date.now(),
        };
      });

      if (!result.committed) {
        const msg = abortReason || '予約を確定できませんでした';
        setError(msg);
        return { success: false, error: msg };
      }

      // 2. 予約レコードを作成
      const now = Date.now();
      const expiresAt = now + RESERVATION_DURATION_MS;
      const reservationsRef = ref(db, 'reservations');
      const newReservationRef = push(reservationsRef);
      const reservationId = newReservationRef.key!;

      const reservationData = {
        storeId,
        userId: user.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt,
        quantity: 1,
      };

      await set(newReservationRef, reservationData);

      // 3. ユーザーのアクティブ予約を更新
      await set(ref(db, `users/${user.uid}/activeReservationId`), reservationId);

      // 4. ローカル状態を更新
      const reservation: Reservation = {
        id: reservationId,
        storeId,
        userId: user.uid,
        status: 'active',
        createdAt: now,
        expiresAt,
        quantity: 1,
      };

      setActiveReservation(reservation);
      setProcessing(false);

      return { success: true };
    } catch (error) {
      console.error('Reservation error:', error);
      const msg = error instanceof Error && error.message.includes('PERMISSION_DENIED')
        ? 'データベースへの書き込み権限がありません。Firebase Realtime Database のルールを確認してください。'
        : `予約処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      setError(msg);
      return { success: false, error: msg };
    }
  };

  /**
   * 予約をキャンセル
   */
  const cancelReservation = async (reservationId: string, storeId: string): Promise<void> => {
    if (!user) return;

    setProcessing(true);

    try {
      // 1. 在庫を戻す
      const storeRef = ref(db, `stores/${storeId}`);
      await runTransaction(storeRef, (currentData) => {
        if (currentData) {
          return {
            ...currentData,
            remainingCount: currentData.remainingCount + 1,
            lastUpdated: Date.now(),
          };
        }
        return currentData;
      });

      // 2. 予約ステータスを更新
      await set(ref(db, `reservations/${reservationId}/status`), 'cancelled');

      // 3. ユーザーのアクティブ予約をクリア
      await set(ref(db, `users/${user.uid}/activeReservationId`), null);

      // 4. ローカル状態をクリア
      clearReservation();
    } catch (error) {
      console.error('Cancel error:', error);
      setError('キャンセルに失敗しました');
    }
  };

  /**
   * 予約を完了（来店確認）
   */
  const completeReservation = async (reservationId: string): Promise<void> => {
    if (!user) return;

    try {
      // 1. 予約ステータスを更新
      await set(ref(db, `reservations/${reservationId}/status`), 'completed');

      // 2. ユーザーのアクティブ予約をクリア
      await set(ref(db, `users/${user.uid}/activeReservationId`), null);

      // 3. ローカル状態をクリア
      clearReservation();
    } catch (error) {
      console.error('Complete error:', error);
      setError('完了処理に失敗しました');
    }
  };

  return {
    createReservation,
    cancelReservation,
    completeReservation,
  };
}
