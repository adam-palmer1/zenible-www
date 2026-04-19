import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * paymentsAPI is composed from `createCRUDService` which wires a live request
 * function at module load via `createRequest`. We swap the request function with
 * a mock so every test can assert exact (endpoint, options) pairs without hitting
 * the network.
 */

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock('../httpClient', async () => {
  const actual = await vi.importActual<typeof import('../httpClient')>('../httpClient');
  return {
    ...actual,
    createRequest: () => mockRequest,
  };
});

import paymentsAPI from './payments';

describe('paymentsAPI', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue(undefined);
  });

  describe('list', () => {
    it('GETs /crm/payments/ with cache-buster', async () => {
      await paymentsAPI.list({ status: 'completed' });
      const [endpoint, options] = mockRequest.mock.calls[0];
      expect(endpoint).toMatch(/^\/crm\/payments\/\?/);
      expect(endpoint).toContain('status=completed');
      expect(endpoint).toMatch(/_t=\d+/);
      expect(options).toEqual({ method: 'GET' });
    });

    it('works without params (only cache-buster)', async () => {
      await paymentsAPI.list();
      const [endpoint] = mockRequest.mock.calls[0];
      expect(endpoint).toMatch(/^\/crm\/payments\/\?_t=\d+$/);
    });
  });

  describe('allocate', () => {
    it('POSTs to /crm/payments/{id}/allocate with JSON body', async () => {
      const allocation = { allocations: [{ invoice_id: 'inv-1', amount: '50.00' }] };
      await paymentsAPI.allocate('pay-1', allocation);
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-1/allocate', {
        method: 'POST',
        body: JSON.stringify(allocation),
      });
    });
  });

  describe('autoAllocate (FIFO)', () => {
    it('POSTs to /crm/payments/{id}/auto-allocate with no body', async () => {
      await paymentsAPI.autoAllocate('pay-2');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-2/auto-allocate', {
        method: 'POST',
      });
    });
  });

  describe('getUnallocated', () => {
    it('GETs /crm/payments/{id}/unallocated', async () => {
      await paymentsAPI.getUnallocated('pay-3');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-3/unallocated', { method: 'GET' });
    });
  });

  describe('refund', () => {
    it('POSTs with refund payload', async () => {
      const refundData = { amount: '25.00', reason: 'duplicate' };
      await paymentsAPI.refund('pay-4', refundData);
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-4/refund', {
        method: 'POST',
        body: JSON.stringify(refundData),
      });
    });

    it('defaults to an empty body when no refundData given', async () => {
      await paymentsAPI.refund('pay-5');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-5/refund', {
        method: 'POST',
        body: '{}',
      });
    });
  });

  describe('getHistory', () => {
    it('GETs /crm/payments/{id}/history', async () => {
      await paymentsAPI.getHistory('pay-6');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-6/history', { method: 'GET' });
    });
  });

  describe('getNextNumber', () => {
    it('GETs /crm/payments/next-number', async () => {
      await paymentsAPI.getNextNumber();
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/next-number', { method: 'GET' });
    });
  });

  describe('project allocations', () => {
    it('getProjectAllocations GETs /allocations', async () => {
      await paymentsAPI.getProjectAllocations('pay-7');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-7/allocations', { method: 'GET' });
    });

    it('updateProjectAllocations PUTs with { allocations }', async () => {
      const allocs = [{ project_id: 'p1', amount: '10.00' }];
      await paymentsAPI.updateProjectAllocations('pay-7', allocs);
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-7/allocations', {
        method: 'PUT',
        body: JSON.stringify({ allocations: allocs }),
      });
    });

    it('deleteProjectAllocations DELETEs /allocations', async () => {
      await paymentsAPI.deleteProjectAllocations('pay-7');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/pay-7/allocations', { method: 'DELETE' });
    });
  });

  describe('getStats', () => {
    it('GETs /crm/payments/stats/overview with cache-buster', async () => {
      await paymentsAPI.getStats({ start_date: '2024-01-01' });
      const [endpoint] = mockRequest.mock.calls[0];
      expect(endpoint).toMatch(/^\/crm\/payments\/stats\/overview\?/);
      expect(endpoint).toContain('start_date=2024-01-01');
      expect(endpoint).toMatch(/_t=\d+/);
    });
  });

  describe('legacy / Stripe endpoints', () => {
    it('getPaymentMethods GETs /payments/methods', async () => {
      await paymentsAPI.getPaymentMethods();
      expect(mockRequest).toHaveBeenCalledWith('/payments/methods', { method: 'GET' });
    });

    it('addPaymentMethod POSTs /payments/methods with body', async () => {
      await paymentsAPI.addPaymentMethod({ token: 'tok_123' });
      expect(mockRequest).toHaveBeenCalledWith('/payments/methods', {
        method: 'POST',
        body: JSON.stringify({ token: 'tok_123' }),
      });
    });

    it('removePaymentMethod DELETEs /payments/methods/{id}', async () => {
      await paymentsAPI.removePaymentMethod('pm-1');
      expect(mockRequest).toHaveBeenCalledWith('/payments/methods/pm-1', { method: 'DELETE' });
    });

    it('createPaymentIntent POSTs /payments/intents', async () => {
      await paymentsAPI.createPaymentIntent({ amount: 1000 });
      expect(mockRequest).toHaveBeenCalledWith('/payments/intents', {
        method: 'POST',
        body: JSON.stringify({ amount: 1000 }),
      });
    });

    it('getStripeInvoices GETs /payments/invoices', async () => {
      await paymentsAPI.getStripeInvoices();
      expect(mockRequest).toHaveBeenCalledWith('/payments/invoices', { method: 'GET' });
    });
  });

  describe('CRUD surface from createCRUDService', () => {
    it('get(id) GETs /crm/payments/{id}', async () => {
      await paymentsAPI.get('abc');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/abc', { method: 'GET' });
    });

    it('create POSTs /crm/payments/', async () => {
      await paymentsAPI.create({ amount: '99.99' });
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/', {
        method: 'POST',
        body: JSON.stringify({ amount: '99.99' }),
      });
    });

    it('update PATCHes /crm/payments/{id}', async () => {
      await paymentsAPI.update('abc', { note: 'updated' });
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/abc', {
        method: 'PATCH',
        body: JSON.stringify({ note: 'updated' }),
      });
    });

    it('delete DELETEs /crm/payments/{id}', async () => {
      await paymentsAPI.delete('abc');
      expect(mockRequest).toHaveBeenCalledWith('/crm/payments/abc', { method: 'DELETE' });
    });
  });
});
