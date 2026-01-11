# CRM API Contracts Documentation

**Purpose**: Document all CRM API endpoints, request/response formats, and behaviors before React Query migration.
**Last Updated**: 2026-01-05
**Base URL**: `https://demo-api.zenible.com/api/v1` (or `VITE_API_BASE_URL`)

---

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer {access_token}
```

Token is retrieved from `localStorage.getItem('access_token')`.

---

## Contacts API

**Service File**: `/src/services/api/crm/contacts.js`

### List Contacts
- **Endpoint**: `GET /crm/contacts/`
- **Query Parameters**:
  - `limit` (number) - Pagination limit
  - `offset` (number) - Pagination offset
  - `search` (string) - Search term
  - `current_global_status_id` (UUID) - Filter by global status
  - `current_custom_status_id` (UUID) - Filter by custom status
  - `is_client` (boolean) - Filter by client status
  - `is_hidden` (boolean) - Show hidden contacts
- **Response**: Array of contact objects with nested relationships
```json
[
  {
    "id": "uuid",
    "company_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "business_name": "Acme Corp",
    "current_global_status_id": "uuid",
    "current_custom_status_id": "uuid | null",
    "is_hidden": false,
    "is_client": false,
    "sort_order": 0,
    "recurring_total": 1500.00,
    "one_off_total": 5000.00,
    "total_value_currency": "GBP",
    "services": [...],
    "appointments": [...],
    "next_appointment": {...},
    "projects": [...],
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2026-01-05T12:00:00Z"
  }
]
```

### Get Single Contact
- **Endpoint**: `GET /crm/contacts/{contact_id}`
- **Response**: Full contact object with all nested relationships (same structure as list)

### Create Contact
- **Endpoint**: `POST /crm/contacts/`
- **Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "business_name": "Acme Corp",
  "current_global_status_id": "uuid",
  "country": "GB",
  "industry_id": "uuid",
  "employee_range_id": "uuid",
  "vendor_type_id": "uuid"
}
```
- **Response**: Created contact object with nested relationships

### Update Contact
- **Endpoint**: `PATCH /crm/contacts/{contact_id}`
- **Request Body**: Partial contact object (any fields to update)
```json
{
  "first_name": "Jane",
  "current_global_status_id": "uuid",
  "after_id": "uuid",
  "notes": "Updated notes"
}
```
- **Response**: Updated contact object

**⚠️ KNOWN ISSUE**: Currently returns incomplete contact object (missing services, appointments, projects).
See `/docs/frontend/ISSUE-contact-update-incomplete-response.md` for details.

**Expected Behavior**: Should return full contact object with all nested relationships (like GET endpoint).

### Delete Contact (Soft Delete)
- **Endpoint**: `DELETE /crm/contacts/{contact_id}`
- **Response**: 204 No Content

### Restore Contact
- **Endpoint**: `POST /crm/contacts/{contact_id}/restore`
- **Response**: Restored contact object

### Change Contact Status
- **Endpoint**: `POST /crm/contacts/{contact_id}/status`
- **Request Body**:
```json
{
  "current_global_status_id": "uuid",
  "current_custom_status_id": null
}
```
- **Response**: Updated contact object

### Services Management

#### Create Contact-Specific Service
- **Endpoint**: `POST /crm/contacts/{contact_id}/services`
- **Request Body**:
```json
{
  "name": "Web Development",
  "service_type": "recurring",
  "amount": 1500.00,
  "billing_frequency": "monthly",
  "currency": "GBP"
}
```
- **Response**: Created service object

#### Assign Existing Service
- **Endpoint**: `POST /crm/contacts/{contact_id}/services/{service_id}`
- **Response**: Updated contact object

#### Unassign Service
- **Endpoint**: `DELETE /crm/contacts/{contact_id}/services/{service_id}`
- **Response**: 204 No Content

#### Update Contact Service
- **Endpoint**: `PATCH /crm/contacts/{contact_id}/services/{service_id}`
- **Request Body**: Partial service object
- **Response**: Updated service object

### Notes Management

#### Get Contact Notes
- **Endpoint**: `GET /crm/contacts/{contact_id}/notes`
- **Response**: Array of note objects

#### Create Note
- **Endpoint**: `POST /crm/contacts/{contact_id}/notes`
- **Request Body**:
```json
{
  "content": "Follow up next week",
  "note_type": "general"
}
```
- **Response**: Created note object

#### Update Note
- **Endpoint**: `PATCH /crm/contacts/notes/{note_id}`
- **Request Body**: Partial note object
- **Response**: Updated note object

