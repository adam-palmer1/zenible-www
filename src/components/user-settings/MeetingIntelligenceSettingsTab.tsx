import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../services/api/crm/meetingIntelligence';
import Combobox from '../ui/combobox/Combobox';
import type { ZMISettings } from '../../types/meetingIntelligence';

const CAPTION_LANGUAGES = [
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

type DraftSettings = {
  enabled?: boolean;
  caption_language?: string;
  recording_enabled?: boolean;
  meeting_display_name?: string;
  auto_send_summary?: string;
  bot_display_name?: string;
  bot_camera_enabled?: boolean;
  recording_notice_enabled?: boolean;
  recording_notice_message?: string;
};

const MAX_BACKGROUND_BYTES = 5 * 1024 * 1024;
const ALLOWED_BACKGROUND_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MeetingIntelligenceSettingsTab: React.FC = () => {
  const { darkMode } = usePreferences();
  const [settings, setSettings] = useState<ZMISettings | null>(null);
  const [draft, setDraft] = useState<DraftSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAllParticipants, setConfirmAllParticipants] = useState(false);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await meetingIntelligenceAPI.getSettings() as ZMISettings;
      setSettings(data);
      setDraft({});
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
          auto_send_summary: 'me',
          bot_display_name: null,
          bot_camera_enabled: true,
          bot_background_url: null,
          recording_notice_enabled: true,
          recording_notice_message: null,
        });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Current (possibly unsaved) values shown in the UI.
  const current = {
    enabled: draft.enabled ?? settings?.enabled ?? false,
    caption_language: draft.caption_language ?? settings?.caption_language ?? '',
    recording_enabled: draft.recording_enabled ?? settings?.recording_enabled ?? false,
    meeting_display_name: draft.meeting_display_name ?? settings?.meeting_display_name ?? '',
    auto_send_summary: draft.auto_send_summary ?? settings?.auto_send_summary ?? 'no',
    bot_display_name: draft.bot_display_name ?? settings?.bot_display_name ?? '',
    bot_camera_enabled:
      draft.bot_camera_enabled ?? settings?.bot_camera_enabled ?? true,
    recording_notice_enabled:
      draft.recording_notice_enabled ?? settings?.recording_notice_enabled ?? true,
    recording_notice_message:
      draft.recording_notice_message ?? settings?.recording_notice_message ?? '',
  };

  const isDirty = Object.keys(draft).length > 0;

  const updateDraft = (patch: DraftSettings) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleBackgroundSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so re-picking the same file still fires onChange.
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_BACKGROUND_TYPES.includes(file.type)) {
      setError('Background must be a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_BACKGROUND_BYTES) {
      setError('Background must be 5MB or smaller.');
      return;
    }

    try {
      setBackgroundBusy(true);
      setError(null);
      const { bot_background_url } = await meetingIntelligenceAPI.uploadBotBackground(file);
      setSettings((prev) => (prev ? { ...prev, bot_background_url } : prev));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload background');
    } finally {
      setBackgroundBusy(false);
    }
  };

  const handleRemoveBackground = async () => {
    try {
      setBackgroundBusy(true);
      setError(null);
      await meetingIntelligenceAPI.deleteBotBackground();
      setSettings((prev) => (prev ? { ...prev, bot_background_url: null } : prev));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove background');
    } finally {
      setBackgroundBusy(false);
    }
  };

  const handleSave = async () => {
    if (!isDirty || !settings) return;
    try {
      setSaving(true);
      setError(null);
      const data = await meetingIntelligenceAPI.updateSettings(draft) as ZMISettings;
      setSettings(data);
      setDraft({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
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
            onClick={() => updateDraft({ enabled: !current.enabled })}
            disabled={saving || !settings?.feature_available}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:ring-offset-2 ${
              current.enabled
                ? 'bg-zenible-primary'
                : darkMode
                  ? 'bg-zenible-dark-border'
                  : 'bg-gray-200'
            } ${(!settings?.feature_available || saving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                current.enabled ? 'translate-x-6' : 'translate-x-1'
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
          <div className="max-w-sm">
            <input
              type="text"
              value={current.meeting_display_name}
              onChange={(e) => updateDraft({ meeting_display_name: e.target.value })}
              placeholder="Your display name"
              disabled={saving}
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${saving ? 'opacity-50' : ''}`}
            />
          </div>
        </div>
      )}

      {/* Bot Name */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Bot Name
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            The name the assistant uses in the meeting participant list. Leave blank to use the default.
          </p>
          <div className="max-w-sm">
            <input
              type="text"
              maxLength={64}
              value={current.bot_display_name}
              onChange={(e) => updateDraft({ bot_display_name: e.target.value })}
              placeholder="Zenible AI"
              disabled={saving}
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${saving ? 'opacity-50' : ''}`}
            />
          </div>
        </div>
      )}

      {/* Bot Camera */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Bot Camera
              </h3>
              <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {current.bot_camera_enabled
                  ? "The image shown on the assistant's camera during meetings. Landscape images work best (displayed at 1280\u00d7720). JPEG, PNG, or WebP, up to 5MB."
                  : 'The assistant joins with its camera off and shows no video at all, like any participant with their camera muted.'}
              </p>
            </div>
            <button
              onClick={() => updateDraft({ bot_camera_enabled: !current.bot_camera_enabled })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:ring-offset-2 ${
                current.bot_camera_enabled
                  ? 'bg-zenible-primary'
                  : darkMode
                    ? 'bg-zenible-dark-border'
                    : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  current.bot_camera_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {current.bot_camera_enabled && (
          <>
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className={`w-48 aspect-video rounded-lg border overflow-hidden flex items-center justify-center ${
                darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-300'
              }`}
            >
              {settings?.bot_background_url ? (
                <img
                  src={settings.bot_background_url}
                  alt="Bot camera background preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`text-xs px-2 text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Default Zenible background
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBackgroundSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={backgroundBusy}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-white hover:bg-zenible-dark-border'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                } ${backgroundBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {backgroundBusy ? 'Working…' : settings?.bot_background_url ? 'Replace image' : 'Upload image'}
              </button>
              {settings?.bot_background_url && (
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  disabled={backgroundBusy}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                  } ${backgroundBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className={`mt-3 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Uploads save immediately &mdash; the Save button is not needed for this setting.
          </p>
          </>
          )}
        </div>
      )}

      {/* Join Notice */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Join Notice
              </h3>
              <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                A chat message the assistant posts once when it joins. This is how participants are told the meeting is being recorded and transcribed &mdash; switching it off may not be lawful everywhere, so check your local requirements.
              </p>
            </div>
            <button
              onClick={() => updateDraft({ recording_notice_enabled: !current.recording_notice_enabled })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:ring-offset-2 ${
                current.recording_notice_enabled
                  ? 'bg-zenible-primary'
                  : darkMode
                    ? 'bg-zenible-dark-border'
                    : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  current.recording_notice_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {current.recording_notice_enabled && (
            <div className="mt-3">
              <textarea
                rows={3}
                maxLength={500}
                value={current.recording_notice_message}
                onChange={(e) => updateDraft({ recording_notice_message: e.target.value })}
                placeholder="This meeting is being transcribed with Zenible Meeting Intelligence"
                disabled={saving}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${saving ? 'opacity-50' : ''}`}
              />
              <p className={`mt-1 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {current.recording_notice_message.length}/500 &middot; Leave blank to use the default message.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Caption Language */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Caption Language
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Set the spoken language for meeting captions. Applies to Teams and Zoom meetings.
          </p>
          <div className="max-w-sm">
            <Combobox
              options={CAPTION_LANGUAGES.map((lang) => ({
                id: lang.value,
                label: lang.label,
              }))}
              value={current.caption_language}
              onChange={(value: string) => updateDraft({ caption_language: value })}
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
              onClick={() => updateDraft({ recording_enabled: !current.recording_enabled })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:ring-offset-2 ${
                current.recording_enabled
                  ? 'bg-zenible-primary'
                  : darkMode
                    ? 'bg-zenible-dark-border'
                    : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  current.recording_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Auto-send summary */}
      {settings?.feature_available && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Automatically send meeting summary
              </h3>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Email the meeting summary when analysis completes
              </p>
            </div>
            <select
              value={current.auto_send_summary}
              disabled={saving}
              onChange={(e) => {
                const next = e.target.value;
                if (next === 'all' && current.auto_send_summary !== 'all') {
                  setConfirmAllParticipants(true);
                } else {
                  updateDraft({ auto_send_summary: next });
                }
              }}
              className={`text-sm rounded-lg border px-3 py-1.5 ${
                saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="no">No</option>
              <option value="me">Me Only</option>
              <option value="all">All Participants</option>
            </select>
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

      {/* Save bar */}
      <div className={`flex items-center justify-end gap-3 pt-2 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
        {isDirty && (
          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Unsaved changes
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`px-4 py-2 text-sm rounded-lg bg-zenible-primary text-white hover:opacity-90 ${
            (!isDirty || saving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Confirm "All Participants" */}
      {confirmAllParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`max-w-md w-full rounded-lg p-6 shadow-xl ${darkMode ? 'bg-zenible-dark-card border border-zenible-dark-border' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Send summaries to all participants?
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              This will automatically send your meeting summaries to all participants. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAllParticipants(false)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'border-zenible-dark-border text-white hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateDraft({ auto_send_summary: 'all' });
                  setConfirmAllParticipants(false);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-zenible-primary text-white hover:opacity-90"
              >
                Yes, send to all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingIntelligenceSettingsTab;
