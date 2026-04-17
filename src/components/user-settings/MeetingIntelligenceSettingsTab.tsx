import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../services/api/crm/meetingIntelligence';
import Combobox from '../ui/combobox/Combobox';
import type { ZMISettings } from '../../types/meetingIntelligence';

const TEAMS_CAPTION_LANGUAGES = [
  { label: 'Default (English US)', value: '' },
  { label: 'Albanian (Albania)', value: 'Albanian (Albania)' },
  { label: 'Arabic (Saudi Arabia)', value: 'Arabic (Saudi Arabia)' },
  { label: 'Arabic (UAE)', value: 'Arabic (United Arab Emirates)' },
  { label: 'Bulgarian (Bulgaria)', value: 'Bulgarian (Bulgaria)' },
  { label: 'Catalan', value: 'Catalan (Catalan)' },
  { label: 'Chinese (Simplified)', value: 'Chinese (Simplified, China)' },
  { label: 'Chinese (Traditional, HK)', value: 'Chinese (Traditional, Hong Kong SAR)' },
  { label: 'Chinese (Traditional, Taiwan)', value: 'Chinese (Traditional, Taiwan)' },
  { label: 'Croatian (Croatia)', value: 'Croatian (Croatia)' },
  { label: 'Czech (Czechia)', value: 'Czech (Czechia)' },
  { label: 'Danish (Denmark)', value: 'Danish (Denmark)' },
  { label: 'Dutch (Belgium)', value: 'Dutch (Belgium)' },
  { label: 'Dutch (Netherlands)', value: 'Dutch (Netherlands)' },
  { label: 'English (Australia)', value: 'English (Australia)' },
  { label: 'English (Canada)', value: 'English (Canada)' },
  { label: 'English (India)', value: 'English (India)' },
  { label: 'English (New Zealand)', value: 'English (New Zealand)' },
  { label: 'English (UK)', value: 'English (UK)' },
  { label: 'English (US)', value: 'English (US)' },
  { label: 'Estonian (Estonia)', value: 'Estonian (Estonia)' },
  { label: 'Filipino (Philippines)', value: 'Filipino (Philippines)' },
  { label: 'Finnish (Finland)', value: 'Finnish (Finland)' },
  { label: 'French (Canada)', value: 'French (Canada)' },
  { label: 'French (France)', value: 'French (France)' },
  { label: 'German (Germany)', value: 'German (Germany)' },
  { label: 'German (Switzerland)', value: 'German (Switzerland)' },
  { label: 'Greek (Greece)', value: 'Greek (Greece)' },
  { label: 'Hebrew (Israel)', value: 'Hebrew (Israel)' },
  { label: 'Hindi (India)', value: 'Hindi (India)' },
  { label: 'Hungarian (Hungary)', value: 'Hungarian (Hungary)' },
  { label: 'Icelandic (Iceland)', value: 'Icelandic (Iceland)' },
  { label: 'Indonesian (Indonesia)', value: 'Indonesian (Indonesia)' },
  { label: 'Italian (Italy)', value: 'Italian (Italy)' },
  { label: 'Japanese (Japan)', value: 'Japanese (Japan)' },
  { label: 'Kazakh (Kazakhstan)', value: 'Kazakh (Kazakhstan)' },
  { label: 'Korean (Korea)', value: 'Korean (Korea)' },
  { label: 'Latvian (Latvia)', value: 'Latvian (Latvia)' },
  { label: 'Lithuanian (Lithuania)', value: 'Lithuanian (Lithuania)' },
  { label: 'Malay (Malaysia)', value: 'Malay (Malaysia)' },
  { label: 'Maltese (Malta)', value: 'Maltese (Malta)' },
  { label: 'Norwegian (Norway)', value: 'Norwegian (Norway)' },
  { label: 'Polish (Poland)', value: 'Polish (Poland)' },
  { label: 'Portuguese (Brazil)', value: 'Portuguese (Brazil)' },
  { label: 'Portuguese (Portugal)', value: 'Portuguese (Portugal)' },
  { label: 'Romanian (Romania)', value: 'Romanian (Romania)' },
  { label: 'Russian (Russia)', value: 'Russian (Russia)' },
  { label: 'Serbian (Cyrillic)', value: 'Serbian (Cyrillic, Serbia)' },
  { label: 'Slovak (Slovakia)', value: 'Slovak (Slovakia)' },
  { label: 'Slovenian (Slovenia)', value: 'Slovenian (Slovenia)' },
  { label: 'Spanish (Mexico)', value: 'Spanish (Mexico)' },
  { label: 'Spanish (Spain)', value: 'Spanish (Spain)' },
  { label: 'Swedish (Sweden)', value: 'Swedish (Sweden)' },
  { label: 'Thai (Thailand)', value: 'Thai (Thailand)' },
  { label: 'Turkish (Turkey)', value: 'Turkish (Turkey)' },
  { label: 'Ukrainian (Ukraine)', value: 'Ukrainian (Ukraine)' },
  { label: 'Vietnamese (Vietnam)', value: 'Vietnamese (Vietnam)' },
  { label: 'Welsh (United Kingdom)', value: 'Welsh (United Kingdom)' },
];

