import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  SignalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import bookingWebhooksAPI, {
  type WebhookDelivery,
  type WebhookEndpoint,
} from '../../../../../services/api/crm/bookingWebhooks';
import { useNotification } from '../../../../../contexts/NotificationContext';
import logger from '../../../../../utils/logger';

/**
 * Booking Webhooks — subscriber config plus the delivery log.
 *
 * Signing secrets are write-only: the API never returns them, so the form
 * shows a placeholder for an existing secret and only sends a new value when
 * the user actually types one.
 */

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  dead: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const formatWhen = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const emptyForm = { name: '', url: '', secret: '', is_enabled: true };

const WebhookSettings: React.FC = () => {
  const { showError, showSuccess } = useNotification();

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadEndpoints = useCallback(async () => {
    try {
      setEndpoints(await bookingWebhooksAPI.listEndpoints());
    } catch (err) {
      logger.error('Failed to load webhook endpoints:', err);
      showError('Failed to load webhook endpoints');
    }
  }, [showError]);

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await bookingWebhooksAPI.listDeliveries({ page_size: 25 });
      setDeliveries(data.items || []);
    } catch (err) {
      logger.error('Failed to load deliveries:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadEndpoints(), loadDeliveries()]);
      setLoading(false);
    })();
  }, [loadEndpoints, loadDeliveries]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (endpoint: WebhookEndpoint) => {
    setEditingId(endpoint.id);
    // Secret intentionally blank — the API never returns it, and an empty
    // value on submit means "leave the stored secret alone".
    setForm({
      name: endpoint.name || '',
      url: endpoint.url,
      secret: '',
      is_enabled: endpoint.is_enabled,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.url.trim()) {
      showError('Webhook URL is required');
      return;
    }
    if (!editingId && !form.secret.trim()) {
      showError('A signing secret is required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await bookingWebhooksAPI.updateEndpoint(editingId, {
          name: form.name.trim() || undefined,
          url: form.url.trim(),
          is_enabled: form.is_enabled,
          ...(form.secret.trim() ? { secret: form.secret.trim() } : {}),
        });
        showSuccess('Webhook updated');
      } else {
        await bookingWebhooksAPI.createEndpoint({
          name: form.name.trim() || undefined,
          url: form.url.trim(),
          secret: form.secret.trim(),
          is_enabled: form.is_enabled,
        });
        showSuccess('Webhook created');
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadEndpoints();
    } catch (err: any) {
      logger.error('Failed to save webhook:', err);
      showError(err?.message || 'Failed to save webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (endpoint: WebhookEndpoint) => {
    if (!window.confirm(`Delete webhook "${endpoint.name || endpoint.url}"? Bookings will stop being sent to it.`)) {
      return;
    }
    try {
      await bookingWebhooksAPI.deleteEndpoint(endpoint.id);
      showSuccess('Webhook deleted');
      await loadEndpoints();
    } catch (err) {
      logger.error('Failed to delete webhook:', err);
      showError('Failed to delete webhook');
    }
  };

  const handleTest = async (endpoint: WebhookEndpoint) => {
    setTestingId(endpoint.id);
    try {
      const result = await bookingWebhooksAPI.testEndpoint(endpoint.id);
      if (result.delivered) {
        showSuccess(`Receiver accepted the test (HTTP ${result.status_code})`);
      } else {
        showError(
          result.status_code
            ? `Receiver returned HTTP ${result.status_code}`
            : result.error || 'Test delivery failed'
        );
      }
      await Promise.all([loadEndpoints(), loadDeliveries()]);
    } catch (err) {
      logger.error('Test delivery failed:', err);
      showError('Test delivery failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleResend = async (delivery: WebhookDelivery) => {
    setResendingId(delivery.id);
    try {
      await bookingWebhooksAPI.resendDelivery(delivery.id);
      showSuccess('Delivery resent');
      await loadDeliveries();
    } catch (err) {
      logger.error('Resend failed:', err);
      showError('Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading webhooks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <SignalIcon className="h-5 w-5" />
            Booking Webhooks
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Notify another system whenever a booking is made, moved, cancelled or marked
            attended. Deliveries are signed and retried automatically.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="h-4 w-4" />
          Add Webhook
        </button>
      </div>

      {/* Endpoint list */}
      {endpoints.length === 0 && !showForm ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <InformationCircleIcon className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No webhooks configured. Add one to start sending booking events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {endpoint.name || 'Untitled webhook'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        endpoint.is_enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {endpoint.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400 break-all">
                    {endpoint.url}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Last success: {formatWhen(endpoint.last_success_at)}</span>
                    {endpoint.consecutive_failures > 0 && (
                      <span className="text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        {endpoint.consecutive_failures} consecutive failure
                        {endpoint.consecutive_failures === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleTest(endpoint)}
                    disabled={testingId === endpoint.id}
                    className="px-2.5 py-1.5 text-xs font-medium text-zenible-primary hover:bg-zenible-primary/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testingId === endpoint.id ? 'Testing...' : 'Send test'}
                  </button>
                  <button
                    onClick={() => startEdit(endpoint)}
                    className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(endpoint)}
                    aria-label="Delete webhook"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {editingId ? 'Edit webhook' : 'New webhook'}
          </h4>

          <div>
            <label htmlFor="wh-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              id="wh-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ignite (adampalmer.org)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="wh-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint URL <span className="text-red-500">*</span>
            </label>
            <input
              id="wh-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://app.example.com/api/v1/webhooks/zenible/2"
              spellCheck={false}
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="wh-secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Signing secret {!editingId && <span className="text-red-500">*</span>}
            </label>
            <input
              id="wh-secret"
              type="password"
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              placeholder={editingId ? 'Leave blank to keep the current secret' : 'Provided by the receiving system'}
              autoComplete="new-password"
              spellCheck={false}
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used to sign every delivery (<span className="font-mono">X-Zenible-Signature</span>).
              Stored encrypted and never shown again.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_enabled}
              onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
              className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delivery log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Deliveries</h4>
          <button
            onClick={loadDeliveries}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {deliveries.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No deliveries yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="py-2 px-3 font-medium">Event</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Attempts</th>
                  <th className="py-2 px-3 font-medium">Last attempt</th>
                  <th className="py-2 px-3 font-medium">Response</th>
                  <th className="py-2 px-3 font-medium sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {deliveries.map((d) => (
                  <React.Fragment key={d.id}>
                    <tr className="text-gray-700 dark:text-gray-300">
                      <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">{d.event}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.status] || ''}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">{d.attempt_count}</td>
                      <td className="py-2 px-3 whitespace-nowrap text-xs">{formatWhen(d.last_attempt_at)}</td>
                      <td className="py-2 px-3 text-xs">
                        {d.last_status_code ? `HTTP ${d.last_status_code}` : (d.last_error ? 'error' : '—')}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {expanded === d.id ? 'Hide' : 'Details'}
                        </button>
                        <button
                          onClick={() => handleResend(d)}
                          disabled={resendingId === d.id}
                          className="ml-1 px-2 py-1 text-xs font-medium text-zenible-primary hover:bg-zenible-primary/10 rounded transition-colors disabled:opacity-50"
                        >
                          {resendingId === d.id ? 'Sending...' : 'Resend'}
                        </button>
                      </td>
                    </tr>
                    {expanded === d.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 dark:bg-gray-900/50 px-3 py-3">
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Event ID: </span>
                              <span className="font-mono">{d.event_id}</span>
                            </div>
                            {d.next_attempt_at && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Next retry: </span>
                                {formatWhen(d.next_attempt_at)}
                              </div>
                            )}
                            {d.last_error && (
                              <div className="text-red-600 dark:text-red-400 break-all">{d.last_error}</div>
                            )}
                            {d.last_response_body && (
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 mb-1">Response body</div>
                                <pre className="bg-gray-900 text-gray-100 rounded p-2 overflow-x-auto">
                                  {d.last_response_body}
                                </pre>
                              </div>
                            )}
                            {d.payload && (
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 mb-1">Payload sent</div>
                                <pre className="bg-gray-900 text-gray-100 rounded p-2 overflow-x-auto max-h-64">
                                  {JSON.stringify(d.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reference */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5" />
          What gets sent
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li><span className="font-mono text-xs">booking.created</span> — any new booking, from the widget, a Zenible page, or added by hand</li>
          <li><span className="font-mono text-xs">booking.rescheduled</span> — carries the previous start time</li>
          <li><span className="font-mono text-xs">booking.cancelled</span></li>
          <li><span className="font-mono text-xs">booking.completed</span> / <span className="font-mono text-xs">booking.no_show</span> — when you mark attendance</li>
        </ul>
        <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
          Each delivery carries the booking's full current state and is retried on failure
          (1 min, 5 min, 30 min, 2 h, 6 h, 24 h) before giving up.
        </p>
      </div>
    </div>
  );
};

export default WebhookSettings;
