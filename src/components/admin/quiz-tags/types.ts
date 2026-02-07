export interface QuizTag {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  quiz_count?: number;
  subscription_plan_ids?: string[];
  plans?: Array<{ id: string; name: string }>;
  created_at?: string;
}

export interface Plan {
  id: string;
  name: string;
}

export interface TagFormState {
  name: string;
  description: string;
  icon: string;
  subscription_plan_ids: string[];
  is_active: boolean;
}

export interface BulkUpdateFormState {
  is_active: boolean;
  subscription_plan_ids: string[];
}

export interface BulkUpdateResult {
  total_submitted: number;
  successful: number;
  failed: number;
  results: Array<{ tag_id: string; success: boolean; error?: string }>;
}

export interface BulkDeleteResult {
  total_submitted: number;
  successful: number;
  failed: number;
  results?: Array<{ tag_id: string; success: boolean; error?: string }>;
}
