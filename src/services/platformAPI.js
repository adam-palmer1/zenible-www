import { makeAuthenticatedRequest } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://demo-api.zenible.com';

// Cache for platforms to avoid repeated API calls
let platformsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export const platformAPI = {
  /**
   * Fetch active platforms, optionally filtered by character
   * @param {Object} options - Options for fetching platforms
   * @param {string} options.characterId - Optional character ID to filter platforms
   * @param {boolean} options.forceRefresh - Force refresh the cache
   * @returns {Promise<Array>} Array of platform objects
   */
  async getActivePlatforms(options = {}) {
    const { characterId, forceRefresh = false } = options;

    // Create cache key based on parameters
    const cacheKey = characterId ? `char_${characterId}` : 'all';

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

      const response = await fetch(`${API_BASE_URL}/api/v1/platforms/?${params.toString()}`, {
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
      const sortedPlatforms = (data.platforms || []).sort((a, b) =>
        (a.display_order || 0) - (b.display_order || 0)
      );

      // Update cache only for non-character queries
      if (!characterId) {
        platformsCache = sortedPlatforms;
        cacheTimestamp = Date.now();
      }

      return sortedPlatforms;
    } catch (error) {
      console.error('Error fetching platforms:', error);
      // Return empty array on error to prevent app crash
      return [];
    }
  },

  /**
   * Get a specific platform by system ID
   * @param {string} systemId - The system_id of the platform (e.g., 'upwork')
   * @returns {Promise<Object|null>} Platform object or null if not found
   */
  async getPlatformBySystemId(systemId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/platforms/by-system/${systemId}`, {
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
      console.error(`Error fetching platform ${systemId}:`, error);
      return null;
    }
  },

  /**
   * Clear the platforms cache
   */
  clearCache() {
    platformsCache = null;
    cacheTimestamp = null;
  }
};

export default platformAPI;