#### Delete Note
- **Endpoint**: `DELETE /crm/contacts/{contact_id}/notes/{note_id}`
- **Response**: 204 No Content

### Timeline/Activities
- **Endpoint**: `GET /crm/contacts/{contact_id}/timeline`
- **Query Parameters**:
  - `limit` (number) - Pagination limit
  - `offset` (number) - Pagination offset
- **Response**: Array of activity objects (chronological history)

### Import Contacts
- **Endpoint**: `POST /crm/contacts/import`
- **Request**: `multipart/form-data` with `file` field (CSV/Excel)
- **Response**:
```json
{
  "imported": 150,
  "failed": 5,
  "errors": [...]
}
```

---

## Statuses API

**Service File**: `/src/services/api/crm/statuses.js`

### Get Available Statuses
- **Endpoint**: `GET /crm/statuses/available`
- **Response**: Object with global and custom status arrays
```json
{
  "global_statuses": [
    {
      "id": "uuid",
      "name": "new_lead",
      "friendly_name": "New Lead",
      "color": "#3b82f6",
      "tooltip": "Contact has just been added",
      "sort_order": 0,
      "is_active": true
    }
  ],
  "custom_statuses": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "name": "discovery_call",
      "friendly_name": "Discovery Call",
      "color": "#8b5cf6",
      "tooltip": "Scheduled for discovery call",
      "sort_order": 0,
      "is_active": true,
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

### Update Global Status
- **Endpoint**: `PATCH /crm/statuses/global/{status_id}`
- **Request Body**:
```json
{
  "friendly_name": "Qualified Lead",
  "color": "#10b981",
  "tooltip": "Updated tooltip"
}
```
- **Response**: Updated global status object
- **Note**: Cannot modify `name` or `sort_order` for global statuses

### Create Custom Status
- **Endpoint**: `POST /crm/statuses/custom`
- **Request Body**:
```json
{
  "name": "technical_evaluation",
  "friendly_name": "Technical Evaluation",
  "color": "#f59e0b",
  "tooltip": "In technical evaluation phase",
  "sort_order": 5
}
```
- **Response**: Created custom status object

### Update Custom Status
- **Endpoint**: `PATCH /crm/statuses/custom/{status_id}`
- **Request Body**: Partial status object
- **Response**: Updated custom status object

### Delete Custom Status
- **Endpoint**: `DELETE /crm/statuses/custom/{status_id}`
- **Response**: 204 No Content
- **Note**: Cannot delete if contacts are using this status

---

## Services API

**Service File**: `/src/services/api/crm/services.js`

### List Services
- **Endpoint**: `GET /crm/services/`
- **Query Parameters**:
  - `limit` (number) - Pagination limit
  - `offset` (number) - Pagination offset
  - `service_type` (string) - Filter by type: "recurring" | "one_off"
- **Response**: Array of service objects
```json
[
  {
    "id": "uuid",
    "company_id": "uuid",
    "name": "Web Development",
    "description": "Full-stack web development",
    "service_type": "recurring",
    "amount": 1500.00,
    "currency": "GBP",
    "billing_frequency": "monthly",
    "is_active": true,
    "created_at": "2025-12-01T10:00:00Z"
  }
]
```

### Get Single Service
- **Endpoint**: `GET /crm/services/{service_id}`
- **Response**: Service object

### Create Service
- **Endpoint**: `POST /crm/services/`
- **Request Body**:
```json
{
  "name": "SEO Services",
  "description": "Monthly SEO optimization",
  "service_type": "recurring",
  "amount": 800.00,
  "currency": "GBP",
  "billing_frequency": "monthly"
}
```
- **Response**: Created service object

### Update Service
- **Endpoint**: `PATCH /crm/services/{service_id}`
- **Request Body**: Partial service object
- **Response**: Updated service object

### Delete Service
- **Endpoint**: `DELETE /crm/services/{service_id}`
- **Response**: 204 No Content

---

## Appointments API

**Service File**: `/src/services/api/crm/appointments.js`

### List Appointments
- **Endpoint**: `GET /crm/appointments/`
- **Query Parameters**:
  - `limit`, `offset` - Pagination
  - `contact_id` (UUID) - Filter by contact
  - `start_date`, `end_date` (ISO 8601) - Date range filter
  - `status` (string) - Filter by status: "scheduled" | "completed" | "cancelled"
- **Response**: Array of appointment objects

### Create Appointment
- **Endpoint**: `POST /crm/appointments/`
- **Request Body**:
```json
{
  "contact_id": "uuid",
  "title": "Discovery Call: John Doe",
  "start_datetime": "2026-01-10T14:00:00Z",
  "end_datetime": "2026-01-10T15:00:00Z",
  "appointment_type": "discovery_call",
  "status": "scheduled",
  "notes": "Discuss project requirements"
}
```
- **Response**: Created appointment object

### Update Appointment
- **Endpoint**: `PATCH /crm/appointments/{appointment_id}`
- **Request Body**: Partial appointment object
- **Response**: Updated appointment object

### Delete Appointment
- **Endpoint**: `DELETE /crm/appointments/{appointment_id}`
- **Response**: 204 No Content

---

## Projects API

**Service File**: `/src/services/api/crm/projects.js`

### List Projects
- **Endpoint**: `GET /crm/projects/`
- **Query Parameters**:
  - `limit`, `offset` - Pagination
  - `contact_id` (UUID) - Filter by contact
  - `status` (string) - Filter by status
- **Response**: Array of project objects

### Create Project
- **Endpoint**: `POST /crm/projects/`
- **Request Body**:
```json
{
  "contact_id": "uuid",
  "name": "Website Redesign",
  "description": "Complete website overhaul",
  "status": "in_progress",
  "start_date": "2026-01-01",
  "end_date": "2026-03-31"
}
```
- **Response**: Created project object

---

## Caching Behavior

### Current Implementation (Module-Level Cache)
- **Location**: `/src/services/api/crm/contactStatuses.js` (and similar)
- **TTL**: 5 minutes
- **Mechanism**: Module-level `cachedData` and `cacheTimestamp` variables
- **Issues**:
  - No request deduplication (multiple simultaneous calls = multiple API requests)
  - Race conditions possible
  - No automatic invalidation
  - Manual refresh required after mutations

### React Query Target Behavior
- **TTL**: 5 minutes (staleTime) - matches current cache
- **Cache Time**: 10 minutes - keeps data available longer
- **Features**:
  - Automatic request deduplication
  - Optimistic updates with rollback
  - Automatic background refetching
  - Smart cache invalidation after mutations

---

## Error Handling

All endpoints follow consistent error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

**HTTP Status Codes**:
- `200` - Success with response body
- `201` - Created (POST)
- `204` - Success with no content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate entry)
- `500` - Internal Server Error

---

## Known Issues & TODOs

### 1. Contact Update Returns Incomplete Data
**Issue**: `PATCH /crm/contacts/{contact_id}` returns contact without nested relationships
**Impact**: Frontend loses services/appointments/projects data after drag-and-drop
**Workaround**: None currently - requires backend fix
**Reference**: `/docs/frontend/ISSUE-contact-update-incomplete-response.md`

### 2. No Request Deduplication
**Issue**: Multiple simultaneous calls to same endpoint = multiple API requests
**Impact**: Unnecessary load on server, slower UI
**Solution**: React Query will handle this automatically

### 3. Manual Cache Invalidation
**Issue**: After mutations, must manually call `refresh()` or set `refreshKey`
**Impact**: Easy to forget, leads to stale data
**Solution**: React Query automatic invalidation

---

## Migration Notes for React Query

### Query Keys Mapping

Use centralized query keys from `/src/lib/query-keys.js`:

```javascript
// Contacts
queryKeys.contacts.list(filters)    // GET /crm/contacts/?{filters}
queryKeys.contacts.detail(id)       // GET /crm/contacts/{id}