const MeetingIntelligenceSettingsTab: React.FC = () => {
  const { darkMode } = usePreferences();
  const [settings, setSettings] = useState<ZMISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [displayNameDirty, setDisplayNameDirty] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await meetingIntelligenceAPI.getSettings() as ZMISettings;
      setSettings(data);
      setDisplayName(data.meeting_display_name || '');
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
          caption_language: null,
          recording_enabled: false,
          meeting_display_name: null,
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
      const data = await meetingIntelligenceAPI.updateSettings({ enabled: !settings.enabled }) as ZMISettings;
      setSettings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordingToggle = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const data = await meetingIntelligenceAPI.updateSettings({
        recording_enabled: !settings.recording_enabled,
      }) as ZMISettings;
      setSettings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCaptionLanguageChange = async (value: string) => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const data = await meetingIntelligenceAPI.updateSettings({
        caption_language: value,
      }) as ZMISettings;
      setSettings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayNameSave = async () => {
    if (!settings || !displayNameDirty) return;
    try {
      setSaving(true);
      setError(null);
      const data = await meetingIntelligenceAPI.updateSettings({
        meeting_display_name: displayName,
      }) as ZMISettings;
      setSettings(data);
      setDisplayName(data.meeting_display_name || '');
      setDisplayNameDirty(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update display name');
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

      {/* Meeting Display Name */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Your Name in Meetings
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            How you appear in meeting transcripts and speaker attribution.
          </p>
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setDisplayNameDirty(true);
              }}
              onBlur={handleDisplayNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDisplayNameSave();
              }}
              placeholder="Your display name"
              disabled={saving}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${saving ? 'opacity-50' : ''}`}
            />
            {displayNameDirty && (
              <button
                onClick={handleDisplayNameSave}
                disabled={saving}
                className="px-3 py-2 text-sm rounded-lg bg-zenible-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
            )}
          </div>
        </div>
      )}

      {/* Teams Caption Language */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Teams Spoken Language
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Set the spoken language for Microsoft Teams captions. Only applies to Teams meetings.
          </p>
          <div className="max-w-sm">
            <Combobox
              options={TEAMS_CAPTION_LANGUAGES.map((lang) => ({
                id: lang.value,
                label: lang.label,
              }))}
              value={settings.caption_language || ''}
              onChange={(value: string) => handleCaptionLanguageChange(value)}
              placeholder="Select language..."
              searchable
              allowClear={false}
              disabled={saving}
            />
          </div>
        </div>
      )}

      {/* Auto-record toggle */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Auto-Record Meetings
              </h3>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Automatically start video recording when the bot joins a meeting
              </p>
            </div>
            <button
              onClick={handleRecordingToggle}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:ring-offset-2 ${
                settings?.recording_enabled
                  ? 'bg-zenible-primary'
                  : darkMode
                    ? 'bg-zenible-dark-border'
                    : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings?.recording_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Usage */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Zenible Meeting Intelligence Minutes Usage
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
