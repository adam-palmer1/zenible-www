export interface FilterOption {
  id: string;
  label: string;
  description?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  email_verified?: boolean;
  current_plan_id?: string;
  subscription_status?: string | null;
  subscription_id?: string;
  active_subscription_id?: string;
  cancel_at_period_end?: boolean;
  avatar_url?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminPlan {
  id: string;
  name: string;
  monthly_price: number;
  is_active?: boolean;
}

export interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (id: string) => void;
  title?: string;
}

export interface PlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: AdminPlan[];
  selectedPlanId: string;
  onSelect: (id: string) => void;
}

export interface DurationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDuration: string;
  onSelect: (id: string) => void;
}

export interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
  onSelect: (id: string) => void;
}

export interface ConfirmModalState {
  open: boolean;
  title: string;
  message: string;
  action: (() => Promise<void>) | null;
  variant: string;
}

export interface PermanentDeleteRecordCounts {
  subscriptions: number;
  payments: number;
  conversations: number;
  documents: number;
  permissions: number;
}

export interface PermanentDeleteCompanyCounts {
  contacts: number;
  invoices: number;
  expenses: number;
  quotes: number;
  projects: number;
}

export interface PermanentDeletePreview {
  user_email: string;
  company_name?: string;
  records_deleted?: {
    user?: PermanentDeleteRecordCounts;
    company?: PermanentDeleteCompanyCounts;
  };
  stripe_subscriptions_cancelled: number;
  stripe_customer_deleted: boolean;
  stripe_connect_disconnected: boolean;
  s3_files_deleted: number;
  google_calendar_revoked: boolean;
  zoom_revoked: boolean;
}

export interface PermanentDeleteModalState {
  open: boolean;
  user: AdminUser | null;
  preview: PermanentDeletePreview | null;
  loading: boolean;
  step: string;
}
