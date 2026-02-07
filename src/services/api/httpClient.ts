/**
 * Shared HTTP Client for API Services
 * Consolidates common request logic, error handling, and utilities
 */

import { API_BASE_URL } from '@/config/api';
import logger from '@/utils/logger';

// Extend Error to include API-specific properties
export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

interface ValidationError {
  loc?: (string | number)[];
  msg: string;
  type?: string;
}

type ParamValue = string | number | boolean | string[] | number[] | null | undefined;

/**
 * Clean parameters by removing null, undefined, empty strings, and 'null' strings
 */
export const cleanParams = (params: Record<string, ParamValue>): Record<string, string | string[]> => {
  return Object.entries(params).reduce<Record<string, string | string[]>>((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '' && value !== 'null') {
      if (Array.isArray(value)) {
        acc[key] = value.map(String);
      } else {
        acc[key] = String(value);
      }
    }
    return acc;
  }, {});
};

/**
 * Build query string from parameters
 * Handles arrays by repeating the key for each value
 */
export const buildQueryString = (params: Record<string, ParamValue>): string => {
  const cleaned = cleanParams(params);
  const parts: string[] = [];

  for (const [key, value] of Object.entries(cleaned)) {
    if (Array.isArray(value)) {
      value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  return parts.join('&');
};

/**
 * Format Pydantic validation errors into a readable message
 */
const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(err => {
    const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
    return `${field}: ${err.msg}`;
  }).join('; ');
};

export interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

type RequestFn = <T = unknown>(endpoint: string, options?: RequestOptions) => Promise<T>;

/**
 * Create an API request function with optional context for logging
 */
export const createRequest = (context = 'API'): RequestFn => {
  return async <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
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

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMessage: string;

        // Handle Pydantic validation errors (detail is an array)
        if (Array.isArray(data?.detail)) {
          errorMessage = formatValidationErrors(data.detail);
        } else {
          errorMessage = data?.detail || data?.message || `Request failed with status ${response.status}`;
        }

        const error = new Error(errorMessage) as ApiError;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      logger.error(`[${context}] Request failed:`, error);
      throw error;
    }
  };
};

/**
 * Default request function for simple use cases
 */
export const request = createRequest();

/**
 * Base class for API services with common CRUD operations
 * Extend this class to create specific API services
 */
export class BaseAPI {
  protected baseEndpoint: string;
  protected request: RequestFn;

  constructor(baseEndpoint: string, context = 'API') {
    this.baseEndpoint = baseEndpoint;
    this.request = createRequest(context);
  }

  /**
   * List all items with optional query parameters
   */
  async list<T = unknown>(params: Record<string, ParamValue> = {}): Promise<T> {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}?${queryString}`
      : this.baseEndpoint;
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Get a single item by ID
   */
  async get<T = unknown>(id: string): Promise<T> {
    return this.request<T>(`${this.baseEndpoint}/${id}`, { method: 'GET' });
  }

  /**
   * Create a new item
   */
  async create<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an item by ID
   */
  async update<T = unknown>(id: string, data: unknown): Promise<T> {
    return this.request<T>(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Partially update an item by ID
   */
  async patch<T = unknown>(id: string, data: unknown): Promise<T> {
    return this.request<T>(`${this.baseEndpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an item by ID
   */
  async delete<T = unknown>(id: string): Promise<T> {
    return this.request<T>(`${this.baseEndpoint}/${id}`, {
      method: 'DELETE',
    });
  }
}

export default {
  request,
  createRequest,
  cleanParams,
  buildQueryString,
  BaseAPI,
};
