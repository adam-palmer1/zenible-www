import React from 'react';
import { CharacterFormState, CustomFunction, SelectOption, ToolDefinition } from './types';

interface AssistantConfigSectionProps {
  characterForm: CharacterFormState;
  setCharacterForm: React.Dispatch<React.SetStateAction<CharacterFormState>>;
  customFunctions: CustomFunction[];
  setCustomFunctions: React.Dispatch<React.SetStateAction<CustomFunction[]>>;
  availableTools: SelectOption[];
  toolDefinitions: Record<string, ToolDefinition>;
  darkMode: boolean;
}

export default function AssistantConfigSection({
  characterForm,
  setCharacterForm,
  customFunctions,
  setCustomFunctions,
  availableTools,
  toolDefinitions,
  darkMode
}: AssistantConfigSectionProps) {
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

  const updateCustomFunction = (index: number, updatedFunction: CustomFunction) => {
    const newFunctions = [...customFunctions];
    newFunctions[index] = updatedFunction;
    setCustomFunctions(newFunctions);
  };

  const removeCustomFunction = (index: number) => {
    setCustomFunctions(customFunctions.filter((_: CustomFunction, i: number) => i !== index));
  };

  if (characterForm.backend_provider !== 'openai_assistant') return null;

  return (
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
                        } catch (_err: any) {
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
  );
}
