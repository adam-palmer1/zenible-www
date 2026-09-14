export interface ZMISettings {
  enabled: boolean;
  feature_available: boolean;
  plan_name: string | null;
  minutes_used: number;
  minutes_limit: number | null;
  minutes_remaining: number | null;
  caption_language: string | null;
  recording_enabled: boolean;
  /** The USER's name for transcript attribution — not the bot's name. */
  meeting_display_name: string | null;
  auto_send_summary: string;
  /** The bot's name in the meeting participant list. */
  bot_display_name: string | null;
  /** Presigned URL of the bot's camera background; null = default brand image. */
  bot_background_url: string | null;
  recording_notice_enabled: boolean;
  recording_notice_message: string | null;
}

export interface UpcomingMeeting {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  meeting_link: string | null;
  zmi_enabled: boolean | null;
  platform: 'google_meet' | 'microsoft_teams' | 'zoom' | null;
  bot_dispatch_status: string | null;
  bot_dispatch_source: string | null;
  bot_session_id: string | null;
  bot_dispatch_error: string | null;
  bot_status: string | null;
  parent_appointment_id: string | null;
}

export interface BotStatus {
  session_id: string;
  status: 'scheduling' | 'joining' | 'waiting_room' | 'in_meeting' | 'listening' | 'leaving' | 'ended' | 'error';
  platform: string | null;
  participant_count: number;
  duration_s: number;
  error_message: string | null;
  joined_at: string | null;
  left_at: string | null;
  is_recording: boolean;
  // Enriched from /bot/active — meeting details
  meeting_title?: string | null;
  appointment_id?: string | null;
  start_datetime?: string | null;
  meeting_link?: string | null;
}

export interface MeetingListItem {
  id: string;
  title: string | null;
  start_time: string | null;
  duration_ms: number | null;
  is_processed: boolean;
  transcript_count: number;
  system_audio_path: string | null;
  mic_audio_path: string | null;
  has_video_recording: boolean;
  video_duration_ms: number | null;
}

export interface LinkedContactInfo {
  contact_id: string;
  name: string;
  type: 'contact' | 'client' | 'vendor';
}

export interface MeetingDetail {
  id: string;
  title: string | null;
  start_time: string;
  duration_ms: number | null;
  summary_json: {
    _analyzing?: boolean;
    _quota_exceeded?: boolean;
    _analysis_failed?: boolean;
    _plan_access_denied?: boolean;
    reason?: string;
    message?: string;
    character_name?: string;
    usage_type?: string;
    current?: number;
    limit?: number;
    overview?: string;
    keyPoints?: string[];
    actionItems?: string[];
    sentiment?: string;
    topics?: string[];
  } | null;
  is_processed: boolean;
  has_video_recording: boolean;
  video_duration_ms: number | null;
  video_size_bytes: number | null;
  share_link_code: string | null;
  speakers: Array<{ id: string; channel_label: string; display_name: string | null; person_name: string | null }>;
  transcripts: Array<{ id: number; speaker: string; content: string; timestamp_ms: number; speaker_display_name: string | null }>;
}

export interface TranscriptEntry {
  type: string;
  session_id: string;
  speaker?: string;
  text?: string;
  timestamp?: string;
  is_final?: boolean;
  // Stable per-utterance id (Zoom msgId or a synthesized per-turn id). When
  // present, the entry is upserted in place (partial→final) keyed by this id.
  caption_id?: string;
}

export interface InsightsState {
  running_summary: string;
  decisions: string[];
  action_items: string[];
  open_questions: string[];
  talk_time: Record<string, { seconds: number; percent: number }>;
  sentiment_trajectory: Array<{ timestamp: number; label: string; score: number; anchor?: boolean }>;
  coaching_notes: Array<{ timestamp: number; type: string; message: string; urgency?: string }>;
  topics: string[];
  duration_s: number;
}

export interface InsightsUpdate {
  type: 'insights_update';
  session_id: string;
  credits_exhausted?: boolean;
  state: InsightsState;
}

export interface UsageInfo {
  minutes_used: number;
  minutes_limit: number | null;
  minutes_remaining: number | null;
  is_over_limit: boolean;
}

export interface RecordingStatus {
  is_recording: boolean;
  duration_s: number;
  file_size_bytes: number;
}

export interface PublicRecording {
  meeting_title: string | null;
  start_time: string | null;
  duration_ms: number | null;
  video_url: string;
  size_bytes: number | null;
}
