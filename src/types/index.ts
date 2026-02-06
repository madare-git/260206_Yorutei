// ジャンル
export type StoreGenre = '和食' | '魚料理' | '鶏料理' | 'うどん・そば' | 'とんかつ' | '中華' | '洋食' | 'カレー' | 'その他';

// お子様の入店ポリシー
export type ChildrenPolicy = '子供OK' | '年齢制限あり' | '幼児NG';

// アレルギー対応の可否
export type AllergyPolicy = '可' | '要相談' | '不可';

// 店舗のリアルタイム状態（Firebase Realtime DB）
export interface StoreRealtimeStatus {
  isOpen: boolean;
  remainingCount: number;
  lastUpdated: number;
  location: {
    lat: number;
    lng: number;
  };
  maxDiningMinutes?: number; // 滞在可能時間（デフォルト45分）
}

// 店舗マスタ情報（Firebase Auth + Realtime DB）
export interface StoreMaster {
  id: string;
  // 基本情報
  ownerName: string;        // 代表者名
  name: string;             // 店舗名
  address: string;          // 住所
  phone: string;            // 電話番号
  email: string;            // メールアドレス
  // 定食情報
  genre: StoreGenre;        // ジャンル
  childrenPolicy: ChildrenPolicy;  // お子様入店ポリシー
  allergyPolicy: AllergyPolicy;    // アレルギー対応
  teishokuName: string;     // 定食名
  teishokuPrice: number;    // 定食予算
  // メタ
  imageUrl?: string;
  description?: string;
  createdAt: number;
}

// 統合した店舗情報
export interface Store extends StoreMaster {
  realtimeStatus?: StoreRealtimeStatus;
}

// ユーザー位置情報
export interface UserLocation {
  lat: number;
  lng: number;
  updatedAt: number;
}

// 到着予想情報
export interface EstimatedArrival {
  durationSeconds: number;  // 残り歩行時間（秒）
  distanceMeters: number;   // 残り距離（m）
  updatedAt: number;
}

// 予約情報
export interface Reservation {
  id: string;
  storeId: string;
  userId: string;
  status: 'active' | 'arrived' | 'completed' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  quantity: number;
  // 拡張フィールド
  userDisplayName?: string;           // 表示用ユーザー名
  userLocation?: UserLocation | null; // ユーザー現在地（arrived時にnull化）
  estimatedArrival?: EstimatedArrival | null; // ETA情報
  arrivedAt?: number | null;          // 来店時刻
  diningExpiresAt?: number | null;    // 退店目安時刻
}

// ユーザー情報
export interface AppUser {
  uid: string;
  role: 'user' | 'store';
  email: string;
  nickname?: string;           // ユーザーのみ
  storeId?: string;            // 店舗のみ
  activeReservationId?: string | null;
  createdAt: number;
}

// Firebase用のデータ構造
export interface FirebaseStoreData extends StoreRealtimeStatus {
  // 店舗マスタ情報も含む
  ownerName: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  genre: StoreGenre;
  childrenPolicy: ChildrenPolicy;
  allergyPolicy: AllergyPolicy;
  teishokuName: string;
  teishokuPrice: number;
  imageUrl?: string;
  description?: string;
  createdAt: number;
}

export interface FirebaseReservationData {
  storeId: string;
  userId: string;
  status: string;
  createdAt: number | object;
  expiresAt: number;
  quantity: number;
  // 拡張フィールド
  userDisplayName?: string;
  userLocation?: UserLocation | null;
  estimatedArrival?: EstimatedArrival | null;
  arrivedAt?: number | null;
  diningExpiresAt?: number | null;
}

export interface FirebaseUserData {
  role: 'user' | 'store';
  email: string;
  nickname?: string;
  storeId?: string;
  activeReservationId?: string | null;
  createdAt: number;
}
