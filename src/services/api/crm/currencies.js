/**
 * Currencies API Service
 * Handles currency management operations
 */

import { createRequest } from '../httpClient';

const request = createRequest('CurrenciesAPI');

const currenciesAPI = {
  /** List all active currencies */
  list: () => request('/crm/currencies/', { method: 'GET' }),

  /** Get company-enabled currencies */
  getCompanyCurrencies: () => request('/crm/currencies/company/enabled', { method: 'GET' }),

  /** Add currency to company */
  addCurrencyToCompany: (currencyId) => request('/crm/currencies/company/enabled', {
    method: 'POST',
    body: JSON.stringify({ currency_id: currencyId }),
  }),

  /** Remove currency from company */
  removeCurrencyFromCompany: (associationId) => request(`/crm/currencies/company/enabled/${associationId}`, {
    method: 'DELETE',
  }),

  /** Set currency as default for company */
  setDefaultCurrency: (associationId) => request(`/crm/currencies/company/enabled/${associationId}/default`, {
    method: 'PATCH',
  }),

  /** Get company attribute by name */
  getCompanyAttribute: (attributeName) => request(`/crm/companies/current/attributes/${attributeName}`, {
    method: 'GET',
  }),

  /** Get number format attribute */
  getNumberFormat: function() {
    return this.getCompanyAttribute('number_format');
  },
};

export default currenciesAPI;
