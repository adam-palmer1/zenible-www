// API Configuration - Central source of truth
// All service files should import from here instead of defining their own API_BASE_URL

if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL environment variable is not set. ' +
    'Please set it in your .env file (e.g., VITE_API_BASE_URL=https://api.zenible.com/api/v1)'
  );
}

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
export const ZBI_API_BASE_URL: string = import.meta.env.VITE_ZBI_API_BASE_URL || API_BASE_URL;

// Derive WebSocket URL from API_BASE_URL (replace http/https with ws/wss)
export const WS_URL: string = API_BASE_URL.replace(/^http/, 'ws');
export const ZBI_WS_URL: string = import.meta.env.VITE_ZBI_WS_URL || WS_URL;
