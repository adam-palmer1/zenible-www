import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

// Cache for platforms to avoid repeated API calls
let platformsCache: Record<string, unknown>[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export const platformAPI = {
  /**
   * Fetch active platforms, optionally filtered by character
   */
  async getActivePlatforms(options: { characterId?: string; forceRefresh?: boolean } = {}): Promise<Record<string, unknown>[]> {
    const { characterId, forceRefresh = false } = options;

    // Return cached data if available and not expired (only for non-character queries)
    if (!forceRefresh && !characterId && platformsCache && cacheTimestamp) {
      const now = Date.now();
      if (now - cacheTimestamp < CACHE_DURATION) {
        return platformsCache;
      }
    }

    try {
      // Build query params
      const params = new URLSearchParams({ is_active: 'true' });
      if (characterId) {
        params.append('character_id', characterId);
      }

      const response = await fetch(`${API_BASE_URL}/platforms/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch platforms: ${response.status}`);
      }

      const data = await response.json();

      // Sort by display_order
      const sortedPlatforms = ((data.items || []) as Record<string, unknown>[]).sort((a, b) =>
        ((a.display_order as number) || 0) - ((b.display_order as number) || 0)
      );

      // Update cache only for non-character queries
      if (!characterId) {
        platformsCache = sortedPlatforms;
        cacheTimestamp = Date.now();
      }

      return sortedPlatforms;
    } catch (error) {
      logger.error('Error fetching platforms:', error);
      // Return empty array on error to prevent app crash
      return [];
    }
  },

  /**
   * Get a specific platform by system ID
   */
  async getPlatformBySystemId(systemId: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/platforms/by-system/${systemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch platform: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      logger.error(`Error fetching platform ${systemId}:`, error);
      return null;
    }
  },

  /**
   * Clear the platforms cache
   */
  clearCache(): void {
    platformsCache = null;
    cacheTimestamp = null;
  }
};

export default platformAPI;
