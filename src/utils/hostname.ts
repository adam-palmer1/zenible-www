export function isMarketingSite(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'www.zenible.com' || hostname === 'zenible.com';
}

export const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.zenible.com';
