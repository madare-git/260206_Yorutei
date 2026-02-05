import { create } from 'zustand';
import type { AppUser } from '@/types';

interface UserState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentLocation: { lat: number; lng: number } | null;

  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  updateLocation: (location: { lat: number; lng: number } | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  currentLocation: null,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  updateLocation: (currentLocation) => set({ currentLocation }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
  }),
}));
