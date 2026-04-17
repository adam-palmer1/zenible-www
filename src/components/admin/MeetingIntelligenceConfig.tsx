import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAI_API from '../../services/api/admin/ai';

interface AdminOutletContext {
  darkMode: boolean;
}

interface CharacterOption {
  id: string;
  name: string;
  provider: string | null;
  model: string | null;
}

interface MIConfig {
  character_id: string | null;
  character_name: string | null;
  character_provider: string | null;
  character_model: string | null;
  is_configured: boolean;
  available_shortcodes: string[];
  available_characters: CharacterOption[];
}

export default function MeetingIntelligenceConfig() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [config, setConfig] = useState<MIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAI_API.getMeetingIntelligenceConfig() as MIConfig;
      setConfig(data);
      setSelectedCharacterId(data.character_id || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      setSaving(true);
      setError(null);
      const data = await adminAI_API.updateMeetingIntelligenceConfig({
        character_id: selectedCharacterId || null,
      }) as MIConfig;
      setConfig(data);
      setSelectedCharacterId(data.character_id || '');
      setSuccess(selectedCharacterId ? 'Character assigned to Meeting Intelligence' : 'Character unassigned');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedCharacterId !== (config?.character_id || '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const selectedChar = config?.available_characters.find(c => c.id === selectedCharacterId);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign an AI character to analyze meeting transcripts after each meeting ends.
          The character's system instructions are used as the analysis prompt.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
      )}

      {/* Character assignment */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Analysis Character
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select which AI character handles post-meeting analysis. Configure the character's
            system instructions and model in{' '}
            <a href="/admin/ai-characters" className="text-purple-600 hover:underline">AI Characters</a>.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="flex-1 max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">None (disabled)</option>
              {config?.available_characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.provider}{c.model ? ` / ${c.model}` : ''})
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={saving || !hasChanges}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                hasChanges
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Selected character info */}
        {selectedChar && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 text-sm">
            <div>
              <span className="text-gray-500">Provider:</span>{' '}
              <span className="font-medium text-gray-900">{selectedChar.provider}</span>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>{' '}
              <span className="font-medium text-gray-900">{selectedChar.model || 'Not set'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Shortcodes reference */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mt-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Available Placeholders</h2>
        <p className="text-xs text-gray-500 mb-3">
          Use these in the character's system instructions. They are replaced with real values when analyzing a meeting.
        </p>
        <div className="flex flex-wrap gap-2">
          {(config?.available_shortcodes || []).map((code) => (
            <code
              key={code}
              className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded font-mono cursor-pointer hover:bg-purple-100 select-all"
              onClick={() => navigator.clipboard.writeText(code)}
              title="Click to copy"
            >
              {code}
            </code>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mt-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">How it works</h2>
        <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Create an AI character in <a href="/admin/ai-characters" className="text-purple-600 hover:underline">AI Characters</a> with system instructions containing <code className="px-1 bg-gray-100 rounded">[[TRANSCRIPT]]</code></li>
          <li>Assign that character here</li>
          <li>After each meeting ends, the transcript is injected into the prompt and sent to the character's LLM</li>
          <li>The structured response (overview, key points, action items, sentiment, topics) is saved to the meeting</li>
          <li>Users see the results in the Meeting Intelligence tab</li>
        </ol>
      </div>
    </div>
  );
}
