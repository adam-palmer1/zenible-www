export interface AdminOutletContext {
  darkMode: boolean;
}

export interface EventHost {
  id: string;
  name: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  rating?: string | null;
  start_datetime: string;
  duration_minutes: number;
  guest_limit?: number | null;
  tags?: string[];
  required_plan_ids?: string[];
  required_plan_id?: string;
  event_url?: string;
  replay_url?: string;
  past_summary?: string;
  is_active: boolean;
  hosts?: EventHost[];
  registered_count?: number;
}

export interface PlanItem {
  id: string;
  name: string;
}

export interface EventRegistration {
  user_email: string;
  user_name?: string;
  registered_at: string;
  is_attending: boolean;
}

export interface EventsResponse {
  events: EventItem[];
  total: number;
  total_pages: number;
}

export interface HostsResponse {
  hosts: EventHost[];
}

export interface PlansResponse {
  plans?: PlanItem[];
  items?: PlanItem[];
}

export interface RegistrationsResponse {
  registrations: EventRegistration[];
}

export interface EventAnalyticsItem {
  title: string;
  start_datetime: string;
  total_registrations?: number;
  active_registrations?: number;
  capacity_utilization?: number;
}

export interface EventAnalytics {
  total_events?: number;
  upcoming_events?: number;
  past_events?: number;
  total_registrations?: number;
  analytics?: EventAnalyticsItem[];
}

export interface EventFormData {
  title: string;
  description: string;
  rating: string;
  start_datetime: string;
  duration_minutes: number | string;
  guest_limit: string | number;
  tags: string[];
  required_plan_ids: string[];
  event_url: string;
  replay_url: string;
  past_summary: string;
  is_active: boolean;
  host_ids: string[];
}
