/**
 * Countries API Service
 * Handles country management operations
 */

import { createRequest } from '../httpClient';

const request = createRequest('CountriesAPI');

const countriesAPI = {
  /** Get list of all countries */
  list: () => request('/crm/countries/', { method: 'GET' }),

  /** Get specific country by ID */
  get: (countryId: string) => request(`/crm/countries/${countryId}`, { method: 'GET' }),

  /** Get company-enabled countries */
  getCompanyCountries: () => request('/crm/countries/company/enabled', { method: 'GET' }),

  /** Add country to company */
  addCountryToCompany: (countryId: string) => request('/crm/countries/company/enabled', {
    method: 'POST',
    body: JSON.stringify({ country_id: countryId }),
  }),

  /** Remove country from company */
  removeCountryFromCompany: (associationId: string) => request(`/crm/countries/company/enabled/${associationId}`, {
    method: 'DELETE',
  }),

  /** Set country as default for company */
  setDefaultCountry: (associationId: string) => request(`/crm/countries/company/enabled/${associationId}/default`, {
    method: 'PATCH',
  }),
};

export default countriesAPI;
