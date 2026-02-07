import React, { useState } from 'react';
import adminAPI from '../../services/adminAPI';

interface OpenAIModelSyncProps {
  darkMode: boolean;
}

interface SyncOptions {
  force: boolean;
  update_pricing: boolean;
  deactivate_missing: boolean;
}

interface SyncResult {
  models_added: number;
  models_updated: number;
  models_deactivated: number;
  models_total: number;
  sync_timestamp: string;
  sync_duration_ms: number;
  errors?: string[];
}

export default function OpenAIModelSync({ darkMode }: OpenAIModelSyncProps) {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [options, setOptions] = useState<SyncOptions>({
    force: false,
    update_pricing: true,
    deactivate_missing: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await adminAPI.syncOpenAIModels(options) as SyncResult;
      setLastSync(result);

      // Check if it was cached
      if (result.errors && result.errors.includes('Sync skipped - recently synced')) {
        setError('Models were recently synced. Use "Force Sync" to override.');
      } else {
        setSuccess(
          `Sync complete: ${result.models_added} new, ${result.models_updated} updated, ${result.models_deactivated} deactivated`
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`rounded-lg p-6 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            OpenAI Model Synchronization
          </h3>
          <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
            Sync available models from OpenAI API to keep your system up to date
          </p>
        </div>
        {lastSync && (
          <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Last sync: {formatTimestamp(lastSync.sync_timestamp)}
          </div>
        )}
      </div>

      {/* Sync Options */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="force-sync"
            checked={options.force}
            onChange={(e) => setOptions({ ...options, force: e.target.checked })}
            className="mt-1"
          />
          <div>
            <label htmlFor="force-sync" className={`block font-medium text-sm ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}>
              Force Sync
            </label>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
              Ignore 24-hour cache and sync immediately
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="update-pricing"
            checked={options.update_pricing}
            onChange={(e) => setOptions({ ...options, update_pricing: e.target.checked })}
            className="mt-1"
          />
          <div>
            <label htmlFor="update-pricing" className={`block font-medium text-sm ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}>
              Update Pricing
            </label>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
              Update pricing information for existing models
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="deactivate-missing"
            checked={options.deactivate_missing}
            onChange={(e) => setOptions({ ...options, deactivate_missing: e.target.checked })}
            className="mt-1"
          />
          <div>
            <label htmlFor="deactivate-missing" className={`block font-medium text-sm ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}>
              Deactivate Missing Models
            </label>
            <p className={`text-xs mt-0.5 ${
              options.deactivate_missing
                ? 'text-orange-500'
                : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
            }`}>
              {options.deactivate_missing
                ? '⚠️ Warning: This will mark models not in the API response as deprecated'
                : 'Mark models not found in API response as deprecated'}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          syncing
            ? darkMode
              ? 'bg-zenible-dark-tab-bg text-zenible-dark-text-secondary cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-zenible-primary text-white hover:bg-zenible-primary-dark'
        }`}
      >
        {syncing && (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{syncing ? 'Syncing Models...' : 'Sync OpenAI Models'}</span>
      </button>

      {/* Progress Bar */}
      {syncing && (
        <div className="mt-4">
          <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-200'}`}>
            <div className="h-full bg-zenible-primary rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`mt-4 p-4 rounded-lg ${
          error.includes('recently synced')
            ? darkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
            : darkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              error.includes('recently synced')
                ? darkMode ? 'text-blue-400' : 'text-blue-600'
                : darkMode ? 'text-red-400' : 'text-red-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={error.includes('recently synced')
                  ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              />
            </svg>
            <p className={`text-sm ${
              error.includes('recently synced')
                ? darkMode ? 'text-blue-300' : 'text-blue-800'
                : darkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className={`mt-4 p-4 rounded-lg ${
          darkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-start gap-2">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-green-400' : 'text-green-600'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {lastSync && !syncing && (
        <div className="mt-6">
          <h4 className={`text-sm font-medium mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Sync Results
          </h4>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {lastSync.models_added || 0}
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                New Models
              </div>
            </div>

            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {lastSync.models_updated || 0}
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                Updated
              </div>
            </div>

            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {lastSync.models_deactivated || 0}
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                Deactivated
              </div>
            </div>

            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {lastSync.models_total || 0}
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                Total Models
              </div>
            </div>
          </div>

          <div className={`mt-4 text-xs text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Completed in {formatDuration(lastSync.sync_duration_ms)}
          </div>

          {lastSync.errors && lastSync.errors.length > 0 && !error && (
            <div className={`mt-4 p-4 rounded-lg ${
              darkMode ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-start gap-2">
                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                    Sync Warnings
                  </p>
                  <ul className={`mt-1 text-xs space-y-1 ${darkMode ? 'text-orange-200' : 'text-orange-700'}`}>
                    {lastSync.errors.map((err: string, idx: number) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
