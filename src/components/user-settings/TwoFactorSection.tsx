import React, { useState, useEffect } from 'react';
import { twoFactorAPI } from '../../utils/auth';
import { usePreferences } from '../../contexts/PreferencesContext';
import TwoFactorSetupModal from './TwoFactorSetupModal';

interface TwoFactorSectionProps {
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

interface TrustedDevice {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  last_used_at: string | null;
  created_at: string | null;
  expires_at: string | null;
}

interface TwoFAStatus {
  totp_enabled: boolean;
  enabled_at: string | null;
  backup_codes_remaining: number;
}

export default function TwoFactorSection({ setError, setSuccessMessage }: TwoFactorSectionProps) {
  const { darkMode } = usePreferences();
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Disable 2FA state
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  // Regenerate backup codes state
  const [showRegenForm, setShowRegenForm] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await twoFactorAPI.getStatus();
      setStatus(data);
      if (data.totp_enabled) {
        const deviceData = await twoFactorAPI.getTrustedDevices();
        setDevices(deviceData);
      }
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword || !disableCode) return;
    setIsDisabling(true);
    setError(null);
    try {
      await twoFactorAPI.disable(disablePassword, disableCode);
      setSuccessMessage('Two-factor authentication disabled');
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
      await loadStatus();
    } catch (err) {
      setError((err as Error).message || 'Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegenerate = async () => {
    if (!regenPassword) return;
    setIsRegenerating(true);
    setError(null);
    try {
      const data = await twoFactorAPI.regenerateBackupCodes(regenPassword);
      setNewBackupCodes(data.backup_codes);
      setSuccessMessage('Backup codes regenerated');
      setRegenPassword('');
      await loadStatus();
    } catch (err) {
      setError((err as Error).message || 'Failed to regenerate codes');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      await twoFactorAPI.revokeTrustedDevice(deviceId);
      setDevices(devices.filter(d => d.id !== deviceId));
      setSuccessMessage('Device revoked');
    } catch (err) {
      setError((err as Error).message || 'Failed to revoke device');
    }
  };

  const handleRevokeAll = async () => {
    try {
      await twoFactorAPI.revokeAllTrustedDevices();
      setDevices([]);
      setSuccessMessage('All devices revoked');
    } catch (err) {
      setError((err as Error).message || 'Failed to revoke devices');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`py-4 text-center text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
        Loading 2FA status...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
          Two-Factor Authentication
        </h3>
        {status?.totp_enabled ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Enabled
          </span>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            Not enabled
          </span>
        )}
      </div>

      {!status?.totp_enabled ? (
        <>
          <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            Add an extra layer of security by requiring a code from your authenticator app when signing in.
          </p>
          <button
            onClick={() => setShowSetupModal(true)}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium text-sm transition-colors"
          >
            Enable Two-Factor Authentication
          </button>
        </>
      ) : (
        <div className="space-y-4 mt-3">
          {/* Status info */}
          <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            <p>Enabled {status.enabled_at ? formatDate(status.enabled_at) : ''}</p>
            <p>{status.backup_codes_remaining} backup code{status.backup_codes_remaining !== 1 ? 's' : ''} remaining</p>
          </div>

          {/* Regenerate backup codes */}
          {!showRegenForm && !newBackupCodes && (
            <button
              onClick={() => setShowRegenForm(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${
                darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Regenerate Backup Codes
            </button>
          )}
          {showRegenForm && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
                />
              </div>
              <button onClick={handleRegenerate} disabled={isRegenerating || !regenPassword}
                className="px-3 py-2 bg-zenible-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {isRegenerating ? '...' : 'Regenerate'}
              </button>
              <button onClick={() => { setShowRegenForm(false); setRegenPassword(''); }}
                className={`px-3 py-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Cancel
              </button>
            </div>
          )}
          {newBackupCodes && (
            <div className={`p-3 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                New backup codes (save these now):
              </p>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {newBackupCodes.map((c, i) => (
                  <span key={i} className={`font-mono text-xs px-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{c}</span>
                ))}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(newBackupCodes.join('\n')); }}
                className="text-xs text-zenible-primary hover:underline mr-3">Copy All</button>
              <button onClick={() => setNewBackupCodes(null)}
                className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:underline`}>Dismiss</button>
            </div>
          )}

          {/* Trusted Devices */}
          {devices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Trusted Devices
                </h4>
                <button onClick={handleRevokeAll}
                  className="text-xs text-red-600 hover:underline">Revoke All</button>
              </div>
              <div className="space-y-2">
                {devices.map(device => (
                  <div key={device.id} className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                    darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
                  }`}>
                    <div>
                      <p className={`text-xs truncate max-w-[240px] ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {device.device_name || 'Unknown device'}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        {device.ip_address} &middot; Last used {formatDate(device.last_used_at)}
                      </p>
                    </div>
                    <button onClick={() => handleRevokeDevice(device.id)}
                      className="text-xs text-red-600 hover:underline ml-2">Revoke</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disable 2FA */}
          {!showDisableForm ? (
            <button
              onClick={() => setShowDisableForm(true)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm transition-colors"
            >
              Disable Two-Factor Authentication
            </button>
          ) : (
            <div className={`p-3 rounded-lg border ${darkMode ? 'border-red-800 bg-red-900/10' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm mb-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                Enter your password and a TOTP code to disable 2FA. All trusted devices will be revoked.
              </p>
              <div className="space-y-2 mb-3">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-red-400 focus:border-transparent`}
                />
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  maxLength={6}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-red-400 focus:border-transparent`}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleDisable} disabled={isDisabling || !disablePassword || disableCode.length !== 6}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors">
                  {isDisabling ? 'Disabling...' : 'Disable 2FA'}
                </button>
                <button onClick={() => { setShowDisableForm(false); setDisablePassword(''); setDisableCode(''); }}
                  className={`px-3 py-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup modal */}
      {showSetupModal && (
        <TwoFactorSetupModal
          onClose={() => setShowSetupModal(false)}
          onEnabled={loadStatus}
        />
      )}
    </div>
  );
}
