/**
 * Utility functions for JSON Schema validation and formatting
 */

/**
 * Validate a JSON Schema object
 * @param {Object} schema - The schema to validate
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 */
export function validateJSONSchema(schema) {
  const errors = [];
  const warnings = [];

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema must be a valid object');
    return { isValid: false, errors, warnings };
  }

  // Check for required top-level properties
  if (!schema.type) {
    errors.push('Schema must have a "type" property');
  }

  // Validate based on type
  switch (schema.type) {
    case 'object':
      if (!schema.properties) {
        warnings.push('Object schemas should have a "properties" field');
      } else {
        // Validate properties
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (!propSchema.type) {
            warnings.push(`Property "${propName}" should have a type`);
          }
          if (!propSchema.description) {
            warnings.push(`Property "${propName}" should have a description`);
          }
        }
      }
      break;

    case 'array':
      if (!schema.items) {
        warnings.push('Array schemas should have an "items" property');
      }
      break;

    case 'string':
      if (schema.enum && !Array.isArray(schema.enum)) {
        errors.push('Enum values must be an array');
      }
      break;

    case 'number':
    case 'integer':
      if (schema.minimum !== undefined && schema.maximum !== undefined) {
        if (schema.minimum > schema.maximum) {
          errors.push('Minimum value cannot be greater than maximum value');
        }
      }
      break;
  }

  // Check for required fields
  if (schema.required && !Array.isArray(schema.required)) {
    errors.push('Required field must be an array');
  }

  // Check for unknown/deprecated fields
  const knownFields = [
    'type', 'properties', 'required', 'items', 'description', 'default',
    'enum', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern',
    'format', 'title', 'examples', 'additionalProperties'
  ];

  const unknownFields = Object.keys(schema).filter(key => !knownFields.includes(key));
  if (unknownFields.length > 0) {
    warnings.push(`Unknown fields detected: ${unknownFields.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format JSON Schema with proper indentation
 * @param {Object} schema - The schema to format
 * @returns {string} Formatted JSON string
 */
export function formatJSONSchema(schema) {
  try {
    return JSON.stringify(schema, null, 2);
  } catch {
    return 'Invalid JSON';
  }
}

/**
 * Parse and validate JSON Schema from string
 * @param {string} schemaString - JSON string to parse
 * @returns {Object} { schema: Object|null, error: string|null }
 */
export function parseJSONSchema(schemaString) {
  try {
    const schema = JSON.parse(schemaString);
    return { schema, error: null };
  } catch (error) {
    return { schema: null, error: error.message };
  }
}

/**
 * Get common JSON Schema templates
 * @returns {Object} Object containing schema templates
 */
export function getSchemaTemplates() {
  return {
    simple: {
      name: 'Simple Input',
      schema: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "The input text to process"
          }
        },
        required: ["input"]
      }
    },

    analysis: {
      name: 'Text Analysis',
      schema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to analyze"
          },
          options: {
            type: "object",
            properties: {
              include_sentiment: {
                type: "boolean",
                default: false,
                description: "Include sentiment analysis"
              },
              include_keywords: {
                type: "boolean",
                default: true,
                description: "Include keyword extraction"
              }
            }
          }
        },
        required: ["text"]
      }
    },

    translation: {
      name: 'Translation Tool',
      schema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to translate"
          },
          target_language: {
            type: "string",
            enum: ["spanish", "french", "german", "italian", "chinese"],
            description: "Target language for translation"
          },
          source_language: {
            type: "string",
            default: "english",
            description: "Source language (auto-detect if not specified)"
          }
        },
        required: ["text", "target_language"]
      }
    },

    fileProcessor: {
      name: 'File Processor',
      schema: {
        type: "object",
        properties: {
          file_url: {
            type: "string",
            format: "uri",
            description: "URL of the file to process"
          },
          operation: {
            type: "string",
            enum: ["extract_text", "summarize", "analyze"],
            description: "Operation to perform on the file"
          },
          format: {
            type: "string",
            enum: ["json", "text", "markdown"],
            default: "text",
            description: "Output format"
          }
        },
        required: ["file_url", "operation"]
      }
    },

    apiCall: {
      name: 'API Call',
      schema: {
        type: "object",
        properties: {
          endpoint: {
            type: "string",
            format: "uri",
            description: "API endpoint URL"
          },
          method: {
            type: "string",
            enum: ["GET", "POST", "PUT", "DELETE"],
            default: "GET",
            description: "HTTP method"
          },
          headers: {
            type: "object",
            description: "HTTP headers to include"
          },
          body: {
            type: "object",
            description: "Request body for POST/PUT requests"
          }
        },
        required: ["endpoint"]
      }
    }
  };
}

/**
 * Extract field information from a schema for display
 * @param {Object} schema - The schema to analyze
 * @returns {Object} { totalFields: number, requiredFields: string[], optionalFields: string[] }
 */
export function getSchemaFieldInfo(schema) {
  if (!schema || !schema.properties) {
    return { totalFields: 0, requiredFields: [], optionalFields: [] };
  }

  const allFields = Object.keys(schema.properties);
  const requiredFields = schema.required || [];
  const optionalFields = allFields.filter(field => !requiredFields.includes(field));

  return {
    totalFields: allFields.length,
    requiredFields,
    optionalFields
  };
}