// Statuses
queryKeys.statuses.combined()       // GET /crm/statuses/available

// Services
queryKeys.services.list()           // GET /crm/services/
queryKeys.services.byContact(id)    // Contact-specific services
```

### Cache Invalidation After Mutations

```javascript
// After updating contact
queryClient.invalidateQueries(queryKeys.contacts.detail(contactId));
queryClient.invalidateQueries(queryKeys.contacts.lists());

// After updating statuses (affects all CRM views)
queryClient.invalidateQueries(queryKeys.statuses.all);
queryClient.invalidateQueries(queryKeys.contacts.all); // Contacts have status data
```

### Optimistic Updates Pattern

```javascript
// Before mutation
onMutate: async (newData) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries(queryKeys.contacts.lists());

  // Snapshot previous value
  const previous = queryClient.getQueryData(queryKeys.contacts.lists());

  // Optimistically update
  queryClient.setQueryData(queryKeys.contacts.lists(), (old) => {
    return old.map(contact =>
      contact.id === newData.id ? { ...contact, ...newData } : contact
    );
  });

  return { previous };
},

// On error, rollback
onError: (err, newData, context) => {
  queryClient.setQueryData(queryKeys.contacts.lists(), context.previous);
},

// Always refetch
onSettled: () => {
  queryClient.invalidateQueries(queryKeys.contacts.lists());
}
```

---

**End of Documentation**
