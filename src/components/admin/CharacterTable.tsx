import React, { useState, useEffect } from 'react';

interface VisibleColumns {
  name: boolean;
  category: boolean;
  model: boolean;
  status: boolean;
  actions: boolean;
}

interface BackendProvider {
  value: string;
  label: string;
  description: string;
}

interface CharacterTableProps {
  characters: any[];
  categories: any[];
  backendProviders: BackendProvider[];
  visibleColumns: VisibleColumns;
  syncing: Record<string, boolean>;
  onEdit: (character: any) => void;
  onClone: (character: any) => void;
  onDelete: (characterId: string) => void;
  onSync: (character: any) => void;
  onPlatformConfig: (character: any) => void;
  darkMode: boolean;
}

export default function CharacterTable({
  characters,
  categories,
  backendProviders,
  visibleColumns,
  syncing,
  onEdit,
  onClone,
  onDelete,
  onSync,
  onPlatformConfig,
  darkMode
}: CharacterTableProps) {
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (actionDropdown && !target.closest('.action-dropdown-container')) {
        setActionDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionDropdown]);

  const getCategoryName = (categoryId: any) => {
    if (!Array.isArray(categories)) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
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
          {Array.isArray(characters) && characters.map((character) => (
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
                              onEdit(character);
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
                              onClone(character);
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
                              onPlatformConfig(character);
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
                                onSync(character);
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
                              onDelete(character.id);
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
  );
}
