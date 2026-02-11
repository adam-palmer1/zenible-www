import React from 'react';
import { CharacterFormState, SelectOption, responseFormats, schemaTemplates } from './types';
import Combobox from '../../ui/combobox/Combobox';

interface ModelSettingsFieldsProps {
  characterForm: CharacterFormState;
  setCharacterForm: React.Dispatch<React.SetStateAction<CharacterFormState>>;
  availableModels: SelectOption[];
  modelsLoading: boolean;
  setModalError: (error: string | null) => void;
  darkMode: boolean;
}

export default function ModelSettingsFields({
  characterForm,
  setCharacterForm,
  availableModels,
  modelsLoading,
  setModalError,
  darkMode
}: ModelSettingsFieldsProps) {
  return (
    <>
      <div>
        <label className={`block text-sm font-medium mb-1 ${
          darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
        }`}>
          Model
        </label>
        <Combobox
          options={availableModels.map(model => ({ id: model.value, label: model.label }))}
          value={characterForm.metadata.model}
          onChange={(value) => setCharacterForm({
            ...characterForm,
            metadata: {...characterForm.metadata, model: value}
          })}
          placeholder={modelsLoading ? "Loading models..." : "No models available"}
          loading={modelsLoading}
          allowClear={false}
        />
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
        <Combobox
          options={responseFormats.map(format => ({ id: format.value, label: format.label }))}
          value={characterForm.metadata.response_format}
          onChange={(value) => {
            const newMetadata = {...characterForm.metadata, response_format: value};
            // Clear json_schema if not using json_schema format
            if (value !== 'json_schema') {
              newMetadata.json_schema = null;
            }
            setCharacterForm({
              ...characterForm,
              metadata: newMetadata
            });
          }}
          placeholder="Select format..."
          allowClear={false}
        />
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
              } catch (_err: any) {
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
    </>
  );
}
