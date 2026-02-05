import { useEffect, useState } from 'react';
import { db, ref, onValue, off } from '@/services/firebase';
import { useStoresStore } from '@/stores/useStoresStore';
import type { StoreRealtimeStatus } from '@/types';

/**
 * 全店舗のリアルタイム監視
 */
export function useStoreRealtime() {
  const setAllRealtimeStatuses = useStoresStore((state) => state.setAllRealtimeStatuses);
  const setLoading = useStoresStore((state) => state.setLoading);

  useEffect(() => {
    const storesRef = ref(db, 'stores');

    onValue(storesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllRealtimeStatuses(data);
      } else {
        setAllRealtimeStatuses({});
      }
    }, (error) => {
      console.error('Firebase subscription error:', error);
      setLoading(false);
    });

    return () => {
      off(storesRef);
    };
  }, [setAllRealtimeStatuses, setLoading]);
}

/**
 * 特定店舗のリアルタイム監視
 */
export function useStoreRealtimeSingle(storeId: string) {
  const [status, setStatus] = useState<StoreRealtimeStatus | null>(null);

  useEffect(() => {
    if (!storeId) {
      setStatus(null);
      return;
    }

    const storeRef = ref(db, `stores/${storeId}`);

    onValue(storeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus({
          isOpen: data.isOpen,
          remainingCount: data.remainingCount,
          lastUpdated: data.lastUpdated,
          location: data.location,
        });
      } else {
        setStatus(null);
      }
    });

    return () => {
      off(storeRef);
    };
  }, [storeId]);

  return status;
}
