import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import gatewaySyncAPI, {
  type GatewaySyncSettings,
  type GatewaySyncStatus,
  type GatewaySyncRunResult,
} from '../../../../../services/api/finance/gatewaySync';
import logger from '../../../../../utils/logger';
import GatewaySyncReviewModal from './GatewaySyncReviewModal';

/** yyyy-mm-dd for <input type="date">. */
const toDateInput = (d: Date): string => d.toISOString().slice(0, 10);

const formatDateTime = (value: string | null): string => {
  if (!value) return 'never';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

interface RunSummaryProps {
  result: GatewaySyncRunResult;
  wasDryRun: boolean;
}

const RunSummary: React.FC<RunSummaryProps> = ({ result, wasDryRun }) => {
  const m = result.materialise;
  const fetched = result.fetches.reduce((sum, f) => sum + f.fetched, 0);

  return (
    <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {wasDryRun ? 'Preview — nothing was created' : 'Sync complete'}
      </p>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Read {fetched} transaction{fetched === 1 ? '' : 's'} from {result.accounts} account
        {result.accounts === 1 ? '' : 's'}.
      </p>

      {m && (
        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">
              {wasDryRun ? 'Would create' : 'Created'}
            </dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{m.created}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Already recorded</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{m.matched}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Needs review</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{m.needs_review}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Ignored</dt>
            <dd
              className="font-semibold text-gray-900 dark:text-white"
              title="Payouts, transfers and fees — money already counted as income"
            >
              {m.ignored}
            </dd>
          </div>
        </dl>
      )}

      {result.errors.length > 0 && (
        <ul className="mt-3 space-y-1">
          {result.errors.map((err, i) => (
            <li key={i} className="text-sm text-amber-700 dark:text-amber-300">
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const GatewaySyncCard: React.FC = () => {
  const [settings, setSettings] = useState<GatewaySyncSettings | null>(null);
  const [status, setStatus] = useState<GatewaySyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<'sync' | 'dry' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GatewaySyncRunResult | null>(null);
  const [resultWasDryRun, setResultWasDryRun] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Default to the last 30 days; blank means "resume from the last sync".
  const [useRange, setUseRange] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateInput(d);
  });
  const [to, setTo] = useState(() => toDateInput(new Date()));

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, st] = await Promise.all([
        gatewaySyncAPI.getSettings(),
        gatewaySyncAPI.getStatus(),
      ]);
      setSettings(s);
      setStatus(st);
    } catch (err) {
      logger.error('Failed to load gateway sync settings:', err);
      setError('Could not load sync settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rangeInvalid = useMemo(
    () => useRange && !!from && !!to && from > to,
    [useRange, from, to]
  );

  const handleToggle = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      setSettings(await gatewaySyncAPI.setEnabled(!settings.enabled));
    } catch (err) {
      logger.error('Failed to update gateway sync setting:', err);
      setError('Could not save that change.');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async (dryRun: boolean) => {
    if (rangeInvalid) return;
    try {
      setRunning(dryRun ? 'dry' : 'sync');
      setError(null);
      setResult(null);

      const params: Parameters<typeof gatewaySyncAPI.run>[0] = {
        materialise: true,
        dry_run: dryRun,
      };
      if (useRange) {
        // Cover whole days in the user's own timezone.
        if (from) params.since = new Date(`${from}T00:00:00`).toISOString();
        if (to) params.until = new Date(`${to}T23:59:59`).toISOString();
      }

      const run = await gatewaySyncAPI.run(params);
      setResult(run);
      setResultWasDryRun(dryRun);
      if (!dryRun) await load();
    } catch (err) {
      logger.error('Gateway sync run failed:', err);
      setError(dryRun ? 'Preview failed.' : 'Sync failed.');
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-3" />
      </div>
    );
  }

  const accounts = settings?.connected_accounts ?? [];
  const hasAccounts = accounts.length > 0;
  const busy = running !== null || saving;

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Transaction sync
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
            Bring payments and processing fees from your connected gateways into
            Zenible — including money taken outside the system, like payment
            links or subscriptions. Payouts and transfers are skipped, so income
            is never counted twice.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || !hasAccounts}
          role="switch"
          aria-checked={!!settings?.enabled}
          aria-label="Enable automatic transaction sync"
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            settings?.enabled ? 'bg-zenible-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings?.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {!hasAccounts && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Connect Stripe or PayPal above to use this.
        </p>
      )}

      {hasAccounts && (
        <>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {settings?.enabled
              ? 'Running automatically every hour.'
              : 'Automatic syncing is off. You can still run it manually below.'}
          </p>

          <ul className="mt-3 space-y-1">
            {accounts.map((a) => (
              <li key={`${a.provider}-${a.account_ref}`} className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {a.provider}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {' '}— synced through {formatDateTime(a.synced_through)}
                </span>
                {a.last_error && (
                  <span className="block text-amber-700 dark:text-amber-300">
                    {a.last_error}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {settings && settings.auto_create_providers.length > 0
            && accounts.some((a) => !settings.auto_create_providers.includes(a.provider)) && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Only{' '}
              <span className="capitalize">
                {settings.auto_create_providers.join(', ')}
              </span>{' '}
              payments are created automatically. Others are fetched and held for
              review, because the provider reports several ledger entries per
              payment and creating one payment each would double-count.
            </p>
          )}

          {/* Two different situations, and saying "needs attention" for both
              misleads: an attributed-or-not payment already counts, whereas an
              entry with no payment behind it does not. */}
          {status && status.needs_review > 0 && (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="mt-3 text-sm font-medium text-zenible-primary hover:underline"
            >
              Review {status.needs_review} transaction
              {status.needs_review === 1 ? '' : 's'}
            </button>
          )}

          {status && status.needs_attribution > 0 && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {status.needs_attribution} synced payment
              {status.needs_attribution === 1 ? ' is' : 's are'} recorded and counted, but
              we could not tell who paid — assign{' '}
              {status.needs_attribution === 1 ? 'it' : 'them'} to a contact when you get
              a chance.
            </p>
          )}

          {status && status.unrecorded > 0 && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {status.unrecorded} transaction{status.unrecorded === 1 ? '' : 's'}{' '}
              {status.unrecorded === 1 ? 'was' : 'were'} not recorded and{' '}
              {status.unrecorded === 1 ? 'is' : 'are'} not in your figures — refunds and
              anything we could not classify need a decision.
            </p>
          )}

          {/* Manual run */}
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={useRange}
                onChange={(e) => setUseRange(e.target.checked)}
                className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
              />
              Sync a specific date range
            </label>

            {useRange && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label
                    htmlFor="gateway-sync-from"
                    className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                  >
                    From
                  </label>
                  <input
                    id="gateway-sync-from"
                    type="date"
                    value={from}
                    max={to}
                    onChange={(e) => setFrom(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gateway-sync-to"
                    className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                  >
                    To
                  </label>
                  <input
                    id="gateway-sync-to"
                    type="date"
                    value={to}
                    min={from}
                    onChange={(e) => setTo(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {!useRange && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Picks up where the last sync finished.
              </p>
            )}

            {rangeInvalid && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                The start date must come before the end date.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleRun(true)}
                disabled={busy || rangeInvalid}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <EyeIcon className="w-4 h-4" />
                {running === 'dry' ? 'Checking…' : 'Preview'}
              </button>

              <button
                type="button"
                onClick={() => handleRun(false)}
                disabled={busy || rangeInvalid}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zenible-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${running === 'sync' ? 'animate-spin' : ''}`}
                />
                {running === 'sync' ? 'Syncing…' : 'Sync now'}
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Preview reports what would be created without creating anything.
            </p>
          </div>
        </>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && <RunSummary result={result} wasDryRun={resultWasDryRun} />}

      <GatewaySyncReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onChanged={load}
      />
    </div>
  );
};

export default GatewaySyncCard;
