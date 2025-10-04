/**
 * Tool Discovery API Service
 * Fetches available AI tools for characters
 */

const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Get available tools for a character
 * @param {string} characterId - The character UUID
 * @returns {Promise} Character tools response
 */
export const getCharacterTools = async (characterId) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://demo-api.zenible.com';
  const token = getAccessToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/ai/characters/${characterId}/tools`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 404) {
        throw new Error('Character not found or inactive');
      }
      throw new Error(`Failed to fetch character tools: ${response.status}`);
    }

    const data = await response.json();

    console.log('[ToolDiscovery] Character tools fetched:', {
      characterId,
      characterName: data.character_name,
      toolCount: data.available_tools?.length || 0,
      tools: data.available_tools?.map(t => t.name) || []
    });

    return data;
  } catch (error) {
    console.error('[ToolDiscovery] Error fetching character tools:', error);
    throw error;
  }
};

/**
 * Check if a character has a specific tool
 * @param {string} characterId - The character UUID
 * @param {string} toolName - The tool name to check
 * @returns {Promise<boolean>} Whether the character has the tool
 */
export const characterHasTool = async (characterId, toolName) => {
  try {
    const tools = await getCharacterTools(characterId);
    return tools.available_tools?.some(tool =>
      tool.name === toolName && tool.is_enabled
    ) || false;
  } catch (error) {
    console.error('[ToolDiscovery] Error checking tool availability:', error);
    return false;
  }
};

/**
 * Get tool schema for validation
 * @param {string} characterId - The character UUID
 * @param {string} toolName - The tool name
 * @returns {Promise} Tool argument schema or null
 */
export const getToolSchema = async (characterId, toolName) => {
  try {
    const tools = await getCharacterTools(characterId);
    const tool = tools.available_tools?.find(t => t.name === toolName);
    return tool?.argument_schema || null;
  } catch (error) {
    console.error('[ToolDiscovery] Error fetching tool schema:', error);
    return null;
  }
};

/**
 * Validate tool arguments against schema
 * @param {object} schema - The tool argument schema
 * @param {object} args - The arguments to validate
 * @returns {object} Validation result { valid: boolean, errors: array }
 */
export const validateToolArguments = (schema, args) => {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!args[field]) {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }
  }

  // Check field types
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      const value = args[field];

      if (value !== undefined && value !== null) {
        // Type validation
        if (fieldSchema.type === 'string' && typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`
          });
        }

        // Enum validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
          errors.push({
            field,
            message: `${field} must be one of: ${fieldSchema.enum.join(', ')}`
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  getCharacterTools,
  characterHasTool,
  getToolSchema,
  validateToolArguments
};