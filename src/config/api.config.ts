import { env } from './env';

export const apiConfig = {
  baseUrl: env.api.baseUrl,
  endpoints: {
    stores: '/api/stores',
    users: '/api/users',
    reservationHistory: '/api/reservations/history',
  },
};
