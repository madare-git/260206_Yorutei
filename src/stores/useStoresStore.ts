import { create } from 'zustand';
import type { StoreMaster, StoreRealtimeStatus, Store, StoreGenre, ChildrenPolicy, AllergyPolicy } from '@/types';

// Firebaseから取得したデータ（マスタ+リアルタイム）
interface FirebaseStoreSnapshot {
  isOpen: boolean;
  remainingCount: number;
  lastUpdated: number;
  location: { lat: number; lng: number };
  ownerName?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  genre?: StoreGenre;
  childrenPolicy?: ChildrenPolicy;
  allergyPolicy?: AllergyPolicy;
  teishokuName?: string;
  teishokuPrice?: number;
  imageUrl?: string;
  description?: string;
  createdAt?: number;
}

interface StoresState {
  // 店舗マスタ（MySQL由来）
  storeMasters: Map<string, StoreMaster>;
  // リアルタイム状態（Firebase由来）
  realtimeStatuses: Map<string, StoreRealtimeStatus>;
  // Firebaseの生データ
  firebaseSnapshots: Map<string, FirebaseStoreSnapshot>;
  isLoading: boolean;

  // アクション
  setStoreMasters: (stores: StoreMaster[]) => void;
  updateRealtimeStatus: (storeId: string, status: StoreRealtimeStatus) => void;
  setAllRealtimeStatuses: (statuses: Record<string, FirebaseStoreSnapshot>) => void;
  setLoading: (loading: boolean) => void;

  // 計算プロパティ
  getStore: (storeId: string) => Store | undefined;
  getAllStores: () => Store[];
  getOpenStores: () => Store[];
}

export const useStoresStore = create<StoresState>((set, get) => ({
  storeMasters: new Map(),
  realtimeStatuses: new Map(),
  firebaseSnapshots: new Map(),
  isLoading: true,

  setStoreMasters: (stores) => set({
    storeMasters: new Map(stores.map(s => [s.id, s])),
    isLoading: false,
  }),

  updateRealtimeStatus: (storeId, status) => set((state) => {
    const newStatuses = new Map(state.realtimeStatuses);
    newStatuses.set(storeId, status);
    return { realtimeStatuses: newStatuses };
  }),

  setAllRealtimeStatuses: (statuses) => {
    const realtimeStatuses = new Map<string, StoreRealtimeStatus>();
    const firebaseSnapshots = new Map<string, FirebaseStoreSnapshot>();

    Object.entries(statuses).forEach(([id, data]) => {
      realtimeStatuses.set(id, {
        isOpen: data.isOpen,
        remainingCount: data.remainingCount,
        lastUpdated: data.lastUpdated,
        location: data.location,
      });
      firebaseSnapshots.set(id, data);
    });

    set({
      realtimeStatuses,
      firebaseSnapshots,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  getStore: (storeId) => {
    const { storeMasters, realtimeStatuses, firebaseSnapshots } = get();
    const realtime = realtimeStatuses.get(storeId);
    const firebase = firebaseSnapshots.get(storeId);

    if (!realtime) return undefined;

    const master = storeMasters.get(storeId);

    // Firebase + MySQL両方のデータをマージ
    return {
      id: storeId,
      ownerName: master?.ownerName || firebase?.ownerName || '',
      name: master?.name || firebase?.name || '店舗名未設定',
      address: master?.address || firebase?.address || '',
      phone: master?.phone || firebase?.phone || '',
      email: master?.email || firebase?.email || '',
      genre: master?.genre || firebase?.genre || 'その他',
      childrenPolicy: master?.childrenPolicy || firebase?.childrenPolicy || '子供OK',
      allergyPolicy: master?.allergyPolicy || firebase?.allergyPolicy || '要相談',
      teishokuName: master?.teishokuName || firebase?.teishokuName || '本日の定食',
      teishokuPrice: master?.teishokuPrice || firebase?.teishokuPrice || 800,
      imageUrl: master?.imageUrl || firebase?.imageUrl,
      description: master?.description || firebase?.description,
      createdAt: master?.createdAt || firebase?.createdAt || Date.now(),
      realtimeStatus: realtime,
    };
  },

  getAllStores: () => {
    const { realtimeStatuses } = get();
    const stores: Store[] = [];

    realtimeStatuses.forEach((_, id) => {
      const store = get().getStore(id);
      if (store) stores.push(store);
    });

    return stores;
  },

  getOpenStores: () => {
    return get().getAllStores().filter(
      store => store.realtimeStatus?.isOpen && store.realtimeStatus.remainingCount > 0
    );
  },
}));
