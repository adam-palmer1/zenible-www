import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import PlatformManagement from './PlatformManagement';
import CharacterPlatformConfig from './CharacterPlatformConfig';

export default function AICharacterManagement() {
  const { darkMode } = useOutletContext();
  const [characters, setCharacters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // OpenAI Models state
  const [availableModels, setAvailableModels] = useState([]);
  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Available Tools state
  const [availableTools, setAvailableTools] = useState([]);
  const [setToolsLoading] = useState(false);

  // Modal states
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showPlatformConfigModal, setShowPlatformConfigModal] = useState(false);
  const [selectedCharacterForPlatform, setSelectedCharacterForPlatform] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [syncingCharacter, setSyncingCharacter] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isCloning, setIsCloning] = useState(false);

  // Filter and search states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sync status
  const [setSyncStatus] = useState({});
  const [syncing, setSyncing] = useState({});

  // Field selector states
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    category: true,
    model: true,
    status: true,
    actions: true
  });

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
      json_schema: null,
      max_tokens: 2000,
      // Assistant-specific
      enable_code_interpreter: false,
      enable_file_search: false,
      custom_functions: [],
      // RAG-specific
      embedding_model: 'text-embedding-3-large',
      chunk_size: 1024,
      chunk_overlap: 100,
      vector_store_id: null
    },
    category_id: '',
    is_active: true,
    avatar_url: ''
  });

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  // Form states for category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 1
  });

  // Custom functions state
  const [customFunctions, setCustomFunctions] = useState([]);

  // Shortcodes state
  const [shortcodes, setShortcodes] = useState([]);
  const [shortcodesLoading, setShortcodesLoading] = useState(false);

  // Available options
  const backendProviders = [
    { value: 'openai_chat', label: 'OpenAI Chat', description: 'Simple Q&A, basic conversations' },
    { value: 'openai_assistant', label: 'OpenAI Assistant', description: 'Complex tasks with tools' },
    { value: 'openai_rag', label: 'OpenAI RAG', description: 'Document-based Q&A' }
  ];

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

  const availableColumns = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'model', label: 'Model' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  useEffect(() => {
    fetchCharacters();
    fetchCategories();
    fetchOpenAIModels(); // Fetch models on component mount
    fetchOpenAITools(); // Fetch available tools on component mount
  }, [search, categoryFilter, providerFilter, statusFilter]);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('aiCharactersVisibleColumns');
    if (savedColumns) {
      try {
        setVisibleColumns(JSON.parse(savedColumns));
      } catch (err) {
        console.error('Error loading column preferences:', err);
      }
    }
  }, []);

  // Save column preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aiCharactersVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFieldSelector && !event.target.closest('.field-selector-container')) {
        setShowFieldSelector(false);
      }
      if (showCategoryDropdown && !event.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (showProviderDropdown && !event.target.closest('.provider-dropdown-container')) {
        setShowProviderDropdown(false);
      }
      if (showStatusDropdown && !event.target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
      if (actionDropdown && !event.target.closest('.action-dropdown-container')) {
        setActionDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFieldSelector, showCategoryDropdown, showProviderDropdown, showStatusDropdown, actionDropdown]);

  // Handle escape key for character modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showCharacterModal) {
        setShowCharacterModal(false);
        setModalError(null);
      }
    };

    if (showCharacterModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showCharacterModal]);

  // Fetch shortcodes when modal opens with OpenAI Chat provider
  useEffect(() => {
    if (showCharacterModal && characterForm.backend_provider === 'openai_chat' && shortcodes.length === 0) {
      fetchShortcodes();
    }
  }, [showCharacterModal, characterForm.backend_provider]);

  const fetchOpenAIModels = async () => {
    setModelsLoading(true);
    try {
      const response = await adminAPI.getOpenAIModels({
        is_active: true,
        per_page: 100
      });

      // Separate chat models and embedding models
      const chatModels = [];
      const embedModels = [];

      if (response.models && Array.isArray(response.models)) {
        response.models.forEach(model => {
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
    } catch (err) {
      console.error('Failed to fetch OpenAI models:', err);
      // Set some fallback models if API fails
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

  // Store original tool definitions from backend
  const [toolDefinitions, setToolDefinitions] = useState({});

  const fetchOpenAITools = async () => {
    console.log('=== fetchOpenAITools called ===');
    setToolsLoading(true);
    try {
      const response = await adminAPI.getOpenAITools();
      console.log('Tools API raw response:', response);
      console.log('Response type:', typeof response);
      console.log('Is Array?', Array.isArray(response));

      // Transform the backend response to the format needed by the UI
      const tools = [];
      const definitions = {};

      // The response is directly an array of tools
      if (Array.isArray(response)) {
        console.log('Processing', response.length, 'tools from response');
        response.forEach((tool, index) => {
          const toolName = tool.function.name;

          // Store the full definition
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
          console.log(`Tool ${index}:`, transformedTool.value, '- enabled:', transformedTool.enabled);
        });
      } else {
        console.warn('Response is not an array:', response);
      }

      console.log('Setting availableTools state with', tools.length, 'tools');
      console.log('Transformed tools:', tools);
      setAvailableTools(tools);
      setToolDefinitions(definitions);
    } catch (err) {
      console.error('Failed to fetch OpenAI tools:', err);
      console.error('Error details:', err.message, err.stack);
      // Set some fallback tools if API fails
      const fallbackTools = [
        { value: 'calculate', label: 'Calculator', description: 'Mathematical calculations', enabled: true, category: 'general' }
      ];
      console.log('Using fallback tools:', fallbackTools);
      setAvailableTools(fallbackTools);
      setToolDefinitions({});
    } finally {
      setToolsLoading(false);
      console.log('=== fetchOpenAITools completed ===');
    }
  };

  const fetchShortcodes = async () => {
    setShortcodesLoading(true);
    try {
      const response = await adminAPI.getAICharacterShortcodes();
      if (response && Array.isArray(response.shortcodes)) {
        setShortcodes(response.shortcodes);
      } else {
        setShortcodes([]);
      }
    } catch (err) {
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
      const params = {
        ...(search && { search }),
        ...(categoryFilter && { category_id: categoryFilter }),
        ...(providerFilter && { backend_provider: providerFilter }),
        ...(statusFilter !== '' && { is_active: statusFilter === 'active' })
      };

      const response = await adminAPI.getAICharacters(params);
      // Ensure characters is always an array - check for different response structures
      if (Array.isArray(response)) {
        setCharacters(response);
      } else if (response && Array.isArray(response.characters)) {
        setCharacters(response.characters);
      } else if (response && Array.isArray(response.items)) {
        setCharacters(response.items);
      } else {
        setCharacters([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching AI characters:', err);
      setCharacters([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getAICharacterCategories();
      // Ensure categories is always an array - check for different response structures
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && Array.isArray(response.items)) {
        setCategories(response.items);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]); // Set to empty array on error
    }
  };

  const handleProviderChange = (provider) => {
    setCharacterForm(prev => ({
      ...prev,
      backend_provider: provider,
      metadata: {
        ...prev.metadata,
        // Reset provider-specific fields
        enable_code_interpreter: provider === 'openai_assistant',
        enable_file_search: provider === 'openai_rag' || provider === 'openai_assistant',
        custom_functions: provider === 'openai_assistant' ? prev.metadata.custom_functions : []
      }
    }));
  };

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setIsCloning(false);
    setCustomFunctions([]);

    // Reset avatar states
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
      is_active: true
    });
    setShowCharacterModal(true);
  };

  const handleEditCharacter = (_character) => {
    console.log('=== handleEditCharacter called ===');
    console.log('Character data:', character);
    console.log('Backend provider:', character.backend_provider);
    console.log('Current availableTools state:', availableTools);

    setEditingCharacter(character);
    setIsCloning(false);
    setCustomFunctions(character.metadata?.custom_functions || []);

    // Set current avatar if exists
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
      is_active: character.is_active !== false
    });

    console.log('Character form backend_provider set to:', character.backend_provider || 'openai_chat');
    console.log('Character existing tools:', character.metadata?.tools || []);
    setShowCharacterModal(true);
  };

  const handleCloneCharacter = (_character) => {
    console.log('=== handleCloneCharacter called ===');
    console.log('Cloning character:', character);

    // Set to null to indicate this is a new character (not an edit)
    setEditingCharacter(null);
    setIsCloning(true); // Mark that we're cloning

    // Clone all the custom functions
    setCustomFunctions(character.metadata?.custom_functions || []);

    // Don't clone the avatar - let user upload new one for the clone
    setCurrentAvatar(null);
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(null);

    // Set form with all data from the character being cloned
    // But with a modified name to indicate it's a copy
    setCharacterForm({
      name: `${character.name} (Copy)`,
      internal_name: `${character.internal_name}_copy_${Date.now()}`, // Add timestamp to ensure uniqueness
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
      is_active: true // Default to active for new cloned character
    });

    console.log('Character form set for clone');
    setShowCharacterModal(true);
  };

  const handleSaveCharacter = async () => {
    setModalError(null);
    try {
      // Validate internal_name format
      const internalNameRegex = /^[a-z0-9_-]+$/;
      if (!internalNameRegex.test(characterForm.internal_name)) {
        setModalError('Internal name must be lowercase with only letters, numbers, hyphens, and underscores');
        return;
      }

      // Prepare the data - custom functions now include both user-defined and backend tools
      const data = {
        ...characterForm,
        metadata: {
          ...characterForm.metadata,
          custom_functions: customFunctions
        },
        category_id: characterForm.category_id || null
      };

      let characterId;
      if (editingCharacter) {
        await adminAPI.updateAICharacter(editingCharacter.id, data);
        characterId = editingCharacter.id;
      } else {
        const response = await adminAPI.createAICharacter(data);
        characterId = response.id;
      }

      // Upload avatar if a new file was selected
      if (avatarFile && characterId) {
        await handleAvatarUpload(characterId);
      }

      setShowCharacterModal(false);
      setIsCloning(false);
      fetchCharacters();
      setModalError(null);
    } catch (err) {
      // Parse validation errors if available
      if (err.response?.detail) {
        const detail = err.response.detail;
        if (Array.isArray(detail)) {
          // Format validation errors
          const errors = detail.map(error => {
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

  // Avatar upload handlers
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous errors
    setAvatarError(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      e.target.value = '';
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setAvatarFile(file);
  };

  const handleAvatarUpload = async (characterId) => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      await adminAPI.uploadAICharacterAvatar(characterId, avatarFile);
      // Avatar uploaded successfully
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      throw new Error('Failed to upload avatar: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    // If we have a preview (new file selected), just clear it
    if (avatarPreview) {
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // If we have an existing avatar on an edited character, delete from server
    if (currentAvatar && editingCharacter) {
      if (!confirm('Are you sure you want to delete this avatar?')) {
        return;
      }

      try {
        await adminAPI.deleteAICharacterAvatar(editingCharacter.id);
        setCurrentAvatar(null);
        setCharacterForm({ ...characterForm, avatar_url: '' });
        fetchCharacters(); // Refresh the list to update avatar display
      } catch (err) {
        console.error('Failed to delete avatar:', err);
        setAvatarError('Failed to delete avatar: ' + err.message);
      }
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    if (confirm('Are you sure you want to archive this character? It will be marked as inactive.')) {
      try {
        await adminAPI.deleteAICharacter(characterId);
        fetchCharacters();
      } catch (err) {
        alert(`Error archiving character: ${err.message}`);
      }
    }
  };

  const handleShowSyncModal = (_character) => {
    setSyncingCharacter(character);
    setShowSyncModal(true);
  };

  const handleSyncAssistant = async (characterId, force = false) => {
    setSyncing(prev => ({ ...prev, [characterId]: true }));
    setSyncStatus(prev => ({ ...prev, [characterId]: 'syncing' }));
    setShowSyncModal(false);

    try {
      await adminAPI.syncAICharacterWithAssistant(characterId, force);
      setSyncStatus(prev => ({ ...prev, [characterId]: 'synced' }));
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [characterId]: '' }));
      }, 3000);
      fetchCharacters(); // Refresh to get updated assistant ID
    } catch (err) {
      setSyncStatus(prev => ({ ...prev, [characterId]: 'error' }));
      alert(`Error syncing assistant: ${err.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [characterId]: false }));
      setSyncingCharacter(null);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      display_order: 1
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      display_order: category.display_order || 1
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await adminAPI.updateAICharacterCategory(editingCategory.id, categoryForm);
      } else {
        await adminAPI.createAICharacterCategory(categoryForm);
      }

      setShowCategoryModal(false);
      fetchCategories();
      fetchCharacters(); // Refresh characters to show updated category
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await adminAPI.deleteAICharacterCategory(categoryId);
        fetchCategories();
        fetchCharacters();
      } catch (err) {
        alert(`Error deleting category: ${err.message}`);
      }
    }
  };

  const getCategoryName = (categoryId) => {
    if (!Array.isArray(categories)) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
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

  const updateCustomFunction = (index, updatedFunction) => {
    const newFunctions = [...customFunctions];
    newFunctions[index] = updatedFunction;
    setCustomFunctions(newFunctions);
  };

  const removeCustomFunction = (index) => {
    setCustomFunctions(customFunctions.filter((_, i) => i !== index));
  };

  const getProviderBadgeColor = (provider) => {
    switch (provider) {
      case 'openai_assistant':
        return 'bg-blue-100 text-blue-800';
      case 'openai_rag':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`h-16 border-b flex items-center px-6 ${
        darkMode
          ? 'bg-zenible-dark-card border-zenible-dark-border'
          : 'bg-white border-neutral-200'
      }`}>
        <h1 className={`text-2xl font-semibold ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'
        }`}>
          AI Characters
        </h1>
      </div>

      {/* Filters and Actions */}
      <div className={`p-4 border-b ${
        darkMode
          ? 'bg-zenible-dark-bg border-zenible-dark-border'
          : 'bg-gray-50 border-neutral-200'
      }`}>
        {/* First row - Search bar */}
        <div className="flex flex-wrap gap-3 mb-3">
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border flex-1 min-w-[200px] ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-neutral-300 text-gray-900'
            }`}
          />
        </div>

        {/* Second row - Filter and action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Categories Filter */}
          <div className="relative category-dropdown-container">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories {categoryFilter && '•'}
            </button>

            {showCategoryDropdown && (
              <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  <h3 className={`text-sm font-medium mb-3 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}>
                    Filter by Category
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={categoryFilter === ''}
                        onChange={() => setCategoryFilter('')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        All Categories
                      </span>
                    </label>
                    {Array.isArray(categories) && categories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          checked={categoryFilter === category.id}
                          onChange={() => setCategoryFilter(category.id)}
                          className="mr-2"
                        />
                        <span className={`text-sm ${
                          darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                        }`}>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Providers Filter */}
          <div className="relative provider-dropdown-container">
            <button
              onClick={() => setShowProviderDropdown(!showProviderDropdown)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Providers {providerFilter && '•'}
            </button>

            {showProviderDropdown && (
              <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  <h3 className={`text-sm font-medium mb-3 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}>
                    Filter by Provider
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={providerFilter === ''}
                        onChange={() => setProviderFilter('')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        All Providers
                      </span>
                    </label>
                    {backendProviders.map(provider => (
                      <label key={provider.value} className="flex items-center">
                        <input
                          type="radio"
                          checked={providerFilter === provider.value}
                          onChange={() => setProviderFilter(provider.value)}
                          className="mr-2"
                        />
                        <span className={`text-sm ${
                          darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                        }`}>
                          {provider.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative status-dropdown-container">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status {statusFilter && '•'}
            </button>

            {showStatusDropdown && (
              <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  <h3 className={`text-sm font-medium mb-3 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}>
                    Filter by Status
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={statusFilter === ''}
                        onChange={() => setStatusFilter('')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        All Status
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={statusFilter === 'active'}
                        onChange={() => setStatusFilter('active')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        Active
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={statusFilter === 'inactive'}
                        onChange={() => setStatusFilter('inactive')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        Inactive
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columns Selector */}
          <div className="relative field-selector-container">
            <button
              onClick={() => setShowFieldSelector(!showFieldSelector)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Columns
            </button>

              {showFieldSelector && (
                <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? 'bg-zenible-dark-card border-zenible-dark-border'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-4">
                    <h3 className={`text-sm font-medium mb-3 ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                    }`}>
                      Show/Hide Columns
                    </h3>
                    <div className="space-y-2">
                      {availableColumns.map(column => (
                        <label key={column.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key]}
                            onChange={() => toggleColumnVisibility(column.key)}
                            className="mr-2 rounded"
                          />
                          <span className={`text-sm ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                          }`}>
                            {column.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          <button
            onClick={handleCreateCategory}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
            }`}
          >
            Manage Categories
          </button>

          <button
            onClick={() => setShowPlatformModal(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
            }`}
          >
            Manage Platforms
          </button>

          <button
            onClick={handleCreateCharacter}
            className="px-3 py-1.5 bg-zenible-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            Create Character
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">Error: {error}</div>
        ) : (
          <div className={`rounded-lg overflow-visible ${
            darkMode ? 'bg-zenible-dark-card' : 'bg-white'
          }`}>
            <table className="w-full">
              <thead className={`${
                darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'
              } border-b ${
                darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
              }`}>
                <tr>
                  {visibleColumns.name && (
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Name
                    </th>
                  )}
                  {visibleColumns.category && (
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Category
                    </th>
                  )}
                  {visibleColumns.model && (
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Model
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>

                    </th>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'
              }`}>
                {Array.isArray(characters) && characters.map((_character) => (
                  <tr key={character.id} className={`${
                    darkMode ? 'hover:bg-zenible-dark-bg' : 'hover:bg-gray-50'
                  } transition-colors`}>
                    {visibleColumns.name && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {character.avatar_url ? (
                              <img
                                src={character.avatar_url}
                                alt={`${character.name} avatar`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                darkMode ? 'bg-zenible-dark-bg border-2 border-zenible-dark-border' : 'bg-gray-100 border-2 border-gray-200'
                              }`}>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Name and description */}
                          <div>
                            <div className={`text-sm font-medium ${
                              darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                            }`}>
                              {character.name} <span className="font-normal text-gray-500">({character.internal_name})</span>
                            </div>
                            <div className={`text-sm ${
                              darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                            }`}>
                              {character.description?.substring(0, 50)}
                              {character.description?.length > 50 && '...'}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                          }`}>
                            {backendProviders.find(p => p.value === character.backend_provider)?.label || character.backend_provider}
                          </div>
                          <div className={`text-sm ${
                            darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                          }`}>
                            {getCategoryName(character.category_id)}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.model && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`text-sm font-mono ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                          }`}>
                            {character.metadata?.model || 'N/A'}
                          </span>
                          {character.backend_provider === 'openai_assistant' && (
                            <div className="mt-1">
                              {character.openai_assistant_id ? (
                                <span className={`text-xs font-mono ${
                                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                                }`}>
                                  {character.openai_assistant_id.substring(0, 12)}...
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Not synced</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          character.is_active
                            ? darkMode
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-purple-100 text-purple-800'
                            : darkMode
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {character.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm relative">
                        <div className="relative inline-block text-left action-dropdown-container">
                          <button
                            onClick={() => setActionDropdown(actionDropdown === character.id ? null : character.id)}
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-zenible-dark-bg ${
                              darkMode ? 'text-zenible-dark-text' : 'text-gray-500'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {actionDropdown === character.id && (
                            <div className={`absolute right-0 mt-2 z-50 w-48 rounded-md shadow-lg ${
                              darkMode ? 'bg-zenible-dark-card' : 'bg-white'
                            } ring-1 ring-black ring-opacity-5`}>
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleEditCharacter(character);
                                    setActionDropdown(null);
                                  }}
                                  className={`block px-4 py-2 text-sm w-full text-left ${
                                    darkMode
                                      ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleCloneCharacter(character);
                                    setActionDropdown(null);
                                  }}
                                  className={`block px-4 py-2 text-sm w-full text-left ${
                                    darkMode
                                      ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Clone
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCharacterForPlatform(character);
                                    setShowPlatformConfigModal(true);
                                    setActionDropdown(null);
                                  }}
                                  className={`block px-4 py-2 text-sm w-full text-left ${
                                    darkMode
                                      ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Platform Config
                                </button>
                                {character.backend_provider === 'openai_assistant' && (
                                  <button
                                    onClick={() => {
                                      handleShowSyncModal(character);
                                      setActionDropdown(null);
                                    }}
                                    disabled={syncing[character.id]}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                      syncing[character.id]
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : darkMode
                                        ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    {syncing[character.id] ? 'Syncing...' : 'Sync Assistant'}
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleDeleteCharacter(character.id);
                                    setActionDropdown(null);
                                  }}
                                  className={`block px-4 py-2 text-sm w-full text-left ${
                                    darkMode
                                      ? 'text-red-400 hover:bg-zenible-dark-bg'
                                      : 'text-red-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Archive
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {(!Array.isArray(characters) || characters.length === 0) && (
              <div className={`text-center py-8 ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
              }`}>
                No AI characters found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character Modal */}
      {showCharacterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg p-6 ${
            darkMode ? 'bg-zenible-dark-card' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
              }`}>
                {editingCharacter ? 'Edit Character' : (isCloning ? 'Clone Character' : 'Create New Character')}
              </h2>
              <button
                onClick={() => {
                  setShowCharacterModal(false);
                  setModalError(null);
                }}
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
                          src={avatarPreview || currentAvatar}
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
                  rows="3"
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
                      delete newMetadata.json_schema;
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
                      } catch (err) {
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
                  rows="6"
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
                                    // Add the tool as a custom function
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
                                  rows="2"
                                />
                                <textarea
                                  value={JSON.stringify(func.parameters, null, 2)}
                                  disabled
                                  className={`w-full px-2 py-1 border rounded font-mono text-xs opacity-75 ${
                                    darkMode
                                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                                      : 'bg-gray-100 border-gray-300 text-gray-600'
                                  }`}
                                  rows="4"
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
                                  rows="2"
                                />
                                <textarea
                                  placeholder='Parameters JSON (e.g., {"type": "object", "properties": {...}})'
                                  value={JSON.stringify(func.parameters, null, 2)}
                                  onChange={(e) => {
                                    try {
                                      const params = JSON.parse(e.target.value);
                                      updateCustomFunction(index, {...func, parameters: params});
                                    } catch (err) {
                                      // Invalid JSON, just update the string for now
                                    }
                                  }}
                                  className={`w-full px-2 py-1 border rounded font-mono text-xs ${
                                    darkMode
                                      ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  rows="4"
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
                onClick={() => {
                  setShowCharacterModal(false);
                  setModalError(null);
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
                onClick={handleSaveCharacter}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
              >
                {editingCharacter ? 'Update' : 'Create'} Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-lg w-full rounded-lg p-6 ${
            darkMode ? 'bg-zenible-dark-card' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
            }`}>
              Manage Categories
            </h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Customer Service"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}>
                  Description
                </label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({...categoryForm, display_order: parseInt(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  min="1"
                />
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}>
                  Existing Categories
                </h3>
                <div className={`border rounded-lg divide-y ${
                  darkMode
                    ? 'border-zenible-dark-border divide-zenible-dark-border'
                    : 'border-gray-200 divide-gray-200'
                }`}>
                  {Array.isArray(categories) && categories.sort((a, b) => a.display_order - b.display_order).map(category => (
                    <div key={category.id} className="flex items-center justify-between p-2">
                      <div>
                        <div className={`text-sm font-medium ${
                          darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                        }`}>
                          {category.name}
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}>
                          {category.description}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className={`text-sm ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className={`text-sm ${
                            darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className={`px-4 py-2 border rounded-lg ${
                  darkMode
                    ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Close
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
              >
                {editingCategory ? 'Update' : 'Create'} Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Confirmation Modal */}
      {showSyncModal && syncingCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
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