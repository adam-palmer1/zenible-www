import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import zoomAPI, { type ZoomStatus } from '../../../../../services/api/crm/zoom';
import logger from '../../../../../utils/logger';

/**
 * Zoom connection card.
 *
 * Zoom is connected with Server-to-Server OAuth credentials from an app the
 * user creates inside their own Zoom account. That app type has no consent
 * screen, so there is no "authorize" redirect — the user pastes three values
 * and the server validates them against Zoom before storing.
 */

interface ZoomConnectCardProps {
  onStatusChange?: (gateway: string, status: unknown) => void;
}

const EMPTY_FORM = { accountId: '', clientId: '', clientSecret: '' };

const ZoomConnectCard: React.FC<ZoomConnectCardProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<ZoomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await zoomAPI.getStatus();
      setStatus(data);
      onStatusChange?.('zoom', data);
    } catch (err) {
      logger.error('Failed to load Zoom status:', err);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSave = async () => {
    setError(null);
    setNotice(null);
    if (!form.accountId.trim() || !form.clientId.trim() || !form.clientSecret.trim()) {
      setError('Account ID, Client ID and Client Secret are all required.');
      return;
    }

    setSaving(true);
    try {
      const result = await zoomAPI.connect(
        form.accountId.trim(),
        form.clientId.trim(),
        form.clientSecret.trim()
      );
      setNotice(result.message);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadStatus();
    } catch (err) {
      // The server passes Zoom's own reason through, which names the real
      // problem (bad secret, wrong account id, missing scope) far better than
      // a generic failure would.
      setError((err as Error).message || 'Could not connect to Zoom.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setNotice(null);
    setTesting(true);
    try {
      const result = await zoomAPI.test();
      if (result.success) setNotice(result.message);
      else setError(result.message);
    } catch (err) {
      setError((err as Error).message || 'Test failed.');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Zoom? New bookings will stop getting a Zoom link.')) return;
    setDisconnecting(true);
    setError(null);
    setNotice(null);
    try {
      await zoomAPI.disconnect();
      await loadStatus();
    } catch (err) {
      setError((err as Error).message || 'Could not disconnect.');
    } finally {
      setDisconnecting(false);
    }
  };

  const connected = !!status?.is_connected;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading Zoom…</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Zoom</h4>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                connected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {connected
              ? `Meetings are created on ${status?.account?.zoom_email || status?.account?.zoom_user_id}.`
              : 'Create a Zoom meeting automatically for every booking on a Zoom call type.'}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {connected ? (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-2.5 py-1.5 text-xs font-medium text-zenible-primary hover:bg-zenible-primary/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {testing ? 'Testing…' : 'Test'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="px-3 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Cancel' : 'Connect Zoom'}
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="mt-3 flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
          <CheckCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {showForm && !connected && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              You&apos;ll need a Server-to-Server OAuth app in your own Zoom account:
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>
                Open the{' '}
                <a
                  href="https://marketplace.zoom.us/develop/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zenible-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Zoom Marketplace
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </a>{' '}
                and build a <strong>Server-to-Server OAuth</strong> app.
              </li>
              <li>
                Add the scopes <span className="font-mono">meeting:write</span> and{' '}
                <span className="font-mono">user:read</span>, then activate it.
              </li>
              <li>Copy its Account ID, Client ID and Client Secret below.</li>
            </ol>
            <p className="pt-1">
              You must be an owner or admin of the Zoom account to create this app.
            </p>
          </div>

          {[
            { key: 'accountId' as const, label: 'Account ID', type: 'text' },
            { key: 'clientId' as const, label: 'Client ID', type: 'text' },
            { key: 'clientSecret' as const, label: 'Client Secret', type: 'password' },
          ].map((f) => (
            <div key={f.key}>
              <label
                htmlFor={`zoom-${f.key}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {f.label}
              </label>
              <input
                id={`zoom-${f.key}`}
                type={f.type}
                autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                spellCheck={false}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
              />
            </div>
          ))}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Stored encrypted and never shown again. Zenible checks them with Zoom before saving.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Checking with Zoom…' : 'Save and connect'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ZoomConnectCard;
