// API service for Tip of the Day endpoints
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';
import aiCharacterAPI from './aiCharacterAPI';

class TipAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      return await response.json() as T;
    } catch (error) {
      logger.error('Tip API request failed:', error);
      throw error;
    }
  }

  // Get random tip of the day with caching
  async getRandomTip(params: { character_id?: string; exclude_recent_days?: number } = {}): Promise<unknown> {
    const cacheKey = 'tip_of_the_day';
    const cacheExpiryKey = 'tip_of_the_day_expiry';

    // Check cache first
    const cached = this.getCachedTip(cacheKey, cacheExpiryKey);
    if (cached) {
      return cached;
    }

    // Build query string
    const queryParams = new URLSearchParams();
    if (params.character_id) {
      queryParams.append('character_id', params.character_id);
    }
    if (params.exclude_recent_days !== undefined) {
      queryParams.append('exclude_recent_days', params.exclude_recent_days.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/tips/random?${queryString}` : '/tips/random';

    try {
      const response = await this.request(endpoint, { method: 'GET' });

      // Cache the response for 1 hour
      this.cacheTip(response, cacheKey, cacheExpiryKey);

      return response;
    } catch (error) {
      // If API fails, try to return cached tip regardless of expiry
      const fallbackCache = localStorage.getItem(cacheKey);
      if (fallbackCache) {
        logger.warn('API failed, using cached tip:', error);
        return JSON.parse(fallbackCache);
      }
      throw error;
    }
  }

  // Cache tip for 1 hour
  private cacheTip(tipData: unknown, cacheKey: string, expiryKey: string): void {
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour
    localStorage.setItem(cacheKey, JSON.stringify(tipData));
    localStorage.setItem(expiryKey, expiryTime.toString());
  }

  // Get cached tip if still valid
  private getCachedTip(cacheKey: string, expiryKey: string): unknown | null {
    const cached = localStorage.getItem(cacheKey);
    const expiry = localStorage.getItem(expiryKey);

    if (cached && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        return JSON.parse(cached);
      }
    }

    return null;
  }

  // Clear tip cache (useful for testing)
  clearTipCache(): void {
    localStorage.removeItem('tip_of_the_day');
    localStorage.removeItem('tip_of_the_day_expiry');
  }

  // Get tip from specific character
  async getTipFromCharacter(characterId: string, excludeRecentDays: number = 7): Promise<unknown> {
    return this.getRandomTip({
      character_id: characterId,
      exclude_recent_days: excludeRecentDays
    });
  }

  // Get random tip with character details
  async getRandomTipWithCharacter(params: { character_id?: string; exclude_recent_days?: number } = {}): Promise<unknown> {
    try {
      // Get the tip first
      const tipResponse = await this.getRandomTip(params) as Record<string, unknown>;

      // If tip has an associated character, fetch character details
      const tip = tipResponse?.tip as Record<string, unknown> | undefined;
      if (tip?.ai_character_id) {
        try {
          const character = await aiCharacterAPI.getCharacter(tip.ai_character_id as string);
          return {
            ...tipResponse,
            character: character
          };
        } catch (charError) {
          logger.warn('Failed to fetch character details:', charError);
          // Return tip without character details if character fetch fails
          return tipResponse;
        }
      }

      return tipResponse;
    } catch (error) {
      logger.error('Failed to get tip with character:', error);
      throw error;
    }
  }
}

export default new TipAPI();
