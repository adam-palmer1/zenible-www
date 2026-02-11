import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { getSchemaTemplates } from '../../utils/schemaValidation';
import Combobox from '../ui/combobox/Combobox';

interface AIToolModalProps {
  tool: any;
  onClose: () => void;
  onSave: () => void;
  darkMode?: boolean;
}

export default function AIToolModal({ tool, onClose, onSave }: AIToolModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    argument_schema: any;
    response_schema: any;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    argument_schema: {},
    response_schema: {},
    is_active: true
  });
  const [argumentSchemaText, setArgumentSchemaText] = useState('');
  const [responseSchemaText, setResponseSchemaText] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [argumentSchemaError, setArgumentSchemaError] = useState<string | null>(null);
  const [responseSchemaError, setResponseSchemaError] = useState<string | null>(null);

  // Default schema templates
  const defaultArgumentSchema = {
    type: "object",
    properties: {
      example_field: {
        type: "string",
        description: "Description of this field"
      }
    },
    required: ["example_field"]
  };

  const defaultResponseSchema = {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether the operation was successful"
      },
      data: {
        type: "object",
        description: "The result data"
      },
      message: {
        type: "string",
        description: "Human-readable message"
      }
    },
    required: ["success"]
  };

  useEffect(() => {
    if (tool) {
      // Editing existing tool
      setFormData({
        name: tool.name || '',
        description: tool.description || '',
        argument_schema: tool.argument_schema || defaultArgumentSchema,
        response_schema: tool.response_schema || {},
        is_active: tool.is_active !== undefined ? tool.is_active : true
      });
      setArgumentSchemaText(JSON.stringify(tool.argument_schema || defaultArgumentSchema, null, 2));
      setResponseSchemaText(tool.response_schema && Object.keys(tool.response_schema).length > 0
        ? JSON.stringify(tool.response_schema, null, 2)
        : '');
    } else {
      // Creating new tool
      setFormData({
        name: '',
        description: '',
        argument_schema: defaultArgumentSchema,
        response_schema: {},
        is_active: true
      });
      setArgumentSchemaText(JSON.stringify(defaultArgumentSchema, null, 2));
      setResponseSchemaText('');
    }
  }, [tool]);

  const validateArgumentSchema = (schemaStr: string) => {
    try {
      const parsed = JSON.parse(schemaStr);

      // Basic validation for JSON Schema structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Schema must be a valid JSON object');
      }

      if (!parsed.type) {
        throw new Error('Schema must have a "type" property');
      }

      if (parsed.type === 'object' && !parsed.properties) {
        throw new Error('Object schemas must have a "properties" field');
      }

      setArgumentSchemaError(null);
      return parsed;
    } catch (err: unknown) {
      setArgumentSchemaError((err as Error).message);
      return null;
    }
  };

  const validateResponseSchema = (schemaStr: string) => {
    try {
      // Allow empty response schema
      if (!schemaStr.trim()) {
        setResponseSchemaError(null);
        return {};
      }

      const parsed = JSON.parse(schemaStr);

      // Basic validation for JSON Schema structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Schema must be a valid JSON object');
      }

      // Check if this is wrapped in a template format (with name and schema properties)
      let actualSchema = parsed;
      if (parsed.schema && typeof parsed.schema === 'object') {
        // Extract the actual schema from the template wrapper
        actualSchema = parsed.schema;
      }

      if (!actualSchema.type) {
        throw new Error('Schema must have a "type" property');
      }

      if (actualSchema.type === 'object' && !actualSchema.properties) {
        throw new Error('Object schemas must have a "properties" field');
      }

      setResponseSchemaError(null);
      return actualSchema; // Return the unwrapped schema
    } catch (err: unknown) {
      setResponseSchemaError((err as Error).message);
      return null;
    }
  };

  const handleArgumentSchemaChange = (value: string) => {
    setArgumentSchemaText(value);
    const validSchema = validateArgumentSchema(value);
    if (validSchema) {
      setFormData(prev => ({
        ...prev,
        argument_schema: validSchema
      }));
    }
  };

  const handleResponseSchemaChange = (value: string) => {
    setResponseSchemaText(value);
    const validSchema = validateResponseSchema(value);
    if (validSchema !== null) {
      setFormData(prev => ({
        ...prev,
        response_schema: validSchema
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Final schema validation
    const validArgumentSchema = validateArgumentSchema(argumentSchemaText);
    if (!validArgumentSchema) {
      setLoading(false);
      return;
    }

    const validResponseSchema = validateResponseSchema(responseSchemaText);
    if (validResponseSchema === null) {
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        argument_schema: validArgumentSchema,
        response_schema: validResponseSchema
      };


      if (tool && tool.id) {
        // Update existing tool
        await adminAPI.updateAITool(tool.id, submitData);
      } else {
        // Create new tool
        await adminAPI.createAITool(submitData);
      }
      onSave();
    } catch (err) {
      console.error('Error saving tool:', err);
      setError((err as Error).message || 'Failed to save tool');
    } finally {
      setLoading(false);
    }
  };

  const loadArgumentSchemaTemplate = (templateName: string) => {
    const templates = getSchemaTemplates();
    const template = templates[templateName]?.schema || defaultArgumentSchema;

    const templateText = JSON.stringify(template, null, 2);
    setArgumentSchemaText(templateText);
    handleArgumentSchemaChange(templateText);
  };

  const loadResponseSchemaTemplate = (templateName: string) => {
    const templates = getSchemaTemplates();
    const template = templates[templateName]?.responseSchema || defaultResponseSchema;

    const templateText = JSON.stringify(template, null, 2);
    setResponseSchemaText(templateText);
    handleResponseSchemaChange(templateText);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {tool && tool.id ? `Edit Tool: ${tool.name}` : tool ? `Clone Tool: ${tool.name}` : 'Create New AI Tool'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white px-4 sm:px-6 py-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Basic Information Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tool Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="e.g., analyze_proposal"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be unique and contain only letters, numbers, and underscores
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="Describe what this tool does and when to use it..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Tool is active</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Inactive tools cannot be assigned to characters
                  </p>
                </div>
              </div>

              {/* Schema Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Argument Schema Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Argument Schema *</h4>
                    <div className="flex gap-2">
                      <Combobox
                        options={Object.entries(getSchemaTemplates()).map(([key, template]) => ({ id: key, label: template.name }))}
                        value=""
                        onChange={(value) => { if (value) loadArgumentSchemaTemplate(value); }}
                        placeholder="Load Template..."
                        allowClear={false}
                        className="w-48"
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={12}
                      value={argumentSchemaText}
                      onChange={(e) => handleArgumentSchemaChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 ${
                        argumentSchemaError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-purple'
                      }`}
                      placeholder="Enter JSON Schema..."
                    />
                    {argumentSchemaError && (
                      <p className="mt-1 text-xs text-red-600">{argumentSchemaError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Valid JSON Schema defining the tool's input parameters
                    </p>
                  </div>

                  {/* Argument Schema Preview */}
                  {!argumentSchemaError && formData.argument_schema && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Schema Summary:</h5>
                      <div className="text-xs text-gray-600">
                        <div>Type: {formData.argument_schema.type}</div>
                        {formData.argument_schema.properties && (
                          <div>
                            Fields: {Object.keys(formData.argument_schema.properties).join(', ')}
                          </div>
                        )}
                        {formData.argument_schema.required && (
                          <div>
                            Required: {formData.argument_schema.required.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Response Schema Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Response Schema</h4>
                    <div className="flex gap-2">
                      <Combobox
                        options={Object.entries(getSchemaTemplates()).map(([key, template]) => ({ id: key, label: template.name }))}
                        value=""
                        onChange={(value) => { if (value) loadResponseSchemaTemplate(value); }}
                        placeholder="Load Template..."
                        allowClear={false}
                        className="w-48"
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={12}
                      value={responseSchemaText}
                      onChange={(e) => handleResponseSchemaChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 ${
                        responseSchemaError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-purple'
                      }`}
                      placeholder="Enter JSON Schema (optional)...
Example:
{
  &quot;type&quot;: &quot;object&quot;,
  &quot;properties&quot;: {
    &quot;success&quot;: { &quot;type&quot;: &quot;boolean&quot; },
    &quot;data&quot;: { &quot;type&quot;: &quot;object&quot; }
  },
  &quot;required&quot;: [&quot;success&quot;]
}"
                    />
                    {responseSchemaError && (
                      <p className="mt-1 text-xs text-red-600">{responseSchemaError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Optional JSON Schema defining the tool's expected output structure
                    </p>
                  </div>

                  {/* Response Schema Preview */}
                  {!responseSchemaError && formData.response_schema && Object.keys(formData.response_schema).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Response Schema Summary:</h5>
                      <div className="text-xs text-gray-600">
                        <div>Type: {formData.response_schema.type}</div>
                        {formData.response_schema.properties && (
                          <div>
                            Fields: {Object.keys(formData.response_schema.properties).join(', ')}
                          </div>
                        )}
                        {formData.response_schema.required && (
                          <div>
                            Required: {formData.response_schema.required.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!argumentSchemaError || !!responseSchemaError || !formData.name.trim() || !formData.description.trim()}
                className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (tool && tool.id ? 'Update Tool' : 'Create Tool')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}