export interface UsageHistoryCharacterEntry {
  character_id: string;
  character_name: string;
  usage: number;
  limit: number | null;
}

export interface UsageHistoryToolEntry {
  tool_name: string;
  usage: number;
  limit: number | null;
}

export interface UsageHistoryMonth {
  year: number;
  month: number;
  period_label: string;
  is_current: boolean;
  days_remaining: number | null;
  total_ai_messages: number;
  total_ai_messages_limit: number | null;
  meeting_bot_minutes: number;
  meeting_bot_minutes_limit: number | null;
  per_character: UsageHistoryCharacterEntry[];
  per_tool: UsageHistoryToolEntry[];
}

export interface MonthlyUsageHistoryResponse {
  months: UsageHistoryMonth[];
}
