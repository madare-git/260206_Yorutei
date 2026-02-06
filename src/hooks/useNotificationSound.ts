import { useCallback, useRef } from 'react';

/**
 * Web Audio APIを使用して通知音を再生するフック
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotification = useCallback(() => {
    try {
      // AudioContextを作成（既存なら再利用）
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // 2つのビープ音を連続再生（チャイム風）
      const playBeep = (startTime: number, frequency: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // フェードイン・アウト
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // 高めの音（ピンポン風）
      playBeep(now, 880, 0.15);       // A5
      playBeep(now + 0.18, 1174.66, 0.2); // D6
    } catch (error) {
      console.warn('通知音の再生に失敗しました:', error);
    }
  }, []);

  return { playNotification };
}
