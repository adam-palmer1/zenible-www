import React, { useCallback, useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import gatewaySyncAPI, {
  type GatewayLedgerEntry,
} from '../../../../../services/api/finance/gatewaySync';
import ContactSelectorModal from '../../../../calendar/ContactSelectorModal';
import logger from '../../../../../utils/logger';
import { useEscapeKey } from '../../../../../hooks/useEscapeKey';
import ConfirmationModal from '../../../../common/ConfirmationModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after any change so the parent can refresh its counts. */
  onChanged?: () => void;
}

const PER_PAGE = 25;

const formatMoney = (amount: string, currency: string): string => {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });

const GatewaySyncReviewModal: React.FC<Props> = ({ isOpen, onClose, onChanged }) => {
  const [entries, setEntries] = useState<GatewayLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Which row's contact picker is open, and the button it hangs off.
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [confirmIgnore, setConfirmIgnore] = useState<GatewayLedgerEntry | null>(null);
  const [view, setView] = useState<'needs_review' | 'ignored'>('needs_review');
  const anchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEscapeKey(onClose, isOpen && !pickerFor);

  const load = useCallback(async (
    targetPage: number,
    status: 'needs_review' | 'ignored' = 'needs_review'
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await gatewaySyncAPI.listEntries({
        status,
        page: targetPage,
        per_page: PER_PAGE,
      });
      setEntries(data.items);
      setTotal(data.total);
      setPages(data.pages);
      setPage(data.page);
    } catch (err) {
      logger.error('Failed to load sync review entries:', err);
      setError('Could not load the transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load(1, view);
  }, [isOpen, load, view]);

  const removeRow = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setTotal((prev) => Math.max(0, prev - 1));
    onChanged?.();
  };

  const handleAssign = async (entry: GatewayLedgerEntry, contact: { id: string }) => {
    setPickerFor(null);
    try {
      setBusyId(entry.id);
      setError(null);
      await gatewaySyncAPI.attribute(entry.id, { contact_id: contact.id });
      removeRow(entry.id);
    } catch (err) {
      logger.error('Failed to attribute entry:', err);
      setError('Could not assign that transaction.');
    } finally {
      setBusyId(null);
    }
  };

  const requestIgnore = (entry: GatewayLedgerEntry) => {
    if (entry.crm_payment_id) {
      // Nothing is lost: the payment stays and keeps counting.
      handleIgnore(entry);
      return;
    }
    setConfirmIgnore(entry);
  };

  const handleRestore = async (entry: GatewayLedgerEntry) => {
    try {
      setBusyId(entry.id);
      setError(null);
      await gatewaySyncAPI.restore(entry.id);
      removeRow(entry.id);
    } catch (err) {
      logger.error('Failed to restore entry:', err);
      setError('Could not restore that transaction.');
    } finally {
      setBusyId(null);
    }
  };

  const handleIgnore = async (entry: GatewayLedgerEntry) => {
    try {
      setBusyId(entry.id);
      setError(null);
      await gatewaySyncAPI.ignore(entry.id);
      removeRow(entry.id);
    } catch (err) {
      logger.error('Failed to ignore entry:', err);
      setError('Could not update that transaction.');
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review synced transactions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
              Transactions the sync could not attribute on its own. Ones marked
              “Payment recorded” already count towards your figures and only need a
              contact; the rest are not in your figures until you decide what they are.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div
            role="tablist"
            className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700"
          >
            {([
              ['needs_review', 'Needs a decision'],
              ['ignored', 'Ignored'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  view === key
                    ? 'border-zenible-primary text-zenible-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">
              {view === 'ignored'
                ? 'Nothing has been ignored.'
                : 'Nothing left to review.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Paid by</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">State</th>
                    <th className="py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const busy = busyId === entry.id;
                    const recorded = !!entry.crm_payment_id;
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 dark:border-gray-700/50"
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {formatDate(entry.occurred_at)}
                          <span className="block text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {entry.provider} · {entry.entry_type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-900 dark:text-white">
                          {entry.payer_name || entry.payer_email || (
                            <span className="text-gray-400">Unknown</span>
                          )}
                          {entry.payer_name && entry.payer_email && (
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {entry.payer_email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {formatMoney(entry.gross_amount, entry.currency_code)}
                        </td>
                        <td className="py-3 pr-4">
                          {recorded ? (
                            <span className="text-gray-600 dark:text-gray-400">
                              Payment recorded
                            </span>
                          ) : (
                            <span
                              className="text-amber-700 dark:text-amber-300"
                              title={entry.processing_error || undefined}
                            >
                              Not recorded
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          {view === 'ignored' ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(entry)}
                              disabled={busy}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                              {busy ? 'Restoring…' : 'Restore'}
                            </button>
                          ) : (
                          <>
                          <button
                            type="button"
                            ref={(el) => {
                              anchorRefs.current[entry.id] = el;
                            }}
                            onClick={() => setPickerFor(entry.id)}
                            disabled={busy || !recorded}
                            title={
                              recorded
                                ? undefined
                                : 'There is no payment to assign — decide what this is first'
                            }
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-zenible-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busy ? 'Saving…' : 'Assign contact'}
                          </button>
                          <button
                            type="button"
                            onClick={() => requestIgnore(entry)}
                            disabled={busy}
                            className="ml-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            Ignore
                          </button>

                          {pickerFor === entry.id && (
                            <ContactSelectorModal
                              isOpen
                              onClose={() => setPickerFor(null)}
                              onSelect={(contact) => handleAssign(entry, contact)}
                              selectedContactId={entry.contact_id}
                              anchorRef={
                                { current: anchorRefs.current[entry.id] } as React.RefObject<HTMLElement>
                              }
                            />
                          )}
                          </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {total} to review
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => load(page - 1, view)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => load(page + 1, view)}
                  disabled={page >= pages || loading}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmIgnore}
        onClose={() => setConfirmIgnore(null)}
        onConfirm={() => {
          const entry = confirmIgnore;
          setConfirmIgnore(null);
          if (entry) handleIgnore(entry);
        }}
        title="Ignore this transaction?"
        message={
          confirmIgnore ? (
            <>
              No payment was recorded for{' '}
              <strong>
                {formatMoney(confirmIgnore.gross_amount, confirmIgnore.currency_code)}
              </strong>{' '}
              on {formatDate(confirmIgnore.occurred_at)}, so this money is not in your
              figures. Ignoring it means it never will be, and this cannot be undone from
              here.
            </>
          ) : ''
        }
        confirmText="Ignore it"
        cancelText="Keep for review"
        confirmColor="red"
      />
    </div>
  );
};

export default GatewaySyncReviewModal;
