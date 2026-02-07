/**
 * Tool Discovery API Service
 * Fetches available AI tools for characters
 */
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ToolSchema {
  required?: string[];
  properties?: Record<string, {
    type?: string;
    enum?: string[];
  }>;
}

interface Tool {
  name: string;
  is_enabled: boolean;
  argument_schema?: ToolSchema;
}

interface CharacterToolsResponse {
  available_tools?: Tool[];
}

const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Get available tools for a character
 */
export const getCharacterTools = async (characterId: string): Promise<CharacterToolsResponse> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/characters/${characterId}/tools?include_questions=true`, {
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

    const data: CharacterToolsResponse = await response.json();

    return data;
  } catch (error) {
    logger.error('[ToolDiscovery] Error fetching character tools:', error);
    throw error;
  }
};

/**
 * Check if a character has a specific tool
 */
export const characterHasTool = async (characterId: string, toolName: string): Promise<boolean> => {
  try {
    const tools = await getCharacterTools(characterId);
    return tools.available_tools?.some(tool =>
      tool.name === toolName && tool.is_enabled
    ) || false;
  } catch (error) {
    logger.error('[ToolDiscovery] Error checking tool availability:', error);
    return false;
  }
};

/**
 * Get tool schema for validation
 */
export const getToolSchema = async (characterId: string, toolName: string): Promise<ToolSchema | null> => {
  try {
    const tools = await getCharacterTools(characterId);
    const tool = tools.available_tools?.find(t => t.name === toolName);
    return tool?.argument_schema || null;
  } catch (error) {
    logger.error('[ToolDiscovery] Error fetching tool schema:', error);
    return null;
  }
};

/**
 * Validate tool arguments against schema
 */
export const validateToolArguments = (schema: ToolSchema, args: Record<string, unknown>): ValidationResult => {
  const errors: ValidationError[] = [];

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
        if (fieldSchema.enum && !fieldSchema.enum.includes(value as string)) {
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
