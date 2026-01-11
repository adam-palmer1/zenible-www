import React from 'react';

/**
 * VariableHelper Component
 *
 * Displays available variables for email templates with click-to-insert functionality
 *
 * @param {Array} variables - List of available variables (can be strings or objects)
 * @param {Function} onInsert - Callback when variable is clicked
 * @param {boolean} loading - Loading state
 * @param {boolean} disabled - Disabled state (e.g., for system templates)
 * @param {string} className - Additional CSS classes
 */
const VariableHelper = ({
  variables = [],
  onInsert,
  loading = false,
  disabled = false,
  className = ''
}) => {
  const handleVariableClick = (variableName) => {
    if (disabled || !onInsert) return;
    onInsert(variableName);
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h3>
        <div className="flex justify-center py-8 border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zenible-primary"></div>
        </div>
      </div>
    );
  }

  if (!variables || variables.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h3>
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No variables available for this template type
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Available Variables
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
        {variables.map((variable, index) => {
          // Handle both string variables and object variables
          let variableName, variableDesc, variableExample;

          if (typeof variable === 'string') {
            // Remove curly brackets if present
            variableName = variable.replace(/[{}]/g, '');
            variableDesc = '';
            variableExample = '';
          } else if (typeof variable === 'object') {
            // Support multiple possible property names from API
            variableName = (variable.variable || variable.name || '').replace(/[{}]/g, '');
            variableDesc = variable.description || '';
            variableExample = variable.example || '';
          }

          // Skip if no valid variable name
          if (!variableName) return null;

          return (
            <div
              key={variableName || index}
              className={`p-3 rounded-lg border transition-colors ${
                disabled
                  ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-zenible-primary cursor-pointer'
              }`}
              onClick={() => handleVariableClick(variableName)}
              title={disabled ? 'Variables cannot be inserted in view mode' : 'Click to insert variable'}
            >
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-zenible-primary dark:text-purple-400 font-semibold">
                  {variableName.includes('{{') ? variableName : `{{${variableName}}}`}
                </code>
                {!disabled && (
                  <svg
                    className="w-4 h-4 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
              </div>

              {variableDesc && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                  {variableDesc}
                </p>
              )}

              {variableExample && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                  Example: {variableExample}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!disabled && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
          💡 Click a variable to insert it at your cursor position
        </p>
      )}
    </div>
  );
};

export default VariableHelper;
