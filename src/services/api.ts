import { apiConfig } from '@/config';
import type { StoreMaster } from '@/types';

const API_BASE = apiConfig.baseUrl;

/**
 * さくらサーバーのPHP APIとの通信
 * MVP段階では店舗マスタはFirebaseに直接保存するため、
 * このAPIは後続フェーズで使用
 */

export const api = {
  // 店舗マスタ取得
  async getStores(): Promise<StoreMaster[]> {
    if (!API_BASE) {
      console.warn('API_BASE_URL is not configured. Using Firebase only.');
      return [];
    }
    const res = await fetch(`${API_BASE}${apiConfig.endpoints.stores}`);
    if (!res.ok) throw new Error('Failed to fetch stores');
    return res.json();
  },

  // 予約履歴保存
  async saveReservationHistory(data: {
    reservationId: string;
    storeId: string;
    userId: string;
    status: string;
    createdAt: number;
    completedAt?: number;
  }): Promise<void> {
    if (!API_BASE) {
      console.warn('API_BASE_URL is not configured. Skipping history save.');
      return;
    }
    await fetch(`${API_BASE}${apiConfig.endpoints.reservationHistory}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
