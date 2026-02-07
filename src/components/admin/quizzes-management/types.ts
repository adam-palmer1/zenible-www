export interface QuizAnswer {
  id?: string;
  answer_text: string;
  is_correct: boolean;
  explanation?: string;
  order_index?: number;
}

export interface QuizQuestion {
  id?: string;
  question_text: string;
  points: number | string;
  order_index?: number;
  answers: QuizAnswer[];
}

export interface QuizTag {
  id: string;
  name: string;
  icon?: string;
  is_active?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  tag_ids?: string[];
  tags?: QuizTag[];
  is_active: boolean;
  question_count?: number;
  total_points?: number;
  questions?: QuizQuestion[];
  available_tags?: QuizTag[];
  created_at?: string;
}

export interface QuizFormState {
  title: string;
  description: string;
  tag_ids: string[];
  is_active: boolean;
  questions: QuizQuestion[];
}

export interface BulkDeleteResult {
  total: number;
  deleted: number;
  failed: number;
  errors?: Array<{ quiz_id: string; error?: string }>;
}
