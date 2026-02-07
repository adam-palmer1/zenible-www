import React, { useState, useEffect, useRef } from 'react';
import adminAPI from '../../services/adminAPI';

interface BackendProvider {
  value: string;
  label: string;
  description: string;
}

interface CharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: any | null;
  isCloning: boolean;
  categories: any[];
  availableModels: any[];
  embeddingModels: any[];
  modelsLoading: boolean;
  availableTools: any[];
  toolDefinitions: Record<string, any>;
  shortcodes: any[];
  shortcodesLoading: boolean;
  backendProviders: BackendProvider[];
  onSave: () => void;
  darkMode: boolean;
}

const responseFormats = [
  { value: 'auto', label: 'Auto' },
  { value: 'text', label: 'Text' },
  { value: 'json_object', label: 'JSON Object' },
  { value: 'json_schema', label: 'JSON Schema' }
];

const schemaTemplates = {
  simple: {
    name: "simple_response",
    schema: {
      type: "object",
      properties: {
        answer: { type: "string" }
      },
      required: ["answer"],
      additionalProperties: false
    }
  },
  detailed: {
    name: "detailed_response",
    schema: {
      type: "object",
      properties: {
        answer: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        sources: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["answer"],
      additionalProperties: false
    }
  },
  structured: {
    name: "structured_analysis",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        key_points: {
          type: "array",
          items: { type: "string" }
        },
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"]
        },
        action_required: { type: "boolean" }
      },
      required: ["summary", "key_points"],
      additionalProperties: false
    }
  }
};

