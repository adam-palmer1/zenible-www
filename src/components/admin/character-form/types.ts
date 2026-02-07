export interface BackendProvider {
  value: string;
  label: string;
  description: string;
}

export interface JsonSchema {
  name?: string;
  schema?: Record<string, unknown>;
}

export interface CustomFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CharacterMetadata {
  model: string;
  system_instructions: string;
  temperature: number;
  top_p: number;
  response_format: string;
  json_schema: JsonSchema | null;
  max_tokens: number;
  enable_code_interpreter: boolean;
  enable_file_search: boolean;
  custom_functions: CustomFunction[];
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  vector_store_id: string | null;
}

export interface CharacterRecord {
  id: string;
  name: string;
  internal_name: string;
  description?: string | null;
  backend_provider: string;
  metadata?: Partial<CharacterMetadata>;
  category_id?: string | null;
  is_active: boolean;
  avatar_url?: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ToolDefinition {
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ShortcodeItem {
  shortcode: string;
  description: string;
  example?: string;
}

export interface ValidationError {
  loc?: string[];
  msg: string;
}

export interface CharacterFormState {
  name: string;
  internal_name: string;
  description: string;
  backend_provider: string;
  metadata: {
    model: string;
    system_instructions: string;
    temperature: number;
    top_p: number;
    response_format: string;
    json_schema: JsonSchema | null;
    max_tokens: number;
    enable_code_interpreter: boolean;
    enable_file_search: boolean;
    custom_functions: CustomFunction[];
    embedding_model: string;
    chunk_size: number;
    chunk_overlap: number;
    vector_store_id: string | null;
  };
  category_id: string;
  is_active: boolean;
  avatar_url: string;
}

export const responseFormats = [
  { value: 'auto', label: 'Auto' },
  { value: 'text', label: 'Text' },
  { value: 'json_object', label: 'JSON Object' },
  { value: 'json_schema', label: 'JSON Schema' }
];

export const schemaTemplates: Record<string, JsonSchema> = {
  simple: {
    name: "simple_response",
    schema: {
      type: "object",
      properties: {
        answer: { type: "string" }
      },
      required: ["answer"],
      additionalProperties: false
    }
  },
  detailed: {
    name: "detailed_response",
    schema: {
      type: "object",
      properties: {
        answer: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        sources: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["answer"],
      additionalProperties: false
    }
  },
  structured: {
    name: "structured_analysis",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        key_points: {
          type: "array",
          items: { type: "string" }
        },
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"]
        },
        action_required: { type: "boolean" }
      },
      required: ["summary", "key_points"],
      additionalProperties: false
    }
  }
};
