import { create } from 'zustand';
import type { Reservation } from '@/types';

export type ReservationPhase = 'navigating' | 'arrived' | 'photo' | 'dining';

interface ReservationState {
  activeReservation: Reservation | null;
  remainingSeconds: number;
  isProcessing: boolean;
  error: string | null;

  // フェーズ管理
  phase: ReservationPhase | null;
  diningStartedAt: number | null;
  overtimeHandled: boolean;

  setActiveReservation: (reservation: Reservation | null) => void;
  updateTimer: (seconds: number) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  clearReservation: () => void;

  setPhase: (phase: ReservationPhase | null) => void;
  setDiningStartedAt: (time: number | null) => void;
  setOvertimeHandled: (handled: boolean) => void;
}

export const useReservationStore = create<ReservationState>((set) => ({
  activeReservation: null,
  remainingSeconds: 0,
  isProcessing: false,
  error: null,

  phase: null,
  diningStartedAt: null,
  overtimeHandled: false,

  setActiveReservation: (activeReservation) => set({
    activeReservation,
    remainingSeconds: activeReservation
      ? Math.max(0, Math.floor((activeReservation.expiresAt - Date.now()) / 1000))
      : 0,
    error: null,
    phase: activeReservation ? 'navigating' : null,
  }),

  updateTimer: (remainingSeconds) => set({ remainingSeconds }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error, isProcessing: false }),

  clearReservation: () => set({
    activeReservation: null,
    remainingSeconds: 0,
    isProcessing: false,
    error: null,
    phase: null,
    diningStartedAt: null,
    overtimeHandled: false,
  }),

  setPhase: (phase) => set({ phase }),
  setDiningStartedAt: (diningStartedAt) => set({ diningStartedAt }),
  setOvertimeHandled: (overtimeHandled) => set({ overtimeHandled }),
}));
