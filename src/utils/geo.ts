/**
 * 地理計算ユーティリティ
 * Google Maps API（Distance Matrix）を使用せず、フロントエンドで完結する簡易ETA計算
 */

/**
 * 簡易ETA計算のための定数
 */
const DETOUR_FACTOR = 1.3;           // 迂回係数（直線→実距離補正）
const WALKING_SPEED_M_PER_MIN = 80;  // 歩行速度: 80m/分（不動産表示の標準）

/**
 * ハバーシン公式で2点間の直線距離（メートル）を算出
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球の半径（メートル）

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface SimpleETAResult {
  distanceMeters: number;          // 直線距離（m）
  estimatedDistanceMeters: number; // 推定実距離（m）
  estimatedMinutes: number;        // 到着予想時間（分）
  isVeryClose: boolean;            // 300m未満フラグ
  hasArrived: boolean;             // 到着済みフラグ（0分）
}

/**
 * ユーザー位置と店舗位置から簡易ETAを計算
 *
 * 計算式: (直線距離 × 迂回係数) ÷ 歩行速度 = 到着予想分
 *
 * @param userLat ユーザーの緯度
 * @param userLng ユーザーの経度
 * @param storeLat 店舗の緯度
 * @param storeLng 店舗の経度
 * @returns SimpleETAResult
 */
export function calculateSimpleETA(
  userLat: number,
  userLng: number,
  storeLat: number,
  storeLng: number
): SimpleETAResult {
  const distanceMeters = haversineDistance(userLat, userLng, storeLat, storeLng);
  const estimatedDistanceMeters = distanceMeters * DETOUR_FACTOR;
  const estimatedMinutes = Math.ceil(estimatedDistanceMeters / WALKING_SPEED_M_PER_MIN);

  return {
    distanceMeters: Math.round(distanceMeters),
    estimatedDistanceMeters: Math.round(estimatedDistanceMeters),
    estimatedMinutes,
    isVeryClose: estimatedDistanceMeters < 300,  // 300m未満
    hasArrived: estimatedMinutes === 0,          // 0分 = 到着済み
  };
}
