// Environment configuration with fallbacks
export const config = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://livpulse-backend-production.up.railway.app',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'LivPulse v2.0',
  NODE_ENV: import.meta.env.NODE_ENV || 'production',
} as const;

export default config;