import React from 'react';
import { CharacterFormState, BackendProvider } from './types';
import Combobox from '../../ui/combobox/Combobox';

interface BasicInfoFieldsProps {
  characterForm: CharacterFormState;
  setCharacterForm: React.Dispatch<React.SetStateAction<CharacterFormState>>;
  categories: Array<{ id: string; name: string }>;
  backendProviders: BackendProvider[];
  onProviderChange: (provider: string) => void;
  darkMode: boolean;
}

export default function BasicInfoFields({
  characterForm,
  setCharacterForm,
  categories,
  backendProviders,
  onProviderChange,
  darkMode
}: BasicInfoFieldsProps) {
  return (
    <>
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
        <Combobox
          options={backendProviders.map(provider => ({ id: provider.value, label: `${provider.label} - ${provider.description}` }))}
          value={characterForm.backend_provider}
          onChange={(value) => onProviderChange(value)}
          placeholder="Select provider..."
          allowClear={false}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${
          darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
        }`}>
          Category
        </label>
        <Combobox
          options={Array.isArray(categories) ? categories.map(category => ({ id: category.id, label: category.name })) : []}
          value={characterForm.category_id}
          onChange={(value) => setCharacterForm({...characterForm, category_id: value})}
          placeholder="No Category"
          allowClear
        />
      </div>
    </>
  );
}
