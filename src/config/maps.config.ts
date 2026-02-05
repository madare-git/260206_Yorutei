import { env } from './env';

export const mapsConfig = {
  apiKey: env.googleMaps.apiKey,
  defaultCenter: {
    lat: 35.6812, // 東京駅
    lng: 139.7671,
  },
  defaultZoom: 15,
  mapId: 'yorutei-map', // Advanced Marker用（Google Cloud Consoleで作成）
};
