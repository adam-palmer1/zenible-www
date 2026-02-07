import React, { useState, useEffect, useRef } from 'react';
import adminAPI from '../../services/adminAPI';
import {
  AvatarUploadSection,
  BasicInfoFields,
  ModelSettingsFields,
  SystemInstructionsSection,
  AssistantConfigSection,
  RAGConfigSection,
} from './character-form';
import type {
  BackendProvider,
  JsonSchema,
  CustomFunction,
  CharacterRecord,
  SelectOption,
  ToolDefinition,
  ShortcodeItem,
  ValidationError,
  CharacterFormState,
} from './character-form';

interface CharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterRecord | null;
  isCloning: boolean;
  categories: Array<{ id: string; name: string }>;
  availableModels: SelectOption[];
  embeddingModels: SelectOption[];
  modelsLoading: boolean;
  availableTools: SelectOption[];
  toolDefinitions: Record<string, ToolDefinition>;
  shortcodes: ShortcodeItem[];
  shortcodesLoading: boolean;
  backendProviders: BackendProvider[];
  onSave: () => void;
  darkMode: boolean;
}

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
  const [characterForm, setCharacterForm] = useState<CharacterFormState>({
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
      json_schema: null as JsonSchema | null,
      max_tokens: 2000,
      enable_code_interpreter: false,
      enable_file_search: false,
      custom_functions: [] as CustomFunction[],
      embedding_model: 'text-embedding-3-large',
      chunk_size: 1024,
      chunk_overlap: 100,
      vector_store_id: null as string | null
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
  const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  // Custom functions state
  const [customFunctions, setCustomFunctions] = useState<CustomFunction[]>([]);

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

  const handleProviderChange = (provider: string) => {
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

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    } catch (_err: any) {
      console.error('Failed to upload avatar:', _err);
      throw new Error('Failed to upload avatar: ' + _err.message);
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
      } catch (_err: any) {
        console.error('Failed to delete avatar:', _err);
        setAvatarError('Failed to delete avatar: ' + _err.message);
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
        const response = await adminAPI.createAICharacter(data) as { id: string };
        characterId = response.id;
      }

      if (avatarFile && characterId) {
        await handleAvatarUpload(characterId);
      }

      onClose();
      onSave();
      setModalError(null);
    } catch (_err: any) {
      if (_err.response?.detail) {
        const detail = _err.response.detail;
        if (Array.isArray(detail)) {
          const errors = detail.map((error: ValidationError) => {
            const field = error.loc?.join('.') || 'Field';
            return `${field}: ${error.msg}`;
          }).join('\n');
          setModalError(errors);
        } else if (typeof detail === 'string') {
          setModalError(detail);
        } else {
          setModalError(_err.message);
        }
      } else {
        setModalError(_err.message || 'An error occurred while saving the character');
      }
    }
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
          <AvatarUploadSection
            avatarPreview={avatarPreview}
            currentAvatar={currentAvatar}
            avatarError={avatarError}
            uploadingAvatar={uploadingAvatar}
            fileInputRef={fileInputRef}
            onFileChange={handleAvatarFileChange}
            onDeleteAvatar={handleDeleteAvatar}
            darkMode={darkMode}
          />

          <BasicInfoFields
            characterForm={characterForm}
            setCharacterForm={setCharacterForm}
            categories={categories}
            backendProviders={backendProviders}
            onProviderChange={handleProviderChange}
            darkMode={darkMode}
          />

          <ModelSettingsFields
            characterForm={characterForm}
            setCharacterForm={setCharacterForm}
            availableModels={availableModels}
            modelsLoading={modelsLoading}
            setModalError={setModalError}
            darkMode={darkMode}
          />

          <SystemInstructionsSection
            characterForm={characterForm}
            setCharacterForm={setCharacterForm}
            shortcodes={shortcodes}
            shortcodesLoading={shortcodesLoading}
            darkMode={darkMode}
          />

          <AssistantConfigSection
            characterForm={characterForm}
            setCharacterForm={setCharacterForm}
            customFunctions={customFunctions}
            setCustomFunctions={setCustomFunctions}
            availableTools={availableTools}
            toolDefinitions={toolDefinitions}
            darkMode={darkMode}
          />

          <RAGConfigSection
            characterForm={characterForm}
            setCharacterForm={setCharacterForm}
            embeddingModels={embeddingModels}
            modelsLoading={modelsLoading}
            darkMode={darkMode}
          />

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
