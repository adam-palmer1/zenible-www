import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import PlatformManagement from './PlatformManagement';
import CharacterPlatformConfig from './CharacterPlatformConfig';
import CharacterFilters from './CharacterFilters';
import CharacterTable from './CharacterTable';
import CharacterFormModal from './CharacterFormModal';
import CategoryFormModal from './CategoryFormModal';
import { LoadingSpinner } from '../shared';
import type {
  AICharacterResponse,
  AICharacterList,
  AICharacterCategoryResponse,
  AICharacterCategoryList,
  OpenAIModelList,
  OpenAIModelResponse,
  ShortcodeListResponse,
  ShortcodeInfo,
} from '../../types/ai';

interface AdminOutletContext {
  darkMode: boolean;
}

const backendProviders = [
  { value: 'openai_chat', label: 'OpenAI Chat', description: 'Simple Q&A, basic conversations' },
  { value: 'openai_assistant', label: 'OpenAI Assistant', description: 'Complex tasks with tools' },
  { value: 'openai_rag', label: 'OpenAI RAG', description: 'Document-based Q&A' }
];

export default function AICharacterManagement() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [characters, setCharacters] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // OpenAI Models state
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Available Tools state
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [_toolsLoading, setToolsLoading] = useState(false);

  // Store original tool definitions from backend
  const [toolDefinitions, setToolDefinitions] = useState<Record<string, any>>({});

  // Modal states
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showPlatformConfigModal, setShowPlatformConfigModal] = useState(false);
  const [selectedCharacterForPlatform, setSelectedCharacterForPlatform] = useState<any>(null);
  const [editingCharacter, setEditingCharacter] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [syncingCharacter, setSyncingCharacter] = useState<any>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Filter and search states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sync status
  const [_syncStatus, setSyncStatus] = useState<Record<string, any>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    category: true,
    model: true,
    status: true,
    actions: true
  });

  // Shortcodes state
  const [shortcodes, setShortcodes] = useState<any[]>([]);
  const [shortcodesLoading, setShortcodesLoading] = useState(false);

  useEffect(() => {
    fetchCharacters();
    fetchCategories();
    fetchOpenAIModels();
    fetchOpenAITools();
  }, [search, categoryFilter, providerFilter, statusFilter]);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('aiCharactersVisibleColumns');
    if (savedColumns) {
      try {
        setVisibleColumns(JSON.parse(savedColumns));
      } catch (err: any) {
        console.error('Error loading column preferences:', err);
      }
    }
  }, []);

  // Save column preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aiCharactersVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Fetch shortcodes when character modal opens with OpenAI Chat provider
  useEffect(() => {
    if (showCharacterModal && shortcodes.length === 0) {
      fetchShortcodes();
    }
  }, [showCharacterModal]);

  const fetchOpenAIModels = async () => {
    setModelsLoading(true);
    try {
      const response = await adminAPI.getOpenAIModels({
        is_active: 'true',
        per_page: '100'
      }) as OpenAIModelList;

      const chatModels: any[] = [];
      const embedModels: any[] = [];

      if (response.models && Array.isArray(response.models)) {
        response.models.forEach((model: any) => {
          if (model.supports_embedding) {
            embedModels.push({
              value: model.model_id,
              label: model.model_id
            });
          }
          if (model.supports_chat || model.supports_completion) {
            chatModels.push({
              value: model.model_id,
              label: model.model_id
            });
          }
        });
      }

      setAvailableModels(chatModels);
      setEmbeddingModels(embedModels);
    } catch (err: any) {
      console.error('Failed to fetch OpenAI models:', err);
      setAvailableModels([
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ]);
      setEmbeddingModels([
        { value: 'text-embedding-3-large', label: 'Text Embedding 3 Large' }
      ]);
    } finally {
      setModelsLoading(false);
    }
  };

  const fetchOpenAITools = async () => {
    setToolsLoading(true);
    try {
      const response = await adminAPI.getOpenAITools();

      const tools: any[] = [];
      const definitions: Record<string, any> = {};

      if (Array.isArray(response)) {
        response.forEach((tool: any) => {
          const toolName = tool.function.name;

          definitions[toolName] = tool;

          const transformedTool = {
            value: toolName,
            label: tool.metadata?.display_name || toolName.charAt(0).toUpperCase() + toolName.slice(1),
            description: tool.metadata?.description_full || tool.function.description,
            enabled: tool.metadata?.enabled !== false,
            category: tool.metadata?.category || 'general',
            example: tool.metadata?.example_usage
          };
          tools.push(transformedTool);
        });
      } else {
        console.warn('Response is not an array:', response);
      }

      setAvailableTools(tools);
      setToolDefinitions(definitions);
    } catch (err: any) {
      console.error('Failed to fetch OpenAI tools:', err);
      const fallbackTools = [
        { value: 'calculate', label: 'Calculator', description: 'Mathematical calculations', enabled: true, category: 'general' }
      ];
      setAvailableTools(fallbackTools);
      setToolDefinitions({});
    } finally {
      setToolsLoading(false);
    }
  };

  const fetchShortcodes = async () => {
    setShortcodesLoading(true);
    try {
      const response = await adminAPI.getAICharacterShortcodes() as ShortcodeListResponse;
      if (response && Array.isArray(response.shortcodes)) {
        setShortcodes(response.shortcodes);
      } else {
        setShortcodes([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch shortcodes:', err);
      setShortcodes([]);
    } finally {
      setShortcodesLoading(false);
    }
  };

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        ...(search && { search }),
        ...(categoryFilter && { category_id: categoryFilter }),
        ...(providerFilter && { backend_provider: providerFilter }),
        ...(statusFilter !== '' && { is_active: String(statusFilter === 'active') })
      };

      const response = await adminAPI.getAICharacters(params) as
        | AICharacterResponse[]
        | (AICharacterList & { items?: AICharacterResponse[] });
      if (Array.isArray(response)) {
        setCharacters(response);
      } else if (response && Array.isArray(response.items)) {
        setCharacters(response.items);
      } else {
        setCharacters([]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching AI characters:', err);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getAICharacterCategories() as
        | AICharacterCategoryResponse[]
        | (AICharacterCategoryList & { items?: AICharacterCategoryResponse[] });
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && Array.isArray(response.items)) {
        setCategories(response.items);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setIsCloning(false);
    setShowCharacterModal(true);
  };

  const handleEditCharacter = (character: any) => {
    setEditingCharacter(character);
    setIsCloning(false);
    setShowCharacterModal(true);
  };

  const handleCloneCharacter = (character: any) => {
    setEditingCharacter(character);
    setIsCloning(true);
    setShowCharacterModal(true);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (confirm('Are you sure you want to archive this character? It will be marked as inactive.')) {
      try {
        await adminAPI.deleteAICharacter(characterId);
        fetchCharacters();
      } catch (err: any) {
        alert(`Error archiving character: ${err.message}`);
      }
    }
  };

  const handleShowSyncModal = (_character: any) => {
    setSyncingCharacter(_character);
    setShowSyncModal(true);
  };

  const handleSyncAssistant = async (characterId: string, force = false) => {
    setSyncing(prev => ({ ...prev, [characterId]: true }));
    setSyncStatus(prev => ({ ...prev, [characterId]: 'syncing' }));
    setShowSyncModal(false);

    try {
      await adminAPI.syncAICharacterWithAssistant(characterId, force);
      setSyncStatus(prev => ({ ...prev, [characterId]: 'synced' }));
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [characterId]: '' }));
      }, 3000);
      fetchCharacters();
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, [characterId]: 'error' }));
      alert(`Error syncing assistant: ${err.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [characterId]: false }));
      setSyncingCharacter(null);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleCategorySaved = () => {
    fetchCategories();
    fetchCharacters();
  };

  const handleCharacterSaved = () => {
    fetchCharacters();
  };

  const handlePlatformConfig = (character: any) => {
    setSelectedCharacterForPlatform(character);
    setShowPlatformConfigModal(true);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`h-16 border-b flex items-center px-4 sm:px-6 ${
        darkMode
          ? 'bg-zenible-dark-card border-zenible-dark-border'
          : 'bg-white border-neutral-200'
      }`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'
        }`}>
          AI Characters
        </h1>
      </div>

      {/* Filters and Actions */}
      <CharacterFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        providerFilter={providerFilter}
        onProviderChange={setProviderFilter}
        backendProviders={backendProviders}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        onCreateCategory={handleCreateCategory}
        onManagePlatforms={() => setShowPlatformModal(true)}
        onCreateCharacter={handleCreateCharacter}
        darkMode={darkMode}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <LoadingSpinner height="h-full" />
        ) : error ? (
          <div className="text-red-500 text-center">Error: {error}</div>
        ) : (
          <CharacterTable
            characters={characters}
            categories={categories}
            backendProviders={backendProviders}
            visibleColumns={visibleColumns}
            syncing={syncing}
            onEdit={handleEditCharacter}
            onClone={handleCloneCharacter}
            onDelete={handleDeleteCharacter}
            onSync={handleShowSyncModal}
            onPlatformConfig={handlePlatformConfig}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Character Form Modal */}
      <CharacterFormModal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        character={editingCharacter}
        isCloning={isCloning}
        categories={categories}
        availableModels={availableModels}
        embeddingModels={embeddingModels}
        modelsLoading={modelsLoading}
        availableTools={availableTools}
        toolDefinitions={toolDefinitions}
        shortcodes={shortcodes}
        shortcodesLoading={shortcodesLoading}
        backendProviders={backendProviders}
        onSave={handleCharacterSaved}
        darkMode={darkMode}
      />

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={editingCategory}
        categories={categories}
        onSave={handleCategorySaved}
        darkMode={darkMode}
      />

      {/* Sync Confirmation Modal */}
      {showSyncModal && syncingCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-4 sm:p-6 ${
            darkMode ? 'bg-zenible-dark-card' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
            }`}>
              Sync Assistant
            </h2>

            <div className={`mb-4 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              <p className="mb-2">
                Sync "{syncingCharacter.name}" with OpenAI Assistant API?
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Sync:</strong> Update existing assistant or create if none exists</p>
                <p><strong>Force New:</strong> Delete existing assistant and create a new one</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncingCharacter(null);
                }}
                className={`px-4 py-2 border rounded-lg ${
                  darkMode
                    ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSyncAssistant(syncingCharacter.id, false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sync
              </button>
              <button
                onClick={() => handleSyncAssistant(syncingCharacter.id, true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Force New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Management Modal */}
      <PlatformManagement
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        darkMode={darkMode}
      />

      {/* Character Platform Configuration Modal */}
      {selectedCharacterForPlatform && (
        <CharacterPlatformConfig
          characterId={selectedCharacterForPlatform.id}
          characterName={selectedCharacterForPlatform.name}
          isOpen={showPlatformConfigModal}
          onClose={() => {
            setShowPlatformConfigModal(false);
            setSelectedCharacterForPlatform(null);
          }}
          darkMode={darkMode}
        />
      )}

    </div>
  );
}
