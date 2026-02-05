import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';

/**
 * 現在地取得フック
 */
export function useGeolocation() {
  const updateLocation = useUserStore((state) => state.updateLocation);
  const currentLocation = useUserStore((state) => state.currentLocation);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return;
    }

    // 現在地を取得
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation]);

  return currentLocation;
}
