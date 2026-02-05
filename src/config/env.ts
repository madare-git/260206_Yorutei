/**
 * 環境変数を一元管理、起動時にバリデーション
 */

const getEnvVar = (key: string, required = true): string => {
  const value = import.meta.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

export const env = {
  firebase: {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', false),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', false),
    appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  },
  googleMaps: {
    apiKey: getEnvVar('VITE_GOOGLE_MAPS_API_KEY'),
  },
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', false),
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

export type Env = typeof env;
