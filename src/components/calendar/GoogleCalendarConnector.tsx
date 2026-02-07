import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

interface GoogleCalendarConnectorProps {
  isConnected: boolean;
  accounts: any[];
  primaryAccount: any;
  onAddAccount: (setAsPrimary: boolean) => void;
  onSetPrimary: (accountId: any) => Promise<any>;
  onDisconnect: (accountId: any) => Promise<any>;
  onRename: (accountId: any, name: string) => Promise<any>;
  onColorChange: (accountId: any, color: string) => Promise<any>;
  onToggleReadOnly: (accountId: any, isReadOnly: boolean) => Promise<any>;
  onSync: (accountId: any) => Promise<any>;
}

export default function GoogleCalendarConnector({ isConnected, accounts, primaryAccount, onAddAccount, onSetPrimary, onDisconnect, onRename, onColorChange, onToggleReadOnly, onSync }: GoogleCalendarConnectorProps) {
  const [syncingAccountId, setSyncingAccountId] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<any>(null);

  const DEFAULT_ACCOUNT_COLOR = '#3b82f6';

  const handleSync = async (accountId: any) => {
    setSyncingAccountId(accountId);
    setSyncResult(null);
    try {
      const result = await onSync(accountId);
      if (result.success) {
        setSyncResult({
          accountId,
          success: true,
          message: `Synced! Created: ${result.created}, Updated: ${result.updated}, Deleted: ${result.deleted}`
        });
        setTimeout(() => setSyncResult(null), 5000);
      } else {
        setSyncResult({ accountId, success: false, message: result.error });
      }
    } catch (_error) {
      setSyncResult({ accountId, success: false, message: 'Sync failed' });
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSetPrimary = async (account: any) => {
    setConfirmDialog(null);
    await onSetPrimary(account.id);
  };

  const handleDisconnect = async (account: any) => {
    setConfirmDialog(null);
    await onDisconnect(account.id);
  };

  const handleStartRename = (account: any) => {
    setEditingAccountId(account.id);
    setEditName(account.name || '');
  };

  const handleSaveRename = async (accountId: any) => {
    if (editName.trim()) {
      await onRename(accountId, editName.trim());
    }
    setEditingAccountId(null);
    setEditName('');
  };

  const handleCancelRename = () => {
    setEditingAccountId(null);
    setEditName('');
  };

  const handleAddAccount = (setAsPrimary: boolean) => {
    setShowAddModal(false);
    onAddAccount(setAsPrimary);
  };

  const formatLastSync = (lastSyncAt: string) => {
    if (!lastSyncAt) return null;
    try {
      return format(parseISO(lastSyncAt), 'MMM d, h:mm a');
    } catch {
      return null;
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Google Calendar Accounts</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your Google Calendar accounts. Primary account syncs bidirectionally, secondary accounts import events only.
      </p>

      {isConnected && accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((account: any) => (
            <div
              key={account.id}
              className="border border-gray-200 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={account.color || DEFAULT_ACCOUNT_COLOR}
                  onChange={(e) => onColorChange(account.id, e.target.value)}
                  className={`w-6 h-6 rounded border border-gray-300 cursor-pointer flex-shrink-0 ${account.is_read_only ? 'opacity-50' : ''}`}
                  title="Choose calendar color"
                />

                <div className="min-w-0 flex-1">
                  {editingAccountId === account.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
                        placeholder="Account name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(account.id);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(account.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.name || account.email}
                    </p>
                  )}
                </div>

                {syncingAccountId === account.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 flex-shrink-0"></div>
                )}

                {editingAccountId !== account.id && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openMenuId === account.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleSync(account.id);
                            }}
                            disabled={syncingAccountId === account.id}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </button>
                          {!account.is_primary && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmDialog({ type: 'setPrimary', account });
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleStartRename(account);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Rename
                          </button>
                          {!account.is_primary && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onToggleReadOnly(account.id, !account.is_read_only);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              {account.is_read_only ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                              {account.is_read_only ? 'Enable Editing' : 'Read Only'}
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmDialog({ type: 'disconnect', account });
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Disconnect
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingAccountId !== account.id && (
                <div className="flex items-center gap-1.5 mt-1 ml-9">
                  <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 ${account.is_primary ? 'text-purple-600' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <title>{account.is_primary ? 'Primary account' : 'Import only'}</title>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {account.last_sync_at && (
                    <span className="text-xs text-gray-400">
                      Last Sync: {formatLastSync(account.last_sync_at)}
                    </span>
                  )}
                </div>
              )}

              {syncResult && syncResult.accountId === account.id && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {syncResult.message}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg py-3 px-4 flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Another Account
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          Connect Google Calendar
        </button>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Google Calendar</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose how to connect this account:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleAddAccount(true)}
                className="w-full text-left p-3 border-2 border-purple-200 hover:border-purple-400 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </span>
                  <span className="font-medium text-gray-900">Add as Primary</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Bidirectional sync - Zenible appointments sync to this calendar
                </p>
              </button>

              <button
                onClick={() => handleAddAccount(false)}
                className="w-full text-left p-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </span>
                  <span className="font-medium text-gray-900">Add as Secondary</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Import only - View calendar events in Zenible (read-only)
                </p>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            {confirmDialog.type === 'setPrimary' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Primary Account?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {primaryAccount && (
                    <>Current primary: <span className="font-medium">{primaryAccount.email}</span><br /></>
                  )}
                  New primary: <span className="font-medium">{confirmDialog.account.email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Your Zenible appointments will now sync to {confirmDialog.account.email} instead.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSetPrimary(confirmDialog.account)}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Change Primary
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Disconnect {confirmDialog.account.is_primary ? 'Primary ' : ''}Account?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  You're about to disconnect <span className="font-medium">{confirmDialog.account.email}</span>.
                </p>
                {confirmDialog.account.is_primary && accounts.length > 1 && (
                  <p className="text-sm text-gray-500 mb-4">
                    {accounts.find((a: any) => a.id !== confirmDialog.account.id)?.email} will become your new primary account.
                  </p>
                )}
                {accounts.length === 1 && (
                  <p className="text-sm text-gray-500 mb-4">
                    This is your only connected account. You will be disconnected from Google Calendar.
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDisconnect(confirmDialog.account)}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
