import React from 'react';
import { CharacterFormState, SelectOption } from './types';

interface RAGConfigSectionProps {
  characterForm: CharacterFormState;
  setCharacterForm: React.Dispatch<React.SetStateAction<CharacterFormState>>;
  embeddingModels: SelectOption[];
  modelsLoading: boolean;
  darkMode: boolean;
}

export default function RAGConfigSection({
  characterForm,
  setCharacterForm,
  embeddingModels,
  modelsLoading,
  darkMode
}: RAGConfigSectionProps) {
  if (characterForm.backend_provider !== 'openai_rag') return null;

  return (
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
  );
}
