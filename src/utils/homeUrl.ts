const HOME_URL = import.meta.env.VITE_HOME_URL || 'https://www.zenible.com';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/**
 * Build the home URL, preserving any UTM params stored in sessionStorage.
 */
export function getHomeUrl(): string {
  const url = new URL(HOME_URL);
  for (const key of UTM_KEYS) {
    const value = sessionStorage.getItem(`zenible_${key}`);
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
