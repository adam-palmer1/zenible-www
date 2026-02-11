/**
 * CRM domain types.
 * Convenience re-exports from OpenAPI generated types.
 */
import type { components } from './api.generated';

// ──────────────────────────────────────────────
// Contacts
// ──────────────────────────────────────────────

export type ContactResponse = components['schemas']['ContactResponse'];
export type ContactCreate = components['schemas']['ContactCreate'];
export type ContactUpdate = components['schemas']['ContactUpdate'];
export type ContactFieldsResponse = components['schemas']['ContactFieldsResponse'];
export type ContactFieldMetadata = components['schemas']['ContactFieldMetadata'];
export type ContactStatusChange = components['schemas']['ContactStatusChange'];
export type ContactMergeRequest = components['schemas']['ContactMergeRequest'];
export type ContactMergeResponse = components['schemas']['ContactMergeResponse'];
export type SimpleContactResponse = components['schemas']['SimpleContactResponse'];
export type ContactActivityResponse = components['schemas']['ContactActivityResponse'];
export type ContactTimelineResponse = components['schemas']['ContactTimelineResponse'];

// Contact Notes
export type ContactNoteResponse = components['schemas']['ContactNoteResponse'];
export type ContactNoteCreate = components['schemas']['ContactNoteCreate'];
export type ContactNoteUpdate = components['schemas']['ContactNoteUpdate'];

// Contact Persons
export type ContactPersonResponse = components['schemas']['ContactPersonResponse'];
export type ContactPersonCreate = components['schemas']['ContactPersonCreate'];
export type ContactPersonUpdate = components['schemas']['ContactPersonUpdate'];

// Contact Taxes
export type ContactTaxResponse = components['schemas']['ContactTaxResponse'];
export type ContactTaxCreate = components['schemas']['ContactTaxCreate'];
export type ContactTaxUpdate = components['schemas']['ContactTaxUpdate'];

// Contact Files
export type ContactFileResponse = components['schemas']['ContactFileResponse'];
export type ContactFileListResponse = components['schemas']['ContactFileListResponse'];
export type ContactFileUploadRequest = components['schemas']['ContactFileUploadRequest'];
export type ContactFileUploadResponse = components['schemas']['ContactFileUploadResponse'];
export type ContactFileUpdateRequest = components['schemas']['ContactFileUpdateRequest'];

// ──────────────────────────────────────────────
// Contact Services
// ──────────────────────────────────────────────

export type ContactServiceResponse = components['schemas']['ContactServiceResponse'];
export type ContactServiceCreate = components['schemas']['ContactServiceCreate'];
export type ContactServiceUpdate = components['schemas']['ContactServiceUpdate'];
export type ContactServiceStatusEnum = components['schemas']['ContactServiceStatusEnum'];
export type SimpleContactServiceResponse = components['schemas']['SimpleContactServiceResponse'];

// Service Attributions
export type ContactServiceAttributionResponse = components['schemas']['ContactServiceAttributionResponse'];
export type ContactServiceAttributionCreate = components['schemas']['ContactServiceAttributionCreate'];

// Service Invoice Links
export type ContactServiceInvoiceResponse = components['schemas']['ContactServiceInvoiceResponse'];
export type ContactServiceInvoiceCreate = components['schemas']['ContactServiceInvoiceCreate'];
export type CreateInvoiceFromServiceRequest = components['schemas']['CreateInvoiceFromServiceRequest'];
export type CreateRecurringInvoiceFromServiceRequest = components['schemas']['CreateRecurringInvoiceFromServiceRequest'];
export type LinkRecurringServiceRequest = components['schemas']['LinkRecurringServiceRequest'];

// ──────────────────────────────────────────────
// Services (Catalog)
// ──────────────────────────────────────────────

export type ServiceResponse = components['schemas']['ServiceResponse'];
export type ServiceCreate = components['schemas']['ServiceCreate'];
export type ServiceUpdate = components['schemas']['ServiceUpdate'];
export type ServiceEnumsResponse = components['schemas']['ServiceEnumsResponse'];
export type SimpleServiceResponse = components['schemas']['SimpleServiceResponse'];

// ──────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────

export type ProjectResponse = components['schemas']['ProjectResponse'];
export type ProjectDetailResponse = components['schemas']['ProjectDetailResponse'];
export type ProjectCreate = components['schemas']['ProjectCreate'];
export type ProjectUpdate = components['schemas']['ProjectUpdate'];
export type ProjectListResponse = components['schemas']['ProjectListResponse'];
export type ProjectListItemResponse = components['schemas']['ProjectListItemResponse'];
export type ProjectStatsResponse = components['schemas']['ProjectStatsResponse'];
export type ProjectStatusEnum = components['schemas']['ProjectStatusEnum'];
export type SimpleProjectResponse = components['schemas']['SimpleProjectResponse'];

// Project Service Assignments
export type ProjectServiceAssignmentResponse = components['schemas']['ProjectServiceAssignmentResponse'];
export type ProjectServiceAssignmentCreate = components['schemas']['ProjectServiceAssignmentCreate'];

// Project Tasks
export type ProjectTaskResponse = components['schemas']['ProjectTaskResponse'];
export type ProjectTaskDetailResponse = components['schemas']['ProjectTaskDetailResponse'];
export type ProjectTaskCreate = components['schemas']['ProjectTaskCreate'];
export type ProjectTaskUpdate = components['schemas']['ProjectTaskUpdate'];
export type ProjectTaskListResponse = components['schemas']['ProjectTaskListResponse'];
export type ProjectTaskTreeResponse = components['schemas']['ProjectTaskTreeResponse'];
export type TaskStatusEnum = components['schemas']['TaskStatusEnum'];

// Project Allocations
export type ProjectAllocationResponse = components['schemas']['ProjectAllocationResponse'];
export type ProjectAllocationCreate = components['schemas']['ProjectAllocationCreate'];
export type ProjectAllocationsResponse = components['schemas']['ProjectAllocationsResponse'];
export type ProjectAllocationsUpdate = components['schemas']['ProjectAllocationsUpdate'];

// ──────────────────────────────────────────────
// Billable Hours
// ──────────────────────────────────────────────

export type BillableHourResponse = components['schemas']['BillableHourResponse'];
export type BillableHourCreate = components['schemas']['BillableHourCreate'];
export type BillableHourUpdate = components['schemas']['BillableHourUpdate'];
export type BillableHourListResponse = components['schemas']['BillableHourListResponse'];
export type BillableHourBulkCreate = components['schemas']['BillableHourBulkCreate'];
export type BillableHourBulkLinkInvoice = components['schemas']['BillableHourBulkLinkInvoice'];
export type BillableHourBulkLinkResponse = components['schemas']['BillableHourBulkLinkResponse'];

// ──────────────────────────────────────────────
// Statuses
// ──────────────────────────────────────────────

export type AvailableStatuses = components['schemas']['AvailableStatuses'];
export type UnifiedStatusEnum = components['schemas']['UnifiedStatusEnum'];
export type StatusMetadata = components['schemas']['StatusMetadata'];
export type CustomStatusCreate = components['schemas']['CustomStatusCreate'];
export type CustomStatusResponse = components['schemas']['CustomStatusResponse'];
export type CustomStatusUpdate = components['schemas']['CustomStatusUpdate'];
export type SimpleStatusResponse = components['schemas']['SimpleStatusResponse'];
export type StatusRolesResponse = components['schemas']['StatusRolesResponse'];

// ──────────────────────────────────────────────
// Appointments & Calendar
// ──────────────────────────────────────────────

export type AppointmentResponse = components['schemas']['AppointmentResponse'];
export type AppointmentCreate = components['schemas']['AppointmentCreate'];
export type AppointmentUpdate = components['schemas']['AppointmentUpdate'];
export type AppointmentListResponse = components['schemas']['AppointmentListResponse'];
export type AppointmentListItemResponse = components['schemas']['AppointmentListItemResponse'];
export type AppointmentTypeEnum = components['schemas']['AppointmentTypeEnum'];
export type AppointmentEnumsResponse = components['schemas']['AppointmentEnumsResponse'];
export type CalendarAppointmentResponse = components['schemas']['CalendarAppointmentResponse'];
export type CalendarAppointmentsResponse = components['schemas']['CalendarAppointmentsResponse'];
export type CalendarContactInfo = components['schemas']['CalendarContactInfo'];

// Google Calendar
export type CalendarIntegrationStatus = components['schemas']['CalendarIntegrationStatus'];
export type GoogleCalendarMultiAccountStatusResponse = components['schemas']['GoogleCalendarMultiAccountStatusResponse'];
export type GoogleAccountInfo = components['schemas']['GoogleAccountInfo'];
export type GoogleAccountUpdateRequest = components['schemas']['GoogleAccountUpdateRequest'];
export type GoogleAccountConflictStatus = components['schemas']['GoogleAccountConflictStatus'];

