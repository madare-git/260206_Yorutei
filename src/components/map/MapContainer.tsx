import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, DirectionsRenderer } from '@react-google-maps/api';
import { mapsConfig } from '@/config';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useStoresStore } from '@/stores/useStoresStore';
import type { Store } from '@/types';
import StoreInfoWindow from './StoreInfoWindow';
import './MapContainer.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

interface MapContainerProps {
  selectedStore: Store | null;
  onStoreSelect: (store: Store | null) => void;
  onBookRequest: (store: Store) => void;
  hasActiveReservation: boolean;
  routeDestination: { lat: number; lng: number } | null;
}

export default function MapContainer({
  selectedStore,
  onStoreSelect,
  onBookRequest,
  hasActiveReservation,
  routeDestination,
}: MapContainerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: mapsConfig.apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const prevDestRef = useRef<string | null>(null);

  const { getAllStores } = useStoresStore();
  const stores = getAllStores();

  const currentLocation = useGeolocation();

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // ルート計算
  useEffect(() => {
    if (!routeDestination || !currentLocation || !isLoaded) {
      setDirections(null);
      prevDestRef.current = null;
      return;
    }

    const destKey = `${routeDestination.lat},${routeDestination.lng}`;
    if (prevDestRef.current === destKey) return;
    prevDestRef.current = destKey;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        destination: new google.maps.LatLng(routeDestination.lat, routeDestination.lng),
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
          setDirections(null);
        }
      }
    );
  }, [routeDestination, currentLocation, isLoaded]);

  const handleMarkerClick = (store: Store) => {
    onStoreSelect(store);
    if (mapRef.current && store.realtimeStatus?.location) {
      mapRef.current.panTo(store.realtimeStatus.location);
    }
  };

  const getMarkerColor = (store: Store): string => {
    const isProviding = store.realtimeStatus?.isOpen && (store.realtimeStatus.remainingCount ?? 0) > 0;
    return isProviding ? '#4285F4' : '#BDBDBD';
  };

  const panToStore = useCallback((store: Store) => {
    if (mapRef.current && store.realtimeStatus?.location) {
      mapRef.current.panTo(store.realtimeStatus.location);
    }
  }, []);

  if (selectedStore && mapRef.current && selectedStore.realtimeStatus?.location) {
    panToStore(selectedStore);
  }

  if (loadError) {
    return (
      <div className="map-error">
        <p>地図の読み込みに失敗しました</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="loading-spinner" />
        <p>地図を読み込み中...</p>
      </div>
    );
  }

  const center = currentLocation || mapsConfig.defaultCenter;

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={mapsConfig.defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* 現在地マーカー */}
        {currentLocation && (
          <MarkerF
            position={currentLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            }}
            title="現在地"
          />
        )}

        {/* 店舗マーカー */}
        {stores.map((store) => {
          const location = store.realtimeStatus?.location;
          if (!location) return null;

          return (
            <MarkerF
              key={store.id}
              position={{ lat: location.lat, lng: location.lng }}
              onClick={() => handleMarkerClick(store)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: getMarkerColor(store),
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              }}
            />
          );
        })}

        {/* ルート表示 */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 6,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {/* 選択した店舗の情報ウィンドウ */}
        {selectedStore && selectedStore.realtimeStatus?.location && (
          <InfoWindowF
            position={{
              lat: selectedStore.realtimeStatus.location.lat,
              lng: selectedStore.realtimeStatus.location.lng,
            }}
            onCloseClick={() => onStoreSelect(null)}
          >
            <StoreInfoWindow
              store={selectedStore}
              onBook={() => onBookRequest(selectedStore)}
              hasActiveReservation={hasActiveReservation}
            />
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* 凡例 */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4285F4' }} />
          <span>提供中</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#BDBDBD' }} />
          <span>停止中</span>
        </div>
      </div>
    </div>
  );
}
