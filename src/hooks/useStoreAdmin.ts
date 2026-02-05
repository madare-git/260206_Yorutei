import { db, ref, runTransaction } from '@/services/firebase';

/**
 * 店舗管理者用のアクション
 */
export function useStoreAdmin(storeId: string) {
  // 提供状態の切り替え（ワンタップ）
  const toggleOpen = async () => {
    if (!storeId) return;

    const storeRef = ref(db, `stores/${storeId}`);

    await runTransaction(storeRef, (currentData) => {
      if (currentData) {
        return {
          ...currentData,
          isOpen: !currentData.isOpen,
          lastUpdated: Date.now(),
        };
      }
      return currentData;
    });
  };

  // 残り食数の増減
  const updateRemainingCount = async (delta: number) => {
    if (!storeId) return;

    const storeRef = ref(db, `stores/${storeId}`);

    await runTransaction(storeRef, (currentData) => {
      if (currentData) {
        const newCount = Math.max(0, currentData.remainingCount + delta);
        return {
          ...currentData,
          remainingCount: newCount,
          lastUpdated: Date.now(),
        };
      }
      return currentData;
    });
  };

  // 残り食数を直接設定
  const setRemainingCount = async (count: number) => {
    if (!storeId) return;

    const storeRef = ref(db, `stores/${storeId}`);
    await runTransaction(storeRef, (currentData) => {
      if (currentData) {
        return {
          ...currentData,
          remainingCount: Math.max(0, count),
          lastUpdated: Date.now(),
        };
      }
      return currentData;
    });
  };

  return {
    toggleOpen,
    updateRemainingCount,
    setRemainingCount,
  };
}
