export interface ZMISettings {
  enabled: boolean;
  feature_available: boolean;
  plan_name: string | null;
  minutes_used: number;
  minutes_limit: number | null;
  minutes_remaining: number | null;
}

export interface UpcomingMeeting {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  meeting_link: string | null;
  zmi_enabled: boolean | null;
  platform: 'google_meet' | 'microsoft_teams' | 'zoom' | null;
}

export interface BotStatus {
  session_id: string;
  status: 'scheduling' | 'joining' | 'in_meeting' | 'leaving' | 'ended' | 'error';
  platform: string | null;
  participant_count: number;
  duration_s: number;
  error_message: string | null;
  joined_at: string | null;
  left_at: string | null;
}

export interface MeetingListItem {
  id: string;
  title: string | null;
  start_time: string | null;
  duration_ms: number | null;
  source: string | null;
  is_processed: boolean;
  transcript_count: number;
  system_audio_path: string | null;
  mic_audio_path: string | null;
}

export interface TranscriptEntry {
  type: string;
  session_id: string;
  speaker?: string;
  text?: string;
  timestamp?: string;
  is_final?: boolean;
}

export interface UsageInfo {
  minutes_used: number;
  minutes_limit: number | null;
  minutes_remaining: number | null;
  is_over_limit: boolean;
}
