import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import adminAPI from '../../services/adminAPI';
import platformAPI from '../../services/platformAPI';

interface IconProps {
  size?: number;
  className?: string;
}

// Icon components as inline SVGs
const XIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = ({ size = 20, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SaveIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const TrashIcon = ({ size = 18, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronUpIcon = ({ size = 14, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ size = 14, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const SettingsIcon = ({ size = 18, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface CharacterPlatformConfigProps {
  characterId: string;
  characterName: string;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export default function CharacterPlatformConfig({ characterId, characterName, isOpen, onClose, darkMode }: CharacterPlatformConfigProps) {
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  const [addingPlatform, setAddingPlatform] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [formData, setFormData] = useState({
    platform_id: '',
    additional_instructions: '',
    is_enabled: true,
    priority: 0,
    metadata: {
      merge_strategy: 'append',
      emphasis_level: 'medium',
    }
  });

  useEffect(() => {
    if (isOpen && characterId) {
      fetchData();
    }
  }, [isOpen, characterId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch character's platform configurations
      const configResponse = await adminAPI.getCharacterPlatforms(characterId) as any;
      setConfigurations(configResponse.configurations || []);

      // Fetch all available platforms
      const platformsResponse = await platformAPI.getActivePlatforms();
      setAvailablePlatforms(platformsResponse);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load platform configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatform = async () => {
    if (!selectedPlatform) {
      alert('Please select a platform');
      return;
    }

    try {
      setSaving(true);
      await adminAPI.addCharacterPlatform(characterId, {
        ...formData,
        platform_id: selectedPlatform,
        priority: configurations.length, // Add at the end
      });

      // Reset form
      setAddingPlatform(false);
      setSelectedPlatform('');
      setFormData({
        platform_id: '',
        additional_instructions: '',
        is_enabled: true,
        priority: 0,
        metadata: {
          merge_strategy: 'append',
          emphasis_level: 'medium',
        }
      });

      // Refresh configurations
      fetchData();
    } catch (err) {
      console.error('Failed to add platform:', err);
      alert('Failed to add platform configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async (platformId: string, data: any) => {
    try {
      setSaving(true);
      await adminAPI.updateCharacterPlatform(characterId, platformId, data);
      fetchData();
    } catch (err) {
      console.error('Failed to update configuration:', err);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (platformId: string) => {
    if (!confirm('Are you sure you want to remove this platform configuration?')) {
      return;
    }

    try {
      setSaving(true);
      await adminAPI.deleteCharacterPlatform(characterId, platformId);
      fetchData();
    } catch (err) {
      console.error('Failed to delete configuration:', err);
      alert('Failed to delete configuration');
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityChange = async (config: any, direction: string) => {
    const currentIndex = configurations.findIndex(c => c.id === config.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= configurations.length) return;

    const targetConfig = configurations[newIndex];

    try {
      setSaving(true);
      // Swap priorities
      await Promise.all([
        adminAPI.updateCharacterPlatform(characterId, config.platform_id, {
          ...config,
          priority: targetConfig.priority
        }),
        adminAPI.updateCharacterPlatform(characterId, targetConfig.platform_id, {
          ...targetConfig,
          priority: config.priority
        })
      ]);
      fetchData();
    } catch (err) {
      console.error('Failed to update priority:', err);
    } finally {
      setSaving(false);
    }
  };

  // Get platforms that aren't already configured
  const getAvailablePlatformsForAdd = () => {
    const configuredPlatformIds = configurations.map(c => c.platform_id);
    return availablePlatforms.filter(p => !configuredPlatformIds.includes(p.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        darkMode ? 'bg-[#1a1a1a]' : 'bg-white'
      } rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-[#333333]' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Platform Configuration</h2>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Configure platform-specific instructions for {characterName}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-10 ${
              darkMode ? 'hover:bg-white' : 'hover:bg-black'
            }`}
          >
            <XIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6">
          {loading ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading configurations...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : (
            <>
              {/* Configured Platforms */}
              <div className="space-y-4">
                {configurations.map((config, index) => (
                  <div
                    key={config.id}
                    className={`rounded-lg border ${
                      darkMode ? 'bg-[#2a2a2a] border-[#444444]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`p-4 ${expandedConfig === config.id ? 'border-b' : ''} ${
                      darkMode ? 'border-[#444444]' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Priority controls */}
                          <div className="flex flex-col">
                            <button
                              onClick={() => handlePriorityChange(config, 'up')}
                              disabled={index === 0 || saving}
                              className={`p-0.5 rounded ${
                                index === 0 || saving
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <ChevronUpIcon size={14} />
                            </button>
                            <button
                              onClick={() => handlePriorityChange(config, 'down')}
                              disabled={index === configurations.length - 1 || saving}
                              className={`p-0.5 rounded ${
                                index === configurations.length - 1 || saving
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <ChevronDownIcon size={14} />
                            </button>
                          </div>

                          {/* Platform icon and name */}
                          {config.platform?.icon_svg && (
                            <div
                              className="w-8 h-8"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(config.platform.icon_svg) }}
                            />
                          )}
                          <div>
                            <h3 className={`font-semibold ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {config.platform?.name || 'Unknown Platform'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                config.is_enabled
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {config.is_enabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <span className={`text-xs ${
                                darkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Priority: {config.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedConfig(expandedConfig === config.id ? null : config.id)}
                            className={`p-2 rounded-lg hover:bg-opacity-10 ${
                              darkMode ? 'hover:bg-white' : 'hover:bg-black'
                            }`}
                          >
                            <SettingsIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfig(config.platform_id)}
                            disabled={saving}
                            className={`p-2 rounded-lg hover:bg-opacity-10 ${
                              darkMode ? 'hover:bg-white' : 'hover:bg-black'
                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <TrashIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Configuration */}
                    {expandedConfig === config.id && (
                      <div className="p-4 space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Additional Instructions
                          </label>
                          <textarea
                            value={config.additional_instructions || ''}
                            onChange={(e) => {
                              const updated = configurations.map(c =>
                                c.id === config.id
                                  ? { ...c, additional_instructions: e.target.value }
                                  : c
                              );
                              setConfigurations(updated);
                            }}
                            rows={6}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              darkMode
                                ? 'bg-[#1a1a1a] border-[#444444] text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="Enter platform-specific instructions for this character..."
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className={`flex items-center cursor-pointer ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <input
                              type="checkbox"
                              checked={config.is_enabled}
                              onChange={(e) => {
                                const updated = configurations.map(c =>
                                  c.id === config.id
                                    ? { ...c, is_enabled: e.target.checked }
                                    : c
                                );
                                setConfigurations(updated);
                              }}
                              className="mr-2"
                            />
                            Enable this configuration
                          </label>

                          <button
                            onClick={() => {
                              const configToUpdate = configurations.find(c => c.id === config.id);
                              handleUpdateConfig(config.platform_id, {
                                additional_instructions: configToUpdate.additional_instructions,
                                is_enabled: configToUpdate.is_enabled,
                                priority: configToUpdate.priority,
                                metadata: configToUpdate.metadata
                              });
                            }}
                            disabled={saving}
                            className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                              saving ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <SaveIcon size={16} />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Platform Section */}
              {!addingPlatform && getAvailablePlatformsForAdd().length > 0 && (
                <button
                  onClick={() => setAddingPlatform(true)}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:border-purple-500 transition-colors"
                  style={{
                    borderColor: darkMode ? '#444444' : '#e5e7eb',
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}
                >
                  <PlusIcon size={20} />
                  Add Platform Configuration
                </button>
              )}

              {addingPlatform && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  darkMode ? 'bg-[#2a2a2a] border-[#444444]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Add New Platform Configuration
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Select Platform
                      </label>
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-[#1a1a1a] border-[#444444] text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Choose a platform...</option>
                        {getAvailablePlatformsForAdd().map(platform => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Additional Instructions
                      </label>
                      <textarea
                        value={formData.additional_instructions}
                        onChange={(e) => setFormData({
                          ...formData,
                          additional_instructions: e.target.value
                        })}
                        rows={4}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-[#1a1a1a] border-[#444444] text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Enter platform-specific instructions..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleAddPlatform}
                        disabled={saving || !selectedPlatform}
                        className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                          saving || !selectedPlatform ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Add Configuration
                      </button>
                      <button
                        onClick={() => {
                          setAddingPlatform(false);
                          setSelectedPlatform('');
                          setFormData({
                            platform_id: '',
                            additional_instructions: '',
                            is_enabled: true,
                            priority: 0,
                            metadata: {
                              merge_strategy: 'append',
                              emphasis_level: 'medium',
                            }
                          });
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          darkMode
                            ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } transition-colors`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {configurations.length === 0 && !addingPlatform && (
                <div className={`text-center py-8 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No platform configurations yet. Add one to get started.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}