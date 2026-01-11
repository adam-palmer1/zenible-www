# CRM Backend API Requirements

This document outlines the backend API endpoints required to support the CRM feature in the Zenible web application.

## Base URL
All endpoints are prefixed with: `/api/v1/crm`

## Authentication
All endpoints require Bearer token authentication via the `Authorization` header.

## Endpoints

### 1. Get Opportunities

**Endpoint:** `GET /api/v1/crm/opportunities`

**Description:** Retrieve a list of opportunities with optional filtering, sorting, and pagination.

**Query Parameters:**
- `status` (optional): Filter by opportunity status (opt-in, booked-call, cancelled-call, no-show, booked-person)
- `search` (optional): Search opportunities by name or other fields
- `sortBy` (optional): Field to sort by (default: createdAt). Options: createdAt, updatedAt, name, amount
- `order` (optional): Sort order (asc, desc). Default: desc
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "opportunities": [
    {
      "id": 1,
      "name": "Leo",
      "amount": 0,
      "period": "30 days Fast Start",
      "status": "opt-in",
      "contactInfo": {
        "email": "leo@example.com",
        "phone": "+1234567890"
      },
      "notes": "Initial contact made",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "totalCount": 245
}
```

---

### 2. Get Single Opportunity

**Endpoint:** `GET /api/v1/crm/opportunities/:id`

**Description:** Retrieve detailed information about a specific opportunity.

**Path Parameters:**
- `id`: Opportunity ID

**Response:**
```json
{
  "id": 1,
  "name": "Leo",
  "amount": 0,
  "period": "30 days Fast Start",
  "status": "opt-in",
  "contactInfo": {
    "email": "leo@example.com",
    "phone": "+1234567890"
  },
  "notes": "Initial contact made. Follow-up scheduled for next week.",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

### 3. Create Opportunity

**Endpoint:** `POST /api/v1/crm/opportunities`

**Description:** Create a new opportunity.

**Request Body:**
```json
{
  "name": "New Client",
  "amount": 5000,
  "period": "30 days Fast Start",
  "status": "opt-in",
  "contactInfo": {
    "email": "client@example.com",
    "phone": "+1234567890"
  },
  "notes": "Met at networking event"
}
```

**Required Fields:**
- `name`: string
- `status`: string (must be one of: opt-in, booked-call, cancelled-call, no-show, booked-person)

**Optional Fields:**
- `amount`: number (default: 0)
- `period`: string (default: "30 days Fast Start")
- `contactInfo`: object
- `notes`: string

**Response:**
```json
{
  "id": 246,
  "name": "New Client",
  "amount": 5000,
  "period": "30 days Fast Start",
  "status": "opt-in",
  "contactInfo": {
    "email": "client@example.com",
    "phone": "+1234567890"
  },
  "notes": "Met at networking event",
  "createdAt": "2025-01-20T14:22:00Z",
  "updatedAt": "2025-01-20T14:22:00Z"
}
```

---

### 4. Update Opportunity

**Endpoint:** `PUT /api/v1/crm/opportunities/:id`

**Description:** Update an existing opportunity.

**Path Parameters:**
- `id`: Opportunity ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Client Name",
  "amount": 7500,
  "period": "60 days Advanced",
  "status": "booked-call",
  "contactInfo": {
    "email": "updated@example.com",
    "phone": "+9876543210"
  },
  "notes": "Call scheduled for tomorrow"
}
```

**Response:**
```json
{
  "id": 246,
  "name": "Updated Client Name",
  "amount": 7500,
  "period": "60 days Advanced",
  "status": "booked-call",
  "contactInfo": {
    "email": "updated@example.com",
    "phone": "+9876543210"
  },
  "notes": "Call scheduled for tomorrow",
  "createdAt": "2025-01-20T14:22:00Z",
  "updatedAt": "2025-01-20T15:45:00Z"
}
```

---

### 5. Delete Opportunity

**Endpoint:** `DELETE /api/v1/crm/opportunities/:id`

**Description:** Delete an opportunity.

**Path Parameters:**
- `id`: Opportunity ID

**Response:**
```json
{
  "success": true,
  "message": "Opportunity deleted successfully"
}
```

---

### 6. Update Opportunity Status

**Endpoint:** `PATCH /api/v1/crm/opportunities/:id/status`

**Description:** Update only the status of an opportunity (used for drag-and-drop in kanban board).

**Path Parameters:**
- `id`: Opportunity ID

**Request Body:**
```json
{
  "status": "booked-call"
}
```

**Required Fields:**
- `status`: string (must be one of: opt-in, booked-call, cancelled-call, no-show, booked-person)

**Response:**
```json
{
  "id": 246,
  "status": "booked-call",
  "updatedAt": "2025-01-20T16:30:00Z"
}
```

---

### 7. Get Summary Statistics

**Endpoint:** `GET /api/v1/crm/summary`

**Description:** Retrieve summary statistics for all opportunity statuses.

**Query Parameters:**
- `dateRange` (optional): Filter by date range (7days, 30days, 90days, custom)
- `startDate` (optional): Start date for custom range (ISO 8601)
- `endDate` (optional): End date for custom range (ISO 8601)

**Response:**
```json
{
  "optin": {
    "leadCount": 69,
    "amount": 125000
  },
  "bookedcall": {
    "leadCount": 42,
    "amount": 89000
  },
  "cancelledcall": {
    "leadCount": 12,
    "amount": 15000
  },
  "noshow": {
    "leadCount": 8,
    "amount": 0
  },
  "bookedperson": {
    "leadCount": 25,
    "amount": 150000
  },
  "total": {
    "leadCount": 156,
    "amount": 379000
  }
}
```

---

### 8. Search Opportunities

**Endpoint:** `GET /api/v1/crm/search`

**Description:** Search opportunities by query string.

**Query Parameters:**
- `query`: Search query string

**Response:**
```json
{
  "opportunities": [
    {
      "id": 1,
      "name": "Leo",
      "amount": 0,
      "period": "30 days Fast Start",
      "status": "opt-in",
      "contactInfo": {
        "email": "leo@example.com",
        "phone": "+1234567890"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

## Future Endpoints (for Top Bar Features)

These endpoints are not required for the initial CRM implementation but will be needed when integrating the top bar search and notifications:

### Notifications

**Get Notifications:** `GET /api/v1/notifications`
**Get Unread Count:** `GET /api/v1/notifications/unread-count`
**Mark as Read:** `POST /api/v1/notifications/:id/mark-read`

### Global Search

**Global Search:** `GET /api/v1/search/global?query={query}&filters={filters}`

---

## Error Responses

All endpoints should return appropriate HTTP status codes and error messages:

**400 Bad Request:**
```json
{
  "detail": "Invalid status value. Must be one of: opt-in, booked-call, cancelled-call, no-show, booked-person"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "detail": "You don't have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "detail": "Opportunity not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "An unexpected error occurred"
}
```

---

## Data Validation Rules

1. **Status Values:** Must be one of: `opt-in`, `booked-call`, `cancelled-call`, `no-show`, `booked-person`
2. **Amount:** Must be a non-negative number
3. **Name:** Required, max length 255 characters
4. **Email:** Must be valid email format
5. **Phone:** Optional, should follow E.164 format or local format
6. **Period:** String, max length 100 characters

---

## Performance Requirements

- All list endpoints should support pagination
- Search queries should be optimized with database indexes
- Response time should be < 500ms for most queries
- Support for concurrent users handling drag-and-drop operations

---

## Security Requirements

1. All endpoints require authentication
2. Users can only access their own opportunities
3. Rate limiting: 100 requests per minute per user
4. Input validation and sanitization required on all endpoints
5. SQL injection protection
6. XSS protection in all string fields

---

## Testing Checklist

- [ ] Create opportunity with valid data
- [ ] Create opportunity with missing required fields (should fail)
- [ ] Create opportunity with invalid status (should fail)
- [ ] Update opportunity status via drag-and-drop
- [ ] Update full opportunity details
- [ ] Delete opportunity
- [ ] Get opportunities with filters
- [ ] Get opportunities with pagination
- [ ] Search opportunities
- [ ] Get summary statistics
- [ ] Handle concurrent status updates
- [ ] Verify authentication on all endpoints
- [ ] Test rate limiting

---

## Implementation Notes

1. The frontend will poll for summary statistics every 30 seconds
2. Drag-and-drop operations use optimistic updates on the frontend
3. Real-time updates via WebSocket can be added in the future
4. Consider adding activity logs for opportunity changes
5. Consider adding file attachments support in the future
