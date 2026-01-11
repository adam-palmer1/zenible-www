# Appointments Workflow Documentation
**Frontend Implementation Details for Backend Verification**

This document describes how appointments are **viewed, created, searched, updated, and deleted** from both the CRM page and the Calendar page.

---

## Table of Contents
1. [API Endpoints Used](#api-endpoints-used)
2. [Data Structures](#data-structures)
3. [CRM Page Workflow](#crm-page-workflow)
4. [Calendar Page Workflow](#calendar-page-workflow)
5. [Critical Differences Between CRM and Calendar](#critical-differences-between-crm-and-calendar)
6. [Backend Expectations](#backend-expectations)

---

## API Endpoints Used

### Base URL
```
https://demo-api.zenible.com/api/v1
```

### Appointments Endpoints

| Operation | Endpoint | Method | Used In |
|-----------|----------|--------|---------|
| **List appointments** | `/crm/appointments/` | GET | Calendar |
| **Get calendar view** | `/crm/appointments/calendar` | GET | Calendar |
| **Get single appointment** | `/crm/appointments/{id}` | GET | Both |
| **Create appointment** | `/crm/appointments/` | POST | Both |
| **Update appointment** | `/crm/appointments/{id}` | PATCH | Both |
| **Delete appointment** | `/crm/appointments/{id}` | DELETE | Calendar |

### Contacts Endpoints

| Operation | Endpoint | Method | Used In |
|-----------|----------|--------|---------|
| **List contacts** | `/crm/contacts/` | GET | CRM |
| **Get single contact** | `/crm/contacts/{id}` | GET | Calendar |

---

## Data Structures

### Contact Object (from `/crm/contacts/`)
```json
{
  "id": "contact-uuid",
  "first_name": "Beatriz",
  "last_name": "Santos",
  "email": "beatriz@example.com",
  "phone": "+1234567890",
  "business_name": "Acme Corp",
  "appointments": [
    {
      "id": "appointment-uuid",
      "title": "Follow-up: Beatriz Santos",
      "start_datetime": "2026-01-12T14:00:00Z",
      "end_datetime": "2026-01-12T15:00:00Z",
      "appointment_type": "follow_up",
      "status": "scheduled",
      "contact_id": "contact-uuid",
      "all_day": false,
      "location": null,
      "meeting_link": null,
      "sync_status": "not_synced"
    }
  ]
}
```

**Key Points:**
- `appointments` is an **array** of all appointments for the contact
- Frontend uses `getNextAppointment()` utility to find the **soonest scheduled** appointment to display on cards
- Only appointments with `status: "scheduled"` are considered

### Appointment Object (from `/crm/appointments/`)
```json
{
  "id": "appointment-uuid",
  "title": "Follow-up: Beatriz Santos",
  "description": "Discuss Q2 proposal",
  "start_datetime": "2026-01-12T14:00:00Z",
  "end_datetime": "2026-01-12T15:00:00Z",
  "contact_id": "contact-uuid",
  "timezone": "America/New_York",
  "appointment_type": "follow_up",
  "status": "scheduled",
  "location": "Office 101",
  "meeting_link": "https://meet.example.com/xyz",
  "all_day": false,
  "sync_status": "synced",
  "google_event_id": "google-event-id",
  "recurrence": null
}
```

---

## CRM Page Workflow

### Location
- **File:** `/src/components/crm/CRMDashboard.jsx`
- **Views:** Pipeline (Kanban) and List
- **Contact Cards:** `/src/components/crm/PipelineContactCard.jsx`
- **Modal:** `/src/components/crm/AppointmentsModal.jsx`

---

### 1. **VIEWING Appointments in CRM**

#### Data Loading
```javascript
// CRMDashboard fetches contacts with embedded appointments
GET /crm/contacts/?is_hidden=false

// Response includes contacts with appointments array
{
  "items": [
    {
      "id": "contact-uuid",
      "first_name": "John",
      "appointments": [...]  // Array of all appointments
    }
  ]
}
```

#### Display Logic
```javascript
// PipelineContactCard.jsx

import { getNextAppointment } from '../../utils/crm/appointmentUtils';

// Get the closest/soonest scheduled appointment
const nextAppointment = getNextAppointment(contact.appointments);

// Display logic:
// - If nextAppointment exists: Show icon + date/time
// - If appointment_type === 'call': Green phone icon
// - If appointment_type === 'follow_up': Blue calendar icon
// - If start_datetime is in the past: Red background (overdue)
```

**What's displayed on contact cards:**
- Icon representing appointment type (phone for calls, calendar for follow-ups)
- Closest/soonest scheduled appointment date and time
- Overdue indicator if appointment is in the past
- Total count visible when clicking the appointment icon

---

### 2. **SEARCHING Appointments in CRM**

**Not directly implemented.** Appointments are filtered indirectly:

```javascript
// CRM has contact-level filters, not appointment-level filters
// Filters applied:
- Text search (name, email, business)
- Status filter (by contact status, not appointment status)
- Show hidden toggle

// To find contacts with appointments:
// Frontend uses client-side filtering:
contacts.filter(contact => {
  const nextAppointment = getNextAppointment(contact.appointments);
  return nextAppointment !== null;
});
```

**Sorting:**
```javascript
// When "Sort Follow Up by Date" is enabled in Follow Up column:
GET /crm/contacts/?global_status_id=follow_up_status_id

// Frontend sorts contacts by their next appointment date:
contacts.sort((a, b) => {
  const nextA = getNextAppointment(a.appointments);
  const nextB = getNextAppointment(b.appointments);

  const dateA = nextA?.start_datetime ? new Date(nextA.start_datetime) : new Date(0);
  const dateB = nextB?.start_datetime ? new Date(nextB.start_datetime) : new Date(0);

  return dateA - dateB; // Soonest first
});
```

---

### 3. **CREATING Appointments in CRM**

#### User Flow
1. User clicks appointment icon on any contact card
2. AppointmentsModal opens showing all scheduled appointments
3. User clicks "Schedule New Appointment" button
4. User fills form: Type (Call/Follow Up), Date, Time
5. User clicks "Schedule"

#### API Call
```javascript
// AppointmentsModal.jsx → setFollowUp() in ContactActionsContext.jsx

POST /crm/appointments/

Request Body:
{
  "contact_id": "contact-uuid",
  "title": "Follow-up: John Doe",          // Auto-generated
  "start_datetime": "2026-01-12T14:00:00", // ISO 8601 format
  "end_datetime": "2026-01-12T15:00:00",   // +1 hour default
  "appointment_type": "follow_up",         // or "call"
  "status": "scheduled"
}

Response: New appointment object
```

#### Post-Creation
```javascript
// After successful creation:
1. Show success notification
2. Call onRefreshContacts() to refresh contact list
3. Backend recalculates and includes updated appointments array in next contact fetch
```

**Multiple Appointments:**
- Users can create **unlimited** appointments per contact
- Each creation is a separate POST request
- Frontend always creates NEW appointments (never updates existing)
- Modal stays open after creation, allowing immediate creation of another

---

### 4. **UPDATING Appointments in CRM**

#### User Flow
1. User clicks appointment icon on contact card
2. AppointmentsModal opens showing list of all scheduled appointments
3. User clicks edit icon (pencil) on a specific appointment
4. User modifies: Type, Date, and/or Time
5. User clicks "Update"

#### API Call
```javascript
// AppointmentsModal.jsx

PATCH /crm/appointments/{appointment_id}

Request Body:
{
  "start_datetime": "2026-01-13T15:00:00",  // Modified date/time
  "end_datetime": "2026-01-13T16:00:00",    // Recalculated (+1 hour)
  "appointment_type": "call"                 // Changed type
}

Response: Updated appointment object
```

#### Post-Update
```javascript
// After successful update:
1. Show success notification
2. Reload page to refresh appointments: window.location.reload()
```

**Note:** Currently triggers full page reload. This ensures all components get fresh data including updated appointments array.

---

### 5. **DELETING Appointments in CRM**

#### User Flow (Cancel/Dismiss)
1. User clicks appointment icon on contact card
2. Modal shows all scheduled appointments
3. User clicks delete icon (trash) on specific appointment
4. Confirmation dialog appears
5. User confirms

#### API Call
```javascript
// AppointmentsModal.jsx

PATCH /crm/appointments/{appointment_id}

Request Body:
{
  "status": "cancelled"  // Soft delete
}

Response: Updated appointment with status "cancelled"
```

**Alternative: Dismiss from Menu**
```javascript
// ContactActionMenu.jsx → dismissFollowUp()

// Same PATCH request as above
// Only dismisses the NEXT/SOONEST appointment
const nextAppointment = getNextAppointment(contact.appointments);

PATCH /crm/appointments/{nextAppointment.id}
Body: { "status": "cancelled" }
```

#### Post-Deletion
```javascript
// After successful cancellation:
1. Show success notification
2. Reload page: window.location.reload()
3. Backend excludes cancelled appointments from appointments array
   (or frontend filters them out using status !== 'cancelled')
```

**Soft Delete Behavior:**
- Appointments are **never hard-deleted** from CRM
- Status changed to "cancelled" to preserve history
- Frontend filters out cancelled appointments when finding next appointment

---

## Calendar Page Workflow

### Location
- **File:** `/src/components/calendar/Calendar.jsx`
- **Modal:** `/src/components/calendar/AppointmentModal.jsx`
- **Hook:** `/src/hooks/useCalendar.js`

---

### 1. **VIEWING Appointments in Calendar**

#### Data Loading
```javascript
// Calendar.jsx → useCalendar hook

GET /crm/appointments/calendar?start_date=2026-01-01T00:00:00Z&end_date=2026-01-31T23:59:59Z&status=scheduled

Response:
{
  "appointments": [
    {
      "id": "appointment-uuid",
      "title": "Follow-up: John Doe",
      "start_datetime": "2026-01-12T14:00:00Z",
      "end_datetime": "2026-01-12T15:00:00Z",
      "appointment_type": "follow_up",
      "status": "scheduled",
      "contact_id": "contact-uuid",
      "contact": {  // Contact details included for display
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 42
}
```

#### View Modes
```javascript
// Calendar supports 3 view modes:
- Daily: Fetches appointments for 1 day
- Weekly: Fetches appointments for 1 week (Monday-Sunday)
- Monthly: Fetches appointments for entire month

// Date range calculation:
const getDateRange = () => {
  switch (viewMode) {
    case 'daily':
      startDate = startOfDay(currentDate);
      endDate = addDays(startDate, 1);
      break;
    case 'weekly':
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      endDate = addDays(startDate, 7);
      break;
    case 'monthly':
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
      break;
  }

  // Expand range ±1 month for mini calendar
  const expandedStartDate = addMonths(startDate, -1);
  const expandedEndDate = addMonths(endDate, 1);

  return { startDate: expandedStartDate, endDate: expandedEndDate };
};
```

#### Display Logic
```javascript
// Appointments displayed with:
- Color-coded by appointment_type (user-customizable colors)
- Time shown in user's local timezone
- Contact name shown on appointment
- Status indicators (scheduled, completed, cancelled)
- Recurring appointments expanded into multiple instances
```

---

### 2. **SEARCHING Appointments in Calendar**

#### Filter Options
```javascript
// Calendar supports multiple filters:

GET /crm/appointments/calendar?start_date=...&end_date=...&appointment_type=call&contact_id=contact-uuid&status=scheduled

Query Parameters:
{
  "start_date": "2026-01-01T00:00:00Z",  // Required
  "end_date": "2026-01-31T23:59:59Z",    // Required
  "appointment_type": "call",             // Optional: filter by type
  "contact_id": "contact-uuid",           // Optional: filter by contact
  "status": "scheduled"                   // Optional: filter by status
}
```

#### Filtering UI
```javascript
// Calendar settings modal allows filtering by:
- Appointment Types: Toggle visibility of call/follow_up/manual types
- Status: Show scheduled, completed, or cancelled
- Contact: Not directly implemented (would require contact selector)

// Client-side filtering applied after fetching:
const filteredAppointments = appointments.filter(apt => {
  return visibleTypes.includes(apt.appointment_type);
});
```

---

### 3. **CREATING Appointments in Calendar**

#### User Flow - Option 1: Click Time Slot
1. User clicks on empty time slot in calendar
2. AppointmentModal opens with prefilled start_datetime
3. User fills form:
   - Title (required)
   - Description (optional)
   - Contact (optional - search and select)
   - Type (manual/call/follow_up)
   - Status (scheduled/completed/cancelled)
   - Location (optional)
   - Meeting Link (optional)
   - All Day toggle
   - Recurrence settings (optional)
4. User clicks "Save"

#### User Flow - Option 2: Click "+" Button
1. User clicks "+" button in calendar header
2. AppointmentModal opens with empty form
3. Same form as Option 1
4. User clicks "Save"

#### API Call - Simple Appointment
```javascript
// AppointmentModal.jsx → onSave → useCalendar.createAppointment()

POST /crm/appointments/

Request Body:
{
  "title": "Meeting with John",
  "description": "Discuss Q2 goals",
  "start_datetime": "2026-01-12T14:00:00",  // ISO 8601, no timezone suffix
  "end_datetime": "2026-01-12T15:00:00",
  "contact_id": "contact-uuid",              // Optional
  "timezone": "America/New_York",
  "appointment_type": "manual",
  "status": "scheduled",
  "location": "Office 101",
  "meeting_link": "https://meet.example.com/xyz",
  "all_day": false
}

Response: New appointment object
```

#### API Call - Recurring Appointment
```javascript
POST /crm/appointments/

Request Body:
{
  "title": "Weekly Standup",
  "start_datetime": "2026-01-12T10:00:00",
  "end_datetime": "2026-01-12T10:30:00",
  "appointment_type": "manual",
  "status": "scheduled",
  "recurrence": {
    "recurring_type": "weekly",          // daily, weekly, monthly, yearly
    "recurring_interval": 1,             // Every 1 week
    "recurring_weekdays": ["MO", "WE", "FR"],  // For weekly
    "recurring_count": 10                // OR use "recurring_until": "2026-12-31"
  }
}

Response: Single appointment object with recurrence config
Backend generates multiple instances for calendar display
```

**Recurrence Options:**
- **Type:** daily, weekly, monthly, yearly
- **Interval:** Every N days/weeks/months/years
- **End Condition:**
  - Count: Generate N occurrences
  - Until: Generate until specific date
- **Weekly Pattern:** Select days of week (MO, TU, WE, TH, FR, SA, SU)
- **Monthly Pattern:**
  - Day of month (e.g., "15th of every month")
  - Week + Weekday (e.g., "2nd Tuesday of every month")

#### Post-Creation
```javascript
// After successful creation:
1. Add appointment to local state
2. Refetch appointments for current date range (to get recurring instances)
3. Close modal
4. Show success notification

// useCalendar.js
const createAppointment = async (data) => {
  const newAppointment = await appointmentsAPI.create(data);
  setAppointments(prev => [newAppointment, ...prev]);
  return { success: true, appointment: newAppointment };
};
```

---

### 4. **UPDATING Appointments in Calendar**

#### User Flow - Simple Appointment
1. User clicks on appointment in calendar
2. AppointmentModal opens in edit mode with prefilled data
3. User modifies any fields
4. User clicks "Save"

#### API Call - Simple Appointment
```javascript
// AppointmentModal.jsx → onSave → useCalendar.updateAppointment()

PATCH /crm/appointments/{appointment_id}

Request Body (only changed fields):
{
  "title": "Updated Meeting Title",
  "start_datetime": "2026-01-12T15:00:00",  // Changed time
  "end_datetime": "2026-01-12T16:00:00"
}

Response: Updated appointment object
```

#### User Flow - Recurring Appointment
1. User clicks on recurring appointment instance
2. RecurringScopeDialog appears asking:
   - "This Occurrence" (edit single instance)
   - "This and Future Occurrences" (edit from this point forward)
   - "All Occurrences" (edit entire series)
3. User selects scope
4. AppointmentModal opens with prefilled data
5. User modifies fields
6. User clicks "Save"

#### API Call - Recurring Appointment
```javascript
// Option 1: Edit This Occurrence Only
PATCH /crm/appointments/{appointment_id}?occurrence_date=2026-01-12T14:00:00

Request Body:
{
  "title": "Exception Meeting",
  "start_datetime": "2026-01-12T16:00:00",  // Different time for this instance
  "edit_scope": "this"  // IN BODY, not query param
}

// Option 2: Edit This and Future
PATCH /crm/appointments/{appointment_id}?occurrence_date=2026-01-12T14:00:00

Request Body:
{
  "start_datetime": "2026-01-12T15:00:00",  // Changes this and all future
  "edit_scope": "this_and_future"  // IN BODY
}

// Option 3: Edit All Occurrences
PATCH /crm/appointments/{appointment_id}

Request Body:
{
  "recurrence": {
    "recurring_type": "weekly",
    "recurring_weekdays": ["MO", "TH"]  // Changed pattern
  },
  "edit_scope": "all"  // IN BODY
}
```

#### Post-Update
```javascript
// After successful update:
1. Refetch appointments for current date range
   (recurring changes may affect multiple instances)
2. Close modal and scope dialog
3. Show success notification

// useCalendar.js
const updateAppointment = async (appointmentId, data, queryParams = {}) => {
  const updated = await appointmentsAPI.update(appointmentId, data, queryParams);

  if (data.edit_scope || data.recurrence) {
    // Trigger refetch via useEffect in parent component
  } else {
    // Update single appointment in local state
    setAppointments(prev =>
      prev.map(apt => apt.id === appointmentId ? updated : apt)
    );
  }

  return { success: true, appointment: updated };
};
```

#### Drag-and-Drop Update
```javascript
// User can drag appointment to different time/day
// On drop:

PATCH /crm/appointments/{appointment_id}

Request Body:
{
  "start_datetime": "2026-01-13T14:00:00",  // New date/time
  "end_datetime": "2026-01-13T15:00:00"     // Duration preserved
}

// For recurring: Prompts RecurringScopeDialog first
```

---

### 5. **DELETING Appointments in Calendar**

#### User Flow - Simple Appointment
1. User clicks on appointment
2. AppointmentModal opens
3. User clicks "Delete" button
4. Confirmation dialog appears
5. User confirms

#### API Call - Simple Appointment
```javascript
// AppointmentModal.jsx → onDelete → useCalendar.deleteAppointment()

DELETE /crm/appointments/{appointment_id}

Response: 204 No Content
```

#### User Flow - Recurring Appointment
1. User clicks on recurring appointment instance
2. User clicks "Delete"
3. RecurringScopeDialog appears asking:
   - "This Occurrence" (delete single instance)
   - "This and Future Occurrences" (delete from this point forward)
   - "All Occurrences" (delete entire series)
4. User selects scope
5. User confirms

#### API Call - Recurring Appointment
```javascript
// Option 1: Delete This Occurrence
DELETE /crm/appointments/{appointment_id}?delete_scope=this&occurrence_date=2026-01-12T14:00:00

// Option 2: Delete This and Future
DELETE /crm/appointments/{appointment_id}?delete_scope=this_and_future&occurrence_date=2026-01-12T14:00:00

// Option 3: Delete All Occurrences
DELETE /crm/appointments/{appointment_id}?delete_scope=all

Response: 204 No Content for all
```

**Note:** DELETE uses `delete_scope` (not `edit_scope`) as query parameter.

#### Post-Deletion
```javascript
// After successful deletion:
1. Remove appointment from local state
2. Decrement total count
3. Close modal and scope dialog
4. Show success notification

// useCalendar.js
const deleteAppointment = async (appointmentId, queryParams = {}) => {
  await appointmentsAPI.delete(appointmentId, queryParams);

  setAppointments(prev =>
    prev.filter(apt => apt.id !== appointmentId)
  );
  setTotalAppointments(prev => prev - 1);

  return { success: true };
};
```

---

## Critical Differences Between CRM and Calendar

| Aspect | CRM Page | Calendar Page |
|--------|----------|---------------|
| **Data Source** | `/crm/contacts/` with `appointments` array | `/crm/appointments/calendar` |
| **Primary Entity** | Contact | Appointment |
| **Appointments Display** | Shows only NEXT/SOONEST appointment per contact | Shows ALL appointments in date range |
| **Filtering** | Contact-level filters (name, status, hidden) | Appointment-level filters (type, status, date range) |
| **Creation** | Always links to a contact | Can be created without contact |
| **Update** | Limited to date/time/type | Full edit including title, description, location, etc. |
| **Delete Method** | Soft delete (status: cancelled) | Hard delete (DELETE request) |
| **Recurring** | Not supported | Full recurring support (create, edit, delete with scope) |
| **Refresh Method** | Page reload (`window.location.reload()`) | Local state update + refetch |
| **Contact Association** | Required (always has contact_id) | Optional (can be manual appointments) |
| **Multiple Appointments** | Managed via AppointmentsModal | Each shown separately on calendar |

---

## Backend Expectations

### 1. **Contacts API (`/crm/contacts/`)**

**MUST include:**
```json
{
  "id": "contact-uuid",
  "appointments": [
    // Array of ALL appointments for this contact
    // Frontend filters to scheduled status
    {
      "id": "appointment-uuid",
      "start_datetime": "2026-01-12T14:00:00Z",
      "appointment_type": "follow_up",
      "status": "scheduled"
      // ... other fields
    }
  ]
}
```

**Filtering expectations:**
- `appointments` should include all appointments regardless of status
- Frontend will filter to `status === 'scheduled'` when finding next appointment
- OR backend can pre-filter to only scheduled appointments (preferred)

**Ordering:**
- Appointments array can be in any order
- Frontend will sort to find soonest using `getNextAppointment()`

---

### 2. **Calendar API (`/crm/appointments/calendar`)**

**MUST support query parameters:**
```
start_date (required): ISO 8601 datetime
end_date (required): ISO 8601 datetime
appointment_type (optional): call, follow_up, manual
contact_id (optional): UUID
status (optional): scheduled, completed, cancelled
```

**MUST include contact details:**
```json
{
  "appointments": [
    {
      "id": "appointment-uuid",
      "contact_id": "contact-uuid",
      "contact": {  // Include contact details for display
        "id": "contact-uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Recurring appointments:**
- Backend should expand recurring appointments into individual instances
- Each instance has same `id` but different `start_datetime`
- Frontend uses `${id}_${start_datetime}` as unique key
- Include recurrence config in response for editing

---

### 3. **Create Appointment (`POST /crm/appointments/`)**

**Accepts:**
```json
{
  "title": "string",
  "description": "string (optional)",
  "start_datetime": "2026-01-12T14:00:00",  // No timezone suffix
  "end_datetime": "2026-01-12T15:00:00",
  "contact_id": "uuid (optional)",
  "timezone": "America/New_York",
  "appointment_type": "call | follow_up | manual",
  "status": "scheduled | completed | cancelled",
  "location": "string (optional)",
  "meeting_link": "string (optional)",
  "all_day": false,
  "recurrence": {  // Optional
    "recurring_type": "daily | weekly | monthly | yearly",
    "recurring_interval": 1,
    "recurring_weekdays": ["MO", "WE"],  // For weekly
    "recurring_count": 10,  // OR
    "recurring_until": "2026-12-31",
    "recurring_monthly_type": "day_of_month | week_of_month",
    "recurring_monthly_day": 15,
    "recurring_monthly_week": 2,
    "recurring_monthly_weekday": "TU"
  }
}
```

**Returns:**
```json
{
  "id": "appointment-uuid",
  // All fields from request
  "created_at": "2026-01-01T12:00:00Z",
  "updated_at": "2026-01-01T12:00:00Z"
}
```

---

### 4. **Update Appointment (`PATCH /crm/appointments/{id}`)**

**Query Parameters (for recurring):**
```
edit_scope: this_occurrence | this_and_future | all_occurrences
occurrence_date: 2026-01-12T14:00:00 (required for this_occurrence and this_and_future)
```

**Behavior by scope:**
- `this_occurrence`: Create exception for single instance
- `this_and_future`: Split series at occurrence_date, update future instances
- `all_occurrences`: Update entire series pattern

**Accepts partial updates:**
```json
{
  "title": "Updated Title",
  "start_datetime": "2026-01-12T15:00:00"
  // Only changed fields
}
```

---

### 5. **Delete Appointment (`DELETE /crm/appointments/{id}`)**

**Query Parameters (for recurring):**
```
edit_scope: this_occurrence | this_and_future | all_occurrences
occurrence_date: 2026-01-12T14:00:00 (required for this_occurrence and this_and_future)
```

**Behavior by scope:**
- `this_occurrence`: Mark single instance as exception/deleted
- `this_and_future`: End recurrence before occurrence_date
- `all_occurrences`: Delete entire series

**Returns:** `204 No Content`

---

### 6. **Status Field Behavior**

**CRM expects:**
- Appointments with `status: "cancelled"` should still be included in `appointments` array
- Frontend will filter them out when finding next appointment
- OR backend can exclude cancelled appointments from array (preferred)

**Calendar expects:**
- Calendar can filter by status via `?status=scheduled` query param
- Default: Show only `scheduled` appointments
- User can toggle to show `completed` or `cancelled` in settings

---

### 7. **Timezone Handling**

**Frontend sends:**
- `start_datetime` and `end_datetime` WITHOUT timezone suffix (e.g., `"2026-01-12T14:00:00"`)
- Separate `timezone` field with IANA timezone (e.g., `"America/New_York"`)

**Backend should:**
- Store datetimes in UTC
- Return datetimes in ISO 8601 with `Z` suffix (e.g., `"2026-01-12T19:00:00Z"`)
- Frontend converts to user's local timezone for display

---

### 8. **Automatic Title Generation (CRM Only)**

When creating from CRM:
```javascript
// Frontend generates title automatically:
title = `${appointmentType === 'call' ? 'Call' : 'Follow-up'}: ${contactName}`

// Examples:
"Call: John Doe"
"Follow-up: Acme Corp"
```

Backend should accept this title as-is.

---

## Summary

### CRM Page
- **Purpose:** Quick appointment scheduling linked to contacts
- **Use Case:** Sales pipeline management, follow-up tracking
- **Complexity:** Simple (date, time, type only)
- **Delete:** Soft delete (status: cancelled)
- **Recurring:** Not supported

### Calendar Page
- **Purpose:** Full calendar view of all appointments
- **Use Case:** Comprehensive schedule management
- **Complexity:** Full featured (title, description, location, recurrence, etc.)
- **Delete:** Hard delete (DELETE request)
- **Recurring:** Full support with scope options

### Data Sync
- Changes in Calendar update Contacts API immediately
- Changes in CRM update Appointments API immediately
- Both pages refresh after mutations to show latest data

---

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Author:** Frontend Team
