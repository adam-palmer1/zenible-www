/**
 * Contact Services API Service
 * Provides a flat, paginated list of all contact services across contacts
 */

import { createCRUDService } from '../createCRUDService';

const baseCRUD = createCRUDService('/crm/contact-services/', 'ContactServicesAPI');

const contactServicesAPI = {
  /**
   * List all contact services with server-side search, filtering, sorting, and pagination
   */
  async list(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `${baseCRUD.baseEndpoint}?${queryString}`
      : baseCRUD.baseEndpoint;

    return baseCRUD.request(url, { method: 'GET' });
  },
};

export default contactServicesAPI;
