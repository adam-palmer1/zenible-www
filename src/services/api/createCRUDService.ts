/**
 * Generic CRUD Service Factory
 * Eliminates duplicated API service code by providing standard CRUD operations.
 *
 * Usage:
 *   import { createCRUDService } from '../createCRUDService';
 *
 *   const baseCRUD = createCRUDService('/crm/credit-notes/', 'CreditNotesAPI');
 *   const creditNotesAPI = {
 *     ...baseCRUD,
 *     // Add custom methods beyond basic CRUD
 *     async send(id: string, data: unknown): Promise<unknown> { ... },
 *   };
 *   export default creditNotesAPI;
 */

import { createRequest, type RequestOptions } from './httpClient';

type RequestFn = <T = unknown>(endpoint: string, options?: RequestOptions) => Promise<T>;

interface CRUDServiceOptions {
  /** HTTP method for update operations. Defaults to 'PATCH'. Use 'PUT' for services that require full replacement. */
  updateMethod?: 'PATCH' | 'PUT';
}

export interface CRUDService {
  /** The request function, exposed so custom methods can reuse it */
  request: RequestFn;
  /** The base endpoint, exposed so custom methods can build URLs from it */
  baseEndpoint: string;
  /** List items with optional query parameters */
  list: (params?: Record<string, string>) => Promise<unknown>;
  /** Get a single item by ID */
  get: (id: string) => Promise<unknown>;
  /** Create a new item */
  create: (data: unknown) => Promise<unknown>;
  /** Update an item by ID (uses PATCH or PUT depending on options) */
  update: (id: string, data: unknown) => Promise<unknown>;
  /** Delete an item by ID */
  delete: (id: string) => Promise<unknown>;
}

/**
 * Create a service object with standard CRUD operations.
 *
 * @param baseEndpoint - The API endpoint prefix, e.g. '/crm/credit-notes/'.
 *   If the endpoint ends with '/', URLs are built by direct concatenation (e.g. `${base}${id}`).
 *   If it does not end with '/', a '/' separator is inserted (e.g. `${base}/${id}`).
 *   The list and create methods always target the base endpoint itself.
 * @param context - Logging context passed to createRequest, e.g. 'CreditNotesAPI'.
 * @param options - Optional configuration like updateMethod.
 */
export function createCRUDService(
  baseEndpoint: string,
  context = 'API',
  options: CRUDServiceOptions = {},
): CRUDService {
  const request = createRequest(context);
  const updateMethod = options.updateMethod ?? 'PATCH';

  // Determine how to join the base endpoint with a sub-path.
  // Services with a trailing slash (e.g. '/crm/expenses/') concatenate directly,
  // while those without (e.g. '/crm/payments') need a '/' separator.
  const hasTrailingSlash = baseEndpoint.endsWith('/');
  const joinPath = (suffix: string) =>
    hasTrailingSlash ? `${baseEndpoint}${suffix}` : `${baseEndpoint}/${suffix}`;

  // For list/create, some services use a trailing slash on the base.
  // We normalise: if baseEndpoint already has a trailing slash we use it as-is,
  // otherwise we append one (matching the existing convention of '/crm/payments/').
  const listEndpoint = hasTrailingSlash ? baseEndpoint : `${baseEndpoint}/`;

  return {
    request,
    baseEndpoint,

    async list(params: Record<string, string> = {}): Promise<unknown> {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${listEndpoint}?${queryString}` : listEndpoint;
      return request(endpoint, { method: 'GET' });
    },

    async get(id: string): Promise<unknown> {
      return request(joinPath(id), { method: 'GET' });
    },

    async create(data: unknown): Promise<unknown> {
      return request(listEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: unknown): Promise<unknown> {
      return request(joinPath(id), {
        method: updateMethod,
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<unknown> {
      return request(joinPath(id), { method: 'DELETE' });
    },
  };
}
