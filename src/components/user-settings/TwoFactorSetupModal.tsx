import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { twoFactorAPI } from '../../utils/auth';
import { usePreferences } from '../../contexts/PreferencesContext';

interface TwoFactorSetupModalProps {
  onClose: () => void;
  onEnabled: () => void;
}

type Step = 'qr' | 'verify' | 'backup';

export default function TwoFactorSetupModal({ onClose, onEnabled }: TwoFactorSetupModalProps) {
  const { darkMode } = usePreferences();
  const [step, setStep] = useState<Step>('qr');
  const [secret, setSecret] = useState('');
  const [provisioningUri, setProvisioningUri] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedCodes, setSavedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupDone, setSetupDone] = useState(false);

  // Start setup on mount
  React.useEffect(() => {
    if (!setupDone) {
      handleSetup();
    }
  }, []);

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await twoFactorAPI.setup();
      setSecret(data.secret);
      setProvisioningUri(data.provisioning_uri);
      setSetupDone(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await twoFactorAPI.enable(code);
      setBackupCodes(data.backup_codes);
      setStep('backup');
    } catch (err) {
      setError((err as Error).message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const handleDownload = () => {
    const text = `Zenible 2FA Backup Codes\n${'='.repeat(30)}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zenible-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDone = () => {
    onEnabled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-md rounded-xl shadow-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'} p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {step === 'qr' && 'Set Up Two-Factor Authentication'}
            {step === 'verify' && 'Verify Your Authenticator'}
            {step === 'backup' && 'Save Your Backup Codes'}
          </h2>
          {step !== 'backup' && (
            <button onClick={onClose} className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text' : 'text-gray-400 hover:text-gray-600'}`}>
              &times;
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: QR Code */}
        {step === 'qr' && (
          <div className="flex flex-col items-center gap-4">
            <p className={`text-sm text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy)
            </p>
            {isLoading ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#8e51ff] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : provisioningUri ? (
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={provisioningUri} size={192} />
              </div>
            ) : null}
            {secret && (
              <div className="w-full">
                <p className={`text-xs mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Or enter this code manually:
                </p>
                <div className={`px-3 py-2 rounded-lg border font-mono text-sm break-all ${
                  darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                  {secret}
                </div>
              </div>
            )}
            <button
              onClick={() => setStep('verify')}
              disabled={!provisioningUri}
              className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && (
          <div className="flex flex-col gap-4">
            <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Enter the 6-digit code from your authenticator app to confirm setup.
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className={`w-full px-4 py-3 rounded-lg border text-center text-lg tracking-[0.3em] font-mono ${
                darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep('qr')}
                className={`flex-1 px-4 py-2 border rounded-lg font-medium ${
                  darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
                className="flex-1 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && (
          <div className="flex flex-col gap-4">
            <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Save these backup codes in a secure place. Each code can only be used once to sign in if you lose access to your authenticator app.
            </p>
            <div className={`grid grid-cols-2 gap-2 p-4 rounded-lg border ${
              darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'
            }`}>
              {backupCodes.map((bc, i) => (
                <div key={i} className={`font-mono text-sm px-2 py-1 rounded ${
                  darkMode ? 'bg-zenible-dark-card text-zenible-dark-text' : 'bg-white text-gray-900'
                }`}>
                  {bc}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyAll}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium ${
                  darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Copy All
              </button>
              <button
                onClick={handleDownload}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium ${
                  darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Download .txt
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={savedCodes}
                onChange={(e) => setSavedCodes(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#8e51ff] focus:ring-[#8e51ff]"
              />
              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                I have saved my backup codes
              </span>
            </label>
            <button
              onClick={handleDone}
              disabled={!savedCodes}
              className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
