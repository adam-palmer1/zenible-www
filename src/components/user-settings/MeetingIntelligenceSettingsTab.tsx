import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../services/api/crm/meetingIntelligence';
import type { ZMISettings } from '../../types/meetingIntelligence';

const MeetingIntelligenceSettingsTab: React.FC = () => {
  const { darkMode } = usePreferences();
  const [settings, setSettings] = useState<ZMISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await meetingIntelligenceAPI.getSettings() as ZMISettings;
      setSettings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load settings';
      // Feature might not be available on this plan
      if (msg.includes('402') || msg.includes('not included')) {
        setSettings({
          enabled: false,
          feature_available: false,
          plan_name: null,
          minutes_used: 0,
          minutes_limit: null,
          minutes_remaining: null,
        });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const data = await meetingIntelligenceAPI.updateSettings({
        enabled: !settings.enabled,
      }) as ZMISettings;
      setSettings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary" />
      </div>
    );
  }

  const usagePercent = settings?.minutes_limit
    ? Math.min(100, Math.round((settings.minutes_used / settings.minutes_limit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Meeting Intelligence
        </h2>
        <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          AI-powered meeting bot with live transcription and insights
        </p>
      </div>

      {error && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Feature availability */}
      {!settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>
            Meeting Intelligence is not available on your current plan.
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-amber-700'}`}>
            Upgrade to Starter or higher to enable meeting bots with live transcription.
          </p>
        </div>
      )}

      {/* Toggle */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Enable Meeting Intelligence
            </h3>
            <p className={`text-sm mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Automatically send a bot to record and transcribe your meetings
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving || !settings?.feature_available}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:ring-offset-2 ${
              settings?.enabled
                ? 'bg-zenible-primary'
                : darkMode
                  ? 'bg-zenible-dark-border'
                  : 'bg-gray-200'
            } ${(!settings?.feature_available || saving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Usage */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Bot Minutes Usage
          </h3>

          {settings.minutes_limit !== null ? (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}>
                  {settings.minutes_used} / {settings.minutes_limit} minutes used
                </span>
                <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}>
                  {usagePercent}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-zenible-dark-border' : 'bg-gray-200'}`}>
                <div
                  className={`h-2 rounded-full transition-all ${
                    usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-zenible-primary'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {settings.minutes_remaining !== null
                  ? `${settings.minutes_remaining} minutes remaining this billing period`
                  : 'Usage resets at the start of your next billing period'}
              </p>
            </>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Unlimited minutes on your plan. {settings.minutes_used} minutes used this period.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingIntelligenceSettingsTab;
