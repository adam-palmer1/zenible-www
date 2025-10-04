import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { validateJSONSchema, parseJSONSchema, getSchemaTemplates } from '../../utils/schemaValidation';

export default function AIToolModal({ tool, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    argument_schema: {},
    is_active: true
  });
  const [schemaText, setSchemaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schemaError, setSchemaError] = useState(null);

  // Default schema template
  const defaultSchema = {
    type: "object",
    properties: {
      example_field: {
        type: "string",
        description: "Description of this field"
      }
    },
    required: ["example_field"]
  };

  useEffect(() => {
    if (tool) {
      // Editing existing tool
      setFormData({
        name: tool.name || '',
        description: tool.description || '',
        argument_schema: tool.argument_schema || defaultSchema,
        is_active: tool.is_active !== undefined ? tool.is_active : true
      });
      setSchemaText(JSON.stringify(tool.argument_schema || defaultSchema, null, 2));
    } else {
      // Creating new tool
      setFormData({
        name: '',
        description: '',
        argument_schema: defaultSchema,
        is_active: true
      });
      setSchemaText(JSON.stringify(defaultSchema, null, 2));
    }
  }, [tool]);

  const validateSchema = (schemaStr) => {
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

      setSchemaError(null);
      return parsed;
    } catch (err) {
      setSchemaError(err.message);
      return null;
    }
  };

  const handleSchemaChange = (value) => {
    setSchemaText(value);
    const validSchema = validateSchema(value);
    if (validSchema) {
      setFormData(prev => ({
        ...prev,
        argument_schema: validSchema
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    setLoading(true);
    setError(null);

    // Final schema validation
    const validSchema = validateSchema(schemaText);
    if (!validSchema) {
      console.log('Schema validation failed:', schemaError);
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        argument_schema: validSchema
      };

      console.log('Submitting tool data:', submitData);

      if (tool) {
        // Update existing tool
        console.log('Updating tool:', tool.id);
        await adminAPI.updateAITool(tool.id, submitData);
      } else {
        // Create new tool
        console.log('Creating new tool');
        await adminAPI.createAITool(submitData);
      }

      console.log('Tool saved successfully');
      onSave();
    } catch (err) {
      console.error('Error saving tool:', err);
      setError(err.message || 'Failed to save tool');
    } finally {
      setLoading(false);
    }
  };

  const loadSchemaTemplate = (templateName) => {
    const templates = getSchemaTemplates();
    const template = templates[templateName]?.schema || defaultSchema;

    const templateText = JSON.stringify(template, null, 2);
    setSchemaText(templateText);
    handleSchemaChange(templateText);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {tool ? `Edit Tool: ${tool.name}` : 'Create New AI Tool'}
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
            <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Basic Information</h4>

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
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="Describe what this tool does and when to use it..."
                    />
                  </div>

                  <div>
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

                {/* JSON Schema Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Argument Schema</h4>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => loadSchemaTemplate(e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                        defaultValue=""
                      >
                        <option value="">Load Template...</option>
                        {Object.entries(getSchemaTemplates()).map(([key, template]) => (
                          <option key={key} value={key}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows="12"
                      value={schemaText}
                      onChange={(e) => handleSchemaChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 ${
                        schemaError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-purple'
                      }`}
                      placeholder="Enter JSON Schema..."
                    />
                    {schemaError && (
                      <p className="mt-1 text-xs text-red-600">{schemaError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Valid JSON Schema defining the tool's input parameters
                    </p>
                  </div>

                  {/* Schema Preview */}
                  {!schemaError && formData.argument_schema && (
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
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!schemaError || !formData.name.trim() || !formData.description.trim()}
                className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (tool ? 'Update Tool' : 'Create Tool')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}