/**
 * Gateway Transaction Sync API
 *
 * Pulls Stripe/PayPal ledgers into payments and fee expenses, including money
 * taken outside Zenible.
 */

import { createRequest } from '../httpClient';

const request = createRequest('GatewaySyncAPI');

export interface GatewaySyncAccountStatus {
  provider: string;
  account_ref: string;
  synced_through: string | null;
  backfill_complete: boolean;
  last_run_at: string | null;
  last_error: string | null;
}

export interface GatewaySyncSettings {
  enabled: boolean;
  enabled_at: string | null;
  connected_accounts: GatewaySyncAccountStatus[];
  /** Providers whose payments are created automatically; others queue for review. */
  auto_create_providers: string[];
}

export interface GatewaySyncStatus {
  accounts: GatewaySyncAccountStatus[];
  total_entries: number;
  needs_review: number;
  pending: number;
  failed: number;
  /** Payment exists and counts, but the payer is unconfirmed. */
  needs_attribution: number;
  /** Nothing was created; this money is not in the figures. */
  unrecorded: number;
  /** Deliberately set aside, and restorable. */
  ignored: number;
}

export interface MaterialiseSummary {
  processed: number;
  matched: number;
  created: number;
  needs_review: number;
  ignored: number;
  failed: number;
  errors: string[];
}

export interface FetchSummary {
  provider: string;
  account_ref: string;
  fetched: number;
  inserted: number;
  skipped_existing: number;
  window_start: string | null;
  window_end: string | null;
  error: string | null;
  warnings: string[];
}

export interface GatewaySyncRunResult {
  status: string;
  accounts: number;
  fetches: FetchSummary[];
  materialise: MaterialiseSummary | null;
  errors: string[];
}

export interface GatewaySyncRunParams {
  provider?: string;
  /** ISO datetime. Omit to resume from where the last sync finished. */
  since?: string;
  until?: string;
  fetch_limit?: number;
  /** false = read the gateways only, writing no payments or expenses. */
  materialise?: boolean;
  /** true = report what would be created without creating it. */
  dry_run?: boolean;
}

export interface GatewayLedgerEntry {
  id: string;
  provider: string;
  account_ref: string;
  gateway_txn_id: string;
  livemode: boolean;
  entry_type: string;
  status: string;
  gross_amount: string;
  fee_amount: string;
  net_amount: string;
  currency_code: string;
  occurred_at: string;
  payer_email: string | null;
  payer_name: string | null;
  description: string | null;
  crm_payment_id: string | null;
  contact_id: string | null;
  contact_was_created: boolean;
  processing_error: string | null;
}

export interface GatewayLedgerList {
  items: GatewayLedgerEntry[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

class GatewaySyncAPI {
  private base = '/crm/gateway-sync';

  async getSettings(): Promise<GatewaySyncSettings> {
    return request<GatewaySyncSettings>(`${this.base}/settings`, { method: 'GET' });
  }

  async setEnabled(enabled: boolean): Promise<GatewaySyncSettings> {
    return request<GatewaySyncSettings>(`${this.base}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async getStatus(): Promise<GatewaySyncStatus> {
    return request<GatewaySyncStatus>(`${this.base}/status`, { method: 'GET' });
  }

  async run(params: GatewaySyncRunParams = {}): Promise<GatewaySyncRunResult> {
    return request<GatewaySyncRunResult>(`${this.base}/run`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /** Assign a reviewed entry to a contact, and optionally an invoice. */
  async attribute(
    entryId: string,
    payload: { contact_id?: string; invoice_id?: string }
  ): Promise<GatewayLedgerEntry> {
    return request<GatewayLedgerEntry>(`${this.base}/entries/${entryId}/attribute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Undo an ignore. The entry is reprocessed, so it lands wherever it belongs. */
  async restore(entryId: string): Promise<GatewayLedgerEntry> {
    return request<GatewayLedgerEntry>(`${this.base}/entries/${entryId}/restore`, {
      method: 'POST',
    });
  }

  /** Mark an entry as deliberately not turned into anything. */
  async ignore(entryId: string): Promise<GatewayLedgerEntry> {
    return request<GatewayLedgerEntry>(`${this.base}/entries/${entryId}/ignore`, {
      method: 'POST',
    });
  }

  async listEntries(
    params: { status?: string; provider?: string; page?: number; per_page?: number } = {}
  ): Promise<GatewayLedgerList> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.provider) query.set('provider', params.provider);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    return request<GatewayLedgerList>(`${this.base}/entries${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }
}

const gatewaySyncAPI = new GatewaySyncAPI();
export default gatewaySyncAPI;
