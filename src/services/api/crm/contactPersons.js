/**
 * Contact Persons API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('ContactPersonsAPI');

const contactPersonsAPI = {
  /** List all contact persons for a contact */
  list: (contactId) => request(`/crm/contacts/${contactId}/persons`, { method: 'GET' }),

  /** Create new contact person */
  create: (contactId, data) => request(`/crm/contacts/${contactId}/persons`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update contact person */
  update: (contactId, personId, data) => request(`/crm/contacts/${contactId}/persons/${personId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Delete contact person */
  delete: (contactId, personId) => request(`/crm/contacts/${contactId}/persons/${personId}`, {
    method: 'DELETE',
  }),
};

export default contactPersonsAPI;