export default function CharacterFormModal({
  isOpen,
  onClose,
  character,
  isCloning,
  categories,
  availableModels,
  embeddingModels,
  modelsLoading,
  availableTools,
  toolDefinitions,
  shortcodes,
  shortcodesLoading,
  backendProviders,
  onSave,
  darkMode
}: CharacterFormModalProps) {
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states for character
  const [characterForm, setCharacterForm] = useState({
    name: '',
    internal_name: '',
    description: '',
    backend_provider: 'openai_chat',
    metadata: {
      model: 'gpt-4-turbo-preview',
      system_instructions: '',
      temperature: 0.7,
      top_p: 1.0,
      response_format: 'auto',
      json_schema: null as any,
      max_tokens: 2000,
      enable_code_interpreter: false,
      enable_file_search: false,
      custom_functions: [] as any[],
      embedding_model: 'text-embedding-3-large',
      chunk_size: 1024,
      chunk_overlap: 100,
      vector_store_id: null as any
    },
    category_id: '',
    is_active: true,
    avatar_url: ''
  });

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom functions state
  const [customFunctions, setCustomFunctions] = useState<any[]>([]);

  // Initialize form when modal opens or character changes
  useEffect(() => {
    if (!isOpen) return;

    if (character && !isCloning) {
      // Edit mode
      setCustomFunctions(character.metadata?.custom_functions || []);
      setCurrentAvatar(character.avatar_url || null);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarError(null);
      setCharacterForm({
        name: character.name || '',
        internal_name: character.internal_name || '',
        description: character.description || '',
        backend_provider: character.backend_provider || 'openai_chat',
        metadata: {
          model: character.metadata?.model || 'gpt-4-turbo-preview',
          system_instructions: character.metadata?.system_instructions || '',
          temperature: character.metadata?.temperature ?? 0.7,
          top_p: character.metadata?.top_p ?? 1.0,
          response_format: character.metadata?.response_format || 'auto',
          max_tokens: character.metadata?.max_tokens || 2000,
          enable_code_interpreter: character.metadata?.enable_code_interpreter || false,
          enable_file_search: character.metadata?.enable_file_search || false,
          custom_functions: character.metadata?.custom_functions || [],
          embedding_model: character.metadata?.embedding_model || 'text-embedding-3-large',
          chunk_size: character.metadata?.chunk_size || 1024,
          chunk_overlap: character.metadata?.chunk_overlap || 100,
          vector_store_id: character.metadata?.vector_store_id || null,
          json_schema: character.metadata?.json_schema || null
        },
        category_id: character.category_id || '',
        is_active: character.is_active !== false,
        avatar_url: character.avatar_url || ''
      });
    } else if (character && isCloning) {
      // Clone mode
      setCustomFunctions(character.metadata?.custom_functions || []);
      setCurrentAvatar(null);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarError(null);
      setCharacterForm({
        name: `${character.name} (Copy)`,
        internal_name: `${character.internal_name}_copy_${Date.now()}`,
        description: character.description || '',
        backend_provider: character.backend_provider || 'openai_chat',
        metadata: {
          model: character.metadata?.model || 'gpt-4-turbo-preview',
          system_instructions: character.metadata?.system_instructions || '',
          temperature: character.metadata?.temperature ?? 0.7,
          top_p: character.metadata?.top_p ?? 1.0,
          response_format: character.metadata?.response_format || 'auto',
          max_tokens: character.metadata?.max_tokens || 2000,
          enable_code_interpreter: character.metadata?.enable_code_interpreter || false,
          enable_file_search: character.metadata?.enable_file_search || false,
          custom_functions: character.metadata?.custom_functions || [],
          embedding_model: character.metadata?.embedding_model || 'text-embedding-3-large',
          chunk_size: character.metadata?.chunk_size || 1024,
          chunk_overlap: character.metadata?.chunk_overlap || 100,
          vector_store_id: character.metadata?.vector_store_id || null,
          json_schema: character.metadata?.json_schema || null
        },
        category_id: character.category_id || '',
        is_active: true,
        avatar_url: ''
      });
    } else {
      // Create mode
      setCustomFunctions([]);
      setCurrentAvatar(null);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarError(null);
      setCharacterForm({
        name: '',
        internal_name: '',
        description: '',
        backend_provider: 'openai_chat',
        metadata: {
          model: 'gpt-4-turbo-preview',
          system_instructions: '',
          temperature: 0.7,
          top_p: 1.0,
          response_format: 'auto',
          json_schema: null,
          max_tokens: 2000,
          enable_code_interpreter: false,
          enable_file_search: false,
          custom_functions: [],
          embedding_model: 'text-embedding-3-large',
          chunk_size: 1024,
          chunk_overlap: 100,
          vector_store_id: null
        },
        category_id: '',
        is_active: true,
        avatar_url: ''
      });
    }
    setModalError(null);
  }, [isOpen, character, isCloning]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen]);

  const handleClose = () => {
    setModalError(null);
    onClose();
  };

  const handleProviderChange = (provider: any) => {
    setCharacterForm(prev => ({
      ...prev,
      backend_provider: provider,
      metadata: {
        ...prev.metadata,
        enable_code_interpreter: provider === 'openai_assistant',
        enable_file_search: provider === 'openai_rag' || provider === 'openai_assistant',
        custom_functions: provider === 'openai_assistant' ? prev.metadata.custom_functions : []
      }
    }));
  };

  const handleAvatarFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setAvatarFile(file);
  };

  const handleAvatarUpload = async (characterId: string) => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      await adminAPI.uploadAICharacterAvatar(characterId, avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      throw new Error('Failed to upload avatar: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (avatarPreview) {
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (currentAvatar && character && !isCloning) {
      if (!confirm('Are you sure you want to delete this avatar?')) {
        return;
      }

      try {
        await adminAPI.deleteAICharacterAvatar(character.id);
        setCurrentAvatar(null);
        setCharacterForm({ ...characterForm, avatar_url: '' });
        onSave(); // Refresh the list to update avatar display
      } catch (err: any) {
        console.error('Failed to delete avatar:', err);
        setAvatarError('Failed to delete avatar: ' + err.message);
      }
    }
  };

  const handleSaveCharacter = async () => {
    setModalError(null);
    try {
      const internalNameRegex = /^[a-z0-9_-]+$/;
      if (!internalNameRegex.test(characterForm.internal_name)) {
        setModalError('Internal name must be lowercase with only letters, numbers, hyphens, and underscores');
        return;
      }

      const data = {
        ...characterForm,
        metadata: {
          ...characterForm.metadata,
          custom_functions: customFunctions
        },
        category_id: characterForm.category_id || null
      };

      let characterId;
      if (character && !isCloning) {
        await adminAPI.updateAICharacter(character.id, data);
        characterId = character.id;
      } else {
        const response = await adminAPI.createAICharacter(data) as any;
        characterId = response.id;
      }

      if (avatarFile && characterId) {
        await handleAvatarUpload(characterId);
      }

      onClose();
      onSave();
      setModalError(null);
    } catch (err: any) {
      if (err.response?.detail) {
        const detail = err.response.detail;
        if (Array.isArray(detail)) {
          const errors = detail.map((error: any) => {
            const field = error.loc?.join('.') || 'Field';
            return `${field}: ${error.msg}`;
          }).join('\n');
          setModalError(errors);
        } else if (typeof detail === 'string') {
          setModalError(detail);
        } else {
          setModalError(err.message);
        }
      } else {
        setModalError(err.message || 'An error occurred while saving the character');
      }
    }
  };

  const addCustomFunction = () => {
    const newFunction = {
      name: '',
      description: '',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };
    setCustomFunctions([...customFunctions, newFunction]);
  };

  const updateCustomFunction = (index: number, updatedFunction: any) => {
    const newFunctions = [...customFunctions];
    newFunctions[index] = updatedFunction;
    setCustomFunctions(newFunctions);
  };

  const removeCustomFunction = (index: number) => {
    setCustomFunctions(customFunctions.filter((_: any, i: number) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg p-6 ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${
            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
          }`}>
            {character && !isCloning ? 'Edit Character' : (isCloning ? 'Clone Character' : 'Create New Character')}
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-zenible-dark-bg text-zenible-dark-text'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Avatar Upload Section */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Character Avatar
            </label>
            <div className="flex items-start gap-4">
              {/* Avatar Preview */}
              <div className="flex-shrink-0">
                {(avatarPreview || currentAvatar) ? (
                  <div className="relative">
                    <img
                      src={avatarPreview || currentAvatar!}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                    />
                    {(avatarPreview || currentAvatar) && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        title="Remove avatar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center ${
                    darkMode ? 'border-zenible-dark-border bg-zenible-dark-bg' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-hover'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Uploading...' : 'Choose Image'}
                </button>
                <p className={`mt-2 text-xs ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}>
                  Accepts JPEG, PNG, GIF, WebP. Max 5MB.
                </p>
                {avatarError && (
                  <p className="mt-2 text-xs text-red-500">
                    {avatarError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Display Name *
            </label>
            <input
              type="text"
              value={characterForm.name}
              onChange={(e) => setCharacterForm({...characterForm, name: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="e.g., Customer Support Agent"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Internal Name * (lowercase, hyphens/underscores only)
            </label>
            <input
              type="text"
              value={characterForm.internal_name}
              onChange={(e) => setCharacterForm({...characterForm, internal_name: e.target.value.toLowerCase()})}
              className={`w-full px-3 py-2 border rounded-lg font-mono ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="e.g., customer-support-agent"
              pattern="^[a-z0-9_-]+$"
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Description
            </label>
            <textarea
              value={characterForm.description}
              onChange={(e) => setCharacterForm({...characterForm, description: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={3}
              placeholder="Brief description of the character's purpose..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Backend Provider *
            </label>
            <select
              value={characterForm.backend_provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {backendProviders.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label} - {provider.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Category
            </label>
            <select
              value={characterForm.category_id}
              onChange={(e) => setCharacterForm({...characterForm, category_id: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">No Category</option>
              {Array.isArray(categories) && categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Model
            </label>
            <select
              value={characterForm.metadata.model}
              onChange={(e) => setCharacterForm({
                ...characterForm,
                metadata: {...characterForm.metadata, model: e.target.value}
              })}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {modelsLoading ? (
                <option value="">Loading models...</option>
              ) : availableModels.length > 0 ? (
                availableModels.map(model => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))
              ) : (
                <option value="">No models available</option>
              )}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Temperature ({characterForm.metadata.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={characterForm.metadata.temperature}
              onChange={(e) => setCharacterForm({
                ...characterForm,
                metadata: {...characterForm.metadata, temperature: parseFloat(e.target.value)}
              })}
              className="w-full"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Top P ({characterForm.metadata.top_p})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={characterForm.metadata.top_p}
              onChange={(e) => setCharacterForm({
                ...characterForm,
                metadata: {...characterForm.metadata, top_p: parseFloat(e.target.value)}
              })}
              className="w-full"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Response Format
            </label>
            <select
              value={characterForm.metadata.response_format}
              onChange={(e) => {
                const newMetadata = {...characterForm.metadata, response_format: e.target.value};
                // Clear json_schema if not using json_schema format
                if (e.target.value !== 'json_schema') {
                  delete (newMetadata as any).json_schema;
                }
                setCharacterForm({
                  ...characterForm,
                  metadata: newMetadata
                });
              }}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {responseFormats.map(format => (
                <option key={format.value} value={format.value}>{format.label}</option>
              ))}
            </select>
          </div>

          {/* JSON Schema Editor - Conditional */}
          {characterForm.metadata.response_format === 'json_schema' && (
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
              }`}>
                JSON Schema Configuration
              </label>

              {/* Schema Templates */}
              <div className="mb-2">
                <label className={`text-xs ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}>
                  Quick Templates:
                </label>
                <div className="flex gap-2 mt-1">
                  {Object.keys(schemaTemplates).map(templateKey => (
                    <button
                      key={templateKey}
                      type="button"
                      onClick={() => {
                        const template = schemaTemplates[templateKey];
                        setCharacterForm({
                          ...characterForm,
                          metadata: {
                            ...characterForm.metadata,
                            json_schema: template
                          }
                        });
                      }}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        darkMode
                          ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schema Name Input */}
              <div className="mb-2">
                <input
                  type="text"
                  value={characterForm.metadata.json_schema?.name || ''}
                  onChange={(e) => setCharacterForm({
                    ...characterForm,
                    metadata: {
                      ...characterForm.metadata,
                      json_schema: {
                        ...characterForm.metadata.json_schema,
                        name: e.target.value
                      }
                    }
                  })}
                  placeholder="Schema name (e.g., my_response_format)"
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* JSON Schema Editor */}
              <textarea
                value={JSON.stringify(characterForm.metadata.json_schema?.schema || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const schema = JSON.parse(e.target.value);
                    setCharacterForm({
                      ...characterForm,
                      metadata: {
                        ...characterForm.metadata,
                        json_schema: {
                          ...characterForm.metadata.json_schema,
                          schema: schema
                        }
                      }
                    });
                    setModalError(null);
                  } catch (err: any) {
                    setModalError('Invalid JSON schema format');
                  }
                }}
                placeholder={`{
  "type": "object",
  "properties": {
    "answer": {
      "type": "string"
    }
  },
  "required": ["answer"],
  "additionalProperties": false
}`}
                rows={10}
                className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />

              <p className={`text-xs mt-1 ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
              }`}>
                Define the JSON schema that the AI response must conform to. The schema should be a valid JSON Schema (draft 7).
              </p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Max Tokens
            </label>
            <input
              type="number"
              value={characterForm.metadata.max_tokens}
              onChange={(e) => setCharacterForm({
                ...characterForm,
                metadata: {...characterForm.metadata, max_tokens: parseInt(e.target.value)}
              })}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="1"
              max="32000"
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              System Instructions
            </label>
            <textarea
              value={characterForm.metadata.system_instructions}
              onChange={(e) => setCharacterForm({
                ...characterForm,
                metadata: {...characterForm.metadata, system_instructions: e.target.value}
              })}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={6}
              placeholder="You are a helpful assistant..."
            />

            {/* Shortcodes section - only show for OpenAI Chat */}
            {characterForm.backend_provider === 'openai_chat' && (
              <div className={`mt-3 p-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-sm font-semibold ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-800'
                  }`}>
                    Available Placeholder Variables
                  </h4>
                  {shortcodesLoading && (
                    <span className={`text-xs ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Loading...
                    </span>
                  )}
                </div>

                {shortcodes.length > 0 ? (
                  <div className="space-y-2">
                    {shortcodes.map((sc) => (
                      <div
                        key={sc.shortcode}
                        className={`text-xs p-2 rounded ${
                          darkMode
                            ? 'bg-zenible-dark-surface'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <code className={`font-mono font-semibold ${
                            darkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {sc.shortcode}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(sc.shortcode);
                            }}
                            className={`px-2 py-0.5 rounded text-xs ${
                              darkMode
                                ? 'bg-zenible-dark-bg hover:bg-zenible-dark-border text-zenible-dark-text'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Copy to clipboard"
                          >
                            Copy
                          </button>
                        </div>
                        <p className={`mt-1 ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
                        }`}>
                          {sc.description}
                        </p>
                        {sc.example && (
                          <p className={`mt-1 font-mono text-xs ${
                            darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                          }`}>
                            Example: {sc.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !shortcodesLoading && (
                  <p className={`text-xs ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    No placeholder variables available.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Assistant-specific configuration */}
          {characterForm.backend_provider === 'openai_assistant' && (
            <div className={`md:col-span-2 border rounded-lg p-4 ${
              darkMode ? 'border-zenible-dark-border bg-zenible-dark-bg' : 'border-blue-200 bg-blue-50'
            }`}>
              <h3 className={`font-semibold mb-3 ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-800'
              }`}>
                OpenAI Assistant Configuration
              </h3>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={characterForm.metadata.enable_code_interpreter}
                    onChange={(e) => setCharacterForm({
                      ...characterForm,
                      metadata: {...characterForm.metadata, enable_code_interpreter: e.target.checked}
                    })}
                    className="mr-2"
                  />
                  <span className={`text-sm ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                  }`}>
                    Enable Code Interpreter ($0.03 per session)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={characterForm.metadata.enable_file_search}
                    onChange={(e) => setCharacterForm({
                      ...characterForm,
                      metadata: {...characterForm.metadata, enable_file_search: e.target.checked}
                    })}
                    className="mr-2"
                  />
                  <span className={`text-sm ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                  }`}>
                    Enable File Search
                  </span>
                </label>

                {/* Custom Functions */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      Functions & Tools
                    </label>
                    <div className="flex gap-2">
                      {/* Add available tool dropdown */}
                      {availableTools.length > 0 && availableTools.some(tool => !customFunctions.some(f => f.name === tool.value)) && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const toolName = e.target.value;
                              const toolDef = toolDefinitions[toolName];

                              if (toolDef) {
                                const newFunction = {
                                  name: toolDef.function.name,
                                  description: toolDef.function.description,
                                  parameters: toolDef.function.parameters
                                };
                                setCustomFunctions([...customFunctions, newFunction]);
                              }
                              e.target.value = '';
                            }
                          }}
                          className={`px-3 py-1 text-sm rounded ${
                            darkMode
                              ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="">Add Available Tool...</option>
                          {availableTools
                            .filter(tool => !customFunctions.some(f => f.name === tool.value))
                            .map(tool => (
                              <option key={tool.value} value={tool.value}>
                                {tool.label}
                              </option>
                            ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={addCustomFunction}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add Custom Function
                      </button>
                    </div>
                  </div>

                  {customFunctions.map((func, index) => (
                    <div key={index} className={`border rounded p-3 mb-2 ${
                      darkMode ? 'border-zenible-dark-border' : 'border-gray-300'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-800'
                          }`}>
                            {func.name || `Function ${index + 1}`}
                          </h4>
                          {/* Show badge if this is a backend tool */}
                          {availableTools.some(tool => tool.value === func.name) && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                            }`}>
                              Backend Tool
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomFunction(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Check if this is a backend tool */}
                        {availableTools.some(tool => tool.value === func.name) ? (
                          <>
                            {/* Read-only display for backend tools */}
                            <input
                              type="text"
                              value={func.name}
                              disabled
                              className={`w-full px-2 py-1 border rounded opacity-75 ${
                                darkMode
                                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                                  : 'bg-gray-100 border-gray-300 text-gray-600'
                              }`}
                            />
                            <textarea
                              value={func.description}
                              disabled
                              className={`w-full px-2 py-1 border rounded opacity-75 ${
                                darkMode
                                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                                  : 'bg-gray-100 border-gray-300 text-gray-600'
                              }`}
                              rows={2}
                            />
                            <textarea
                              value={JSON.stringify(func.parameters, null, 2)}
                              disabled
                              className={`w-full px-2 py-1 border rounded font-mono text-xs opacity-75 ${
                                darkMode
                                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                                  : 'bg-gray-100 border-gray-300 text-gray-600'
                              }`}
                              rows={4}
                            />
                          </>
                        ) : (
                          <>
                            {/* Editable fields for custom functions */}
                            <input
                              type="text"
                              placeholder="Function Name (e.g., get_weather)"
                              value={func.name}
                              onChange={(e) => updateCustomFunction(index, {...func, name: e.target.value})}
                              className={`w-full px-2 py-1 border rounded ${
                                darkMode
                                  ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <textarea
                              placeholder="Function Description"
                              value={func.description}
                              onChange={(e) => updateCustomFunction(index, {...func, description: e.target.value})}
                              className={`w-full px-2 py-1 border rounded ${
                                darkMode
                                  ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              rows={2}
                            />
                            <textarea
                              placeholder='Parameters JSON (e.g., {"type": "object", "properties": {...}})'
                              value={JSON.stringify(func.parameters, null, 2)}
                              onChange={(e) => {
                                try {
                                  const params = JSON.parse(e.target.value);
                                  updateCustomFunction(index, {...func, parameters: params});
                                } catch (err: any) {
                                  // Invalid JSON, just update the string for now
                                }
                              }}
                              className={`w-full px-2 py-1 border rounded font-mono text-xs ${
                                darkMode
                                  ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              rows={4}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RAG-specific configuration */}
          {characterForm.backend_provider === 'openai_rag' && (
            <div className={`md:col-span-2 border rounded-lg p-4 ${
              darkMode ? 'border-zenible-dark-border bg-zenible-dark-bg' : 'border-green-200 bg-green-50'
            }`}>
              <h3 className={`font-semibold mb-3 ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-800'
              }`}>
                RAG Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                  }`}>
                    Embedding Model
                  </label>
                  <select
                    value={characterForm.metadata.embedding_model}
                    onChange={(e) => setCharacterForm({
                      ...characterForm,
                      metadata: {...characterForm.metadata, embedding_model: e.target.value}
                    })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode
                        ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {modelsLoading ? (
                      <option value="">Loading models...</option>
                    ) : embeddingModels.length > 0 ? (
                      embeddingModels.map(model => (
                        <option key={model.value} value={model.value}>{model.label}</option>
                      ))
                    ) : (
                      <option value="">No embedding models available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                  }`}>
                    Chunk Size
                  </label>
                  <input
                    type="number"
                    value={characterForm.metadata.chunk_size}
                    onChange={(e) => setCharacterForm({
                      ...characterForm,
                      metadata: {...characterForm.metadata, chunk_size: parseInt(e.target.value)}
                    })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode
                        ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    min="100"
                    max="4000"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                  }`}>
                    Chunk Overlap
                  </label>
                  <input
                    type="number"
                    value={characterForm.metadata.chunk_overlap}
                    onChange={(e) => setCharacterForm({
                      ...characterForm,
                      metadata: {...characterForm.metadata, chunk_overlap: parseInt(e.target.value)}
                    })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode
                        ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    min="0"
                    max="500"
                  />
                </div>

                <div>
                  <label className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      checked={characterForm.metadata.enable_file_search}
                      onChange={(e) => setCharacterForm({
                        ...characterForm,
                        metadata: {...characterForm.metadata, enable_file_search: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      Enable File Search ($0.10/GB/day)
                    </span>
                  </label>
                </div>
              </div>

              <div className={`mt-3 p-3 rounded ${
                darkMode ? 'bg-zenible-dark-card' : 'bg-green-100'
              }`}>
                <p className={`text-sm ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}>
                  Upload documents to the vector store after creating the character.
                </p>
              </div>
            </div>
          )}


          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={characterForm.is_active}
                onChange={(e) => setCharacterForm({...characterForm, is_active: e.target.checked})}
                className="mr-2"
              />
              <span className={`text-sm ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
              }`}>
                Active
              </span>
            </label>
          </div>
        </div>

        {modalError && (
          <div className={`mt-4 p-3 rounded-lg ${
            darkMode
              ? 'bg-red-900/20 border border-red-800 text-red-400'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm whitespace-pre-wrap">{modalError}</div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className={`px-4 py-2 border rounded-lg ${
              darkMode
                ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCharacter}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            {character && !isCloning ? 'Update' : 'Create'} Character
          </button>
        </div>
      </div>
    </div>
  );
}
