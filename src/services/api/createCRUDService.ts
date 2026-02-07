/**
 * Generic CRUD Service Factory
 * Eliminates duplicated API service code by providing standard CRUD operations.
 *
 * Usage:
 *   import { createCRUDService } from '../createCRUDService';
 *
 *   // Untyped (backward compatible):
 *   const baseCRUD = createCRUDService('/crm/credit-notes/', 'CreditNotesAPI');
 *
 *   // Typed (recommended):
 *   const baseCRUD = createCRUDService<CreditNoteResponse, CreditNoteListResponse>(
 *     '/crm/credit-notes/', 'CreditNotesAPI'
 *   );
 *
 *   const creditNotesAPI = {
 *     ...baseCRUD,
 *     // Add custom methods beyond basic CRUD
 *     async send(id: string, data: unknown): Promise<SendResponse> { ... },
 *   };
 *   export default creditNotesAPI;
 */

import { createRequest, type RequestOptions } from './httpClient';

type RequestFn = <T = unknown>(endpoint: string, options?: RequestOptions) => Promise<T>;

interface CRUDServiceOptions {
  /** HTTP method for update operations. Defaults to 'PATCH'. Use 'PUT' for services that require full replacement. */
  updateMethod?: 'PATCH' | 'PUT';
}

/**
 * Typed CRUD service interface.
 *
 * @typeParam TItem - The single-item response type (e.g. InvoiceResponse). Defaults to `unknown`.
 * @typeParam TList - The list response type (e.g. InvoiceListResponse). Defaults to `unknown`.
 * @typeParam TCreate - The create payload type. Defaults to `unknown`.
 * @typeParam TUpdate - The update payload type. Defaults to `unknown`.
 */
export interface CRUDService<
  TItem = unknown,
  TList = unknown,
  TCreate = unknown,
  TUpdate = unknown,
> {
  /** The request function, exposed so custom methods can reuse it */
  request: RequestFn;
  /** The base endpoint, exposed so custom methods can build URLs from it */
  baseEndpoint: string;
  /** List items with optional query parameters */
  list: (params?: Record<string, string>) => Promise<TList>;
  /** Get a single item by ID */
  get: (id: string) => Promise<TItem>;
  /** Create a new item */
  create: (data: TCreate) => Promise<TItem>;
  /** Update an item by ID (uses PATCH or PUT depending on options) */
  update: (id: string, data: TUpdate) => Promise<TItem>;
  /** Delete an item by ID */
  delete: (id: string) => Promise<unknown>;
}

/**
 * Create a service object with standard CRUD operations.
 *
 * @typeParam TItem - Single-item response type. Defaults to `unknown` for backward compatibility.
 * @typeParam TList - List response type. Defaults to `unknown` for backward compatibility.
 * @typeParam TCreate - Create payload type. Defaults to `unknown`.
 * @typeParam TUpdate - Update payload type. Defaults to `unknown`.
 *
 * @param baseEndpoint - The API endpoint prefix, e.g. '/crm/credit-notes/'.
 *   If the endpoint ends with '/', URLs are built by direct concatenation (e.g. `${base}${id}`).
 *   If it does not end with '/', a '/' separator is inserted (e.g. `${base}/${id}`).
 *   The list and create methods always target the base endpoint itself.
 * @param context - Logging context passed to createRequest, e.g. 'CreditNotesAPI'.
 * @param options - Optional configuration like updateMethod.
 */
export function createCRUDService<
  TItem = unknown,
  TList = unknown,
  TCreate = unknown,
  TUpdate = unknown,
>(
  baseEndpoint: string,
  context = 'API',
  options: CRUDServiceOptions = {},
): CRUDService<TItem, TList, TCreate, TUpdate> {
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

    async list(params: Record<string, string> = {}): Promise<TList> {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${listEndpoint}?${queryString}` : listEndpoint;
      return request<TList>(endpoint, { method: 'GET' });
    },

    async get(id: string): Promise<TItem> {
      return request<TItem>(joinPath(id), { method: 'GET' });
    },

    async create(data: TCreate): Promise<TItem> {
      return request<TItem>(listEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: TUpdate): Promise<TItem> {
      return request<TItem>(joinPath(id), {
        method: updateMethod,
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<unknown> {
      return request(joinPath(id), { method: 'DELETE' });
    },
  };
}
