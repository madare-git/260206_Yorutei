import { useEffect, useRef } from 'react';
import { useReservationStore } from '@/stores/useReservationStore';

/**
 * 予約タイマーフック
 * 1秒ごとに残り時間を更新し、タイムアウト時にコールバックを実行
 */
export function useReservationTimer(onTimeout?: () => void) {
  const activeReservation = useReservationStore((state) => state.activeReservation);
  const remainingSeconds = useReservationStore((state) => state.remainingSeconds);
  const updateTimer = useReservationStore((state) => state.updateTimer);
  const intervalRef = useRef<number | null>(null);
  const timeoutCalledRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  // コールバックを常に最新に保つ（依存配列に入れずに済む）
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    // 予約がない場合はタイマーを停止
    if (!activeReservation) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timeoutCalledRef.current = false;
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, activeReservation.expiresAt - now);
      const seconds = Math.floor(remaining / 1000);

      updateTimer(seconds);

      // タイムアウト時の処理（1回だけ実行）
      if (seconds <= 0 && !timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        onTimeoutRef.current?.();
      }
    };

    // 初回実行
    updateRemainingTime();

    // 1秒ごとに更新
    intervalRef.current = window.setInterval(updateRemainingTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeReservation, updateTimer]);

  return {
    remainingSeconds,
    isExpired: remainingSeconds <= 0,
    formattedTime: formatTime(remainingSeconds),
  };
}

/**
 * 秒数を「mm:ss」形式にフォーマット
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