// Recurring
export type RecurringTypeEnum = components['schemas']['RecurringTypeEnum'];
export type RecurringStatusEnum = components['schemas']['RecurringStatusEnum'];
export type RecurrenceConfig = components['schemas']['RecurrenceConfig'];
export type EditScopeEnum = components['schemas']['EditScopeEnum'];

// ──────────────────────────────────────────────
// Booking Settings & Availability
// ──────────────────────────────────────────────

export type UserBookingSettingsResponse = components['schemas']['UserBookingSettingsResponse'];
export type UserBookingSettingsUpdate = components['schemas']['UserBookingSettingsUpdate'];
export type AvailabilityWindowResponse = components['schemas']['AvailabilityWindowResponse'];
export type AvailabilityWindowCreate = components['schemas']['AvailabilityWindowCreate'];
export type AvailabilityWindowUpdate = components['schemas']['AvailabilityWindowUpdate'];
export type AvailabilityWindowListResponse = components['schemas']['AvailabilityWindowListResponse'];
export type AvailabilityWindowsBulkUpdate = components['schemas']['AvailabilityWindowsBulkUpdate'];
export type CalendarAvailabilitySourceResponse = components['schemas']['CalendarAvailabilitySourceResponse'];
export type CalendarAvailabilitySourceCreate = components['schemas']['CalendarAvailabilitySourceCreate'];
export type CalendarAvailabilitySourceUpdate = components['schemas']['CalendarAvailabilitySourceUpdate'];

// Call Types
export type CallTypeResponse = components['schemas']['CallTypeResponse'];
export type CallTypeCreate = components['schemas']['CallTypeCreate'];
export type CallTypeUpdate = components['schemas']['CallTypeUpdate'];
export type CallTypeListResponse = components['schemas']['CallTypeListResponse'];
export type CallTypeOverrideResponse = components['schemas']['CallTypeOverrideResponse'];
export type CallTypeOverrideCreate = components['schemas']['CallTypeOverrideCreate'];

// ──────────────────────────────────────────────
// Public Booking
// ──────────────────────────────────────────────

export type PublicBookingPageResponse = components['schemas']['PublicBookingPageResponse'];
export type PublicUserPageResponse = components['schemas']['PublicUserPageResponse'];
export type PublicCallTypeInfo = components['schemas']['PublicCallTypeInfo'];
export type AvailableSlotsResponse = components['schemas']['AvailableSlotsResponse'];
export type DayAvailability = components['schemas']['DayAvailability'];
export type BookingRequest = components['schemas']['BookingRequest'];
export type BookingConfirmationResponse = components['schemas']['BookingConfirmationResponse'];
export type BookingCancelRequest = components['schemas']['BookingCancelRequest'];
export type BookingCancelResponse = components['schemas']['BookingCancelResponse'];
export type BookingRescheduleRequest = components['schemas']['BookingRescheduleRequest'];
export type BookingRescheduleResponse = components['schemas']['BookingRescheduleResponse'];
export type BookingLookupResponse = components['schemas']['BookingLookupResponse'];

// ──────────────────────────────────────────────
// Zoom Integration
// ──────────────────────────────────────────────

export type ZoomConnectionStatusResponse = components['schemas']['ZoomConnectionStatusResponse'];
export type ZoomOAuthCallbackRequest = components['schemas']['ZoomOAuthCallbackRequest'];
export type ZoomOAuthCallbackResponse = components['schemas']['ZoomOAuthCallbackResponse'];
export type ZoomOAuthInitiateResponse = components['schemas']['ZoomOAuthInitiateResponse'];
export type ZoomAccountResponse = components['schemas']['ZoomAccountResponse'];
export type ZoomDisconnectResponse = components['schemas']['ZoomDisconnectResponse'];
export type ConferencingTypeEnum = components['schemas']['ConferencingTypeEnum'];

// ──────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────

export type EmailTemplateResponse = components['schemas']['EmailTemplateResponse'];
export type EmailTemplateCreate = components['schemas']['EmailTemplateCreate'];
export type EmailTemplateUpdate = components['schemas']['EmailTemplateUpdate'];
export type EmailTemplateListResponse = components['schemas']['EmailTemplateListResponse'];
export type EmailTemplateType = components['schemas']['EmailTemplateType'];
export type EmailTemplatePreviewRequest = components['schemas']['EmailTemplatePreviewRequest'];
export type EmailTemplatePreviewResponse = components['schemas']['EmailTemplatePreviewResponse'];
export type EmailTemplateVariablesResponse = components['schemas']['EmailTemplateVariablesResponse'];
