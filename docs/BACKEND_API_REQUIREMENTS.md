# Backend API Requirements for Financial Analytics & Reporting

This document outlines the backend API endpoints that need to be implemented in the Zenible backend to support the financial analytics and reporting features migrated from Zantra.

## Overview

The frontend has been migrated with comprehensive financial analytics components. The backend needs to implement the following endpoint categories:

1. **Dashboard Widget Management** - Widget configuration and layout
2. **Dashboard Widget Data** - Real-time financial data for widgets
3. **Financial Analytics** - Detailed analytics for invoices, expenses, payments, quotes
4. **Activity Tracking** - Audit logs and activity feeds

---

## 1. Dashboard Widget Management

### Base Endpoint
`/api/v1/dashboard`

### Endpoints

#### `GET /dashboard/widget-types`
Get available widget types.

**Query Parameters:**
- `category` (optional): Filter by category (financial, analytics, business, system)
- `is_active` (optional, boolean, default: true): Only show active widgets

**Response:**
```json
{
  "widget_types": [
    {
      "id": "uuid",
      "type": "income_overview",
      "name": "Income Overview",
      "description": "Revenue tracking with customizable time periods",
      "category": "financial",
      "is_active": true,
      "default_config": {
        "time_period": "month",
        "chart_type": "line",
        "show_trend": true
      }
    },
    {
      "id": "uuid",
      "type": "expense_summary",
      "name": "Expense Summary",
      "description": "Spending analysis by category",
      "category": "financial",
      "is_active": true,
      "default_config": {
        "time_period": "month",
        "chart_type": "doughnut",
        "show_categories": 5
      }
    }
  ]
}
```

#### `GET /dashboard/widgets`
Get user's configured dashboard widgets.

**Query Parameters:**
- `is_visible` (optional, boolean): Filter by visibility
- `category` (optional): Filter by widget category

**Response:**
```json
{
  "widgets": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "widget_type": "income_overview",
      "position": 0,
      "is_visible": true,
      "config": {
        "time_period": "month",
        "chart_type": "line"
      },
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /dashboard/widgets`
Add widget to user's dashboard.

**Request Body:**
```json
{
  "widget_type": "income_overview",
  "position": 0,
  "config": {
    "time_period": "month",
    "chart_type": "line"
  }
}
```

**Response:** Created widget object

#### `PUT /dashboard/widgets/{widget_id}`
Update widget configuration.

**Request Body:**
```json
{
  "position": 1,
  "is_visible": true,
  "config": {
    "time_period": "year",
    "chart_type": "bar"
  }
}
```

**Response:** Updated widget object

#### `DELETE /dashboard/widgets/{widget_id}`
Remove widget from dashboard.

**Response:** 204 No Content

#### `POST /dashboard/widgets/bulk-update`
Update multiple widget positions/configurations at once.

**Request Body:**
```json
{
  "updates": [
    {
      "widget_id": "uuid",
      "position": 0,
      "is_visible": true
    },
    {
      "widget_id": "uuid",
      "position": 1,
      "is_visible": true
    }
  ]
}
```

**Response:**
```json
{
  "updated_count": 2,
  "widgets": [...]
}
```

#### `POST /dashboard/widgets/reset`
Reset dashboard to default layout.

**Response:**
```json
{
  "widgets": [
    {
      "widget_type": "quick_stats",
      "position": 0,
      "config": {...}
    }
  ]
}
```

---

## 2. Dashboard Widget Data

### Endpoints

#### `GET /dashboard/widgets/{widget_id}/data`
Get real-time data for a specific widget.

**Query Parameters:**
- `time_period` (optional): week, month, 3_months, 6_months, year
- `filters` (optional, JSON): Additional filters (currency, category, status, etc.)

**Response Format (varies by widget type):**

**For `income_overview`:**
```json
{
  "widget_id": "uuid",
  "widget_type": "income_overview",
  "data": {
    "total": 125000.00,
    "currency": "USD",
    "chart_type": "line",
    "data_points": [
      {
        "date": "2025-01-01",
        "value": 15000.00,
        "label": "Jan 1"
      },
      {
        "date": "2025-01-08",
        "value": 18000.00,
        "label": "Jan 8"
      }
    ],
    "trend": {
      "percentage": 12.5,
      "direction": "up",
      "period": "from last month"
    }
  },
  "last_updated": "2025-01-15T10:00:00Z"
}
```

**For `expense_summary`:**
```json
{
  "widget_id": "uuid",
  "widget_type": "expense_summary",
  "data": {
    "total": 45000.00,
    "currency": "USD",
    "chart_type": "doughnut",
    "categories": [
      {
        "name": "Marketing",
        "value": 15000.00,
        "percentage": 33.3,
        "color": "#8e51ff"
      },
      {
        "name": "Operations",
        "value": 12000.00,
        "percentage": 26.7,
        "color": "#10B981"
      }
    ]
  },
  "last_updated": "2025-01-15T10:00:00Z"
}
```

**For `invoice_status`:**
```json
{
  "widget_id": "uuid",
  "widget_type": "invoice_status",
  "data": {
    "statuses": [
      {
        "status": "paid",
        "count": 45,
        "total_amount": 125000.00,
        "percentage": 60.0
      },
      {
        "status": "sent",
        "count": 20,
        "total_amount": 50000.00,
        "percentage": 26.7
      },
      {
        "status": "overdue",
        "count": 10,
        "total_amount": 25000.00,
        "percentage": 13.3
      }
    ],
    "currency": "USD"
  },
  "last_updated": "2025-01-15T10:00:00Z"
}
```

**For `quick_stats`:**
```json
{
  "widget_id": "uuid",
  "widget_type": "quick_stats",
  "data": {
    "stats": [
      {
        "key": "total_revenue",
        "label": "Total Revenue",
        "value": 125000,
        "trend": {
          "percentage": 12.5,
          "direction": "up"
        },
        "icon": "DollarSign",
        "color": "green"
      },
      {
        "key": "total_clients",
        "label": "Total Clients",
        "value": 87,
        "trend": {
          "percentage": 5.2,
          "direction": "up"
        },
        "icon": "Users",
        "color": "blue"
      }
    ],
    "currency_symbol": "$"
  },
  "last_updated": "2025-01-15T10:00:00Z"
}
```

**For `monthly_comparison`:**
```json
{
  "widget_id": "uuid",
  "widget_type": "monthly_comparison",
  "data": {
    "comparison_data": [
      {
        "period_label": "Jan",
        "revenue": 125000,
        "expenses": 45000,
        "invoice_count": 45,
        "client_count": 87
      },
      {
        "period_label": "Feb",
        "revenue": 135000,
        "expenses": 48000,
        "invoice_count": 52,
        "client_count": 92
      }
    ],
    "current_month": {
      "revenue": 135000,
      "expenses": 48000,
      "invoice_count": 52,
      "client_count": 92
    },
    "previous_month": {
      "revenue": 125000,
      "expenses": 45000,
      "invoice_count": 45,
      "client_count": 87
    },
    "currency_symbol": "$"
  },
  "last_updated": "2025-01-15T10:00:00Z"
}
```

#### `POST /dashboard/widgets/bulk-data`
Get data for multiple widgets in a single request (performance optimization).

**Request Body:**
```json
{
  "widget_requests": [
    {
      "widget_id": "uuid",
      "time_period": "month",
      "filters": {
        "currency": "USD"
      }
    },
    {
      "widget_id": "uuid",
      "time_period": "6_months"
    }
  ]
}
```

**Simplified Format (all widgets with same time period):**
```json
{
  "widget_ids": ["uuid1", "uuid2", "uuid3"],
  "time_period": "month",
  "filters": {
    "currency": "USD"
  }
}
```

**Response:**
```json
{
  "widgets": [
    {
      "widget_id": "uuid1",
      "data": {...},
      "error": null
    },
    {
      "widget_id": "uuid2",
      "data": {...},
      "error": null
    }
  ],
  "total_count": 2,
  "failed_count": 0
}
```

#### `GET /dashboard/summary`
Get dashboard summary statistics.

**Response:**
```json
{
  "total_widgets": 8,
  "visible_widgets": 6,
  "categories": {
    "financial": 4,
    "analytics": 2,
    "business": 1,
    "system": 1
  },
  "last_updated": "2025-01-15T10:00:00Z"
}
```

---

## 3. Financial Analytics Endpoints

### Expense Analytics

#### `GET /api/v1/crm/expenses/analytics`
Get comprehensive expense analytics.

**Query Parameters:**
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date
- `category_id` (optional): Filter by category
- `vendor_id` (optional): Filter by vendor

**Response:**
```json
{
  "total_expenses": 45000.00,
  "total_transactions": 156,
  "avg_expense_amount": 288.46,
  "currency": "USD",
  "date_range": {
    "start": "2024-01-01",
    "end": "2025-01-15"
  }
}
```

#### `GET /api/v1/crm/expenses/category-breakdown`
Get expense breakdown by category.

**Query Parameters:**
- `start_date`, `end_date`, `limit` (optional)

**Response:**
```json
{
  "categories": [
    {
      "category_id": "uuid",
      "category_name": "Marketing",
      "total_amount": 15000.00,
      "transaction_count": 45,
      "percentage": 33.3,
      "avg_amount": 333.33,
      "growth_rate": 12.5
    },
    {
      "category_id": "uuid",
      "category_name": "Operations",
      "total_amount": 12000.00,
      "transaction_count": 38,
      "percentage": 26.7,
      "avg_amount": 315.79,
      "growth_rate": -5.2
    }
  ],
  "total": 45000.00,
  "currency": "USD"
}
```

#### `GET /api/v1/crm/expenses/vendor-analysis`
Get expense analysis by vendor.

**Query Parameters:**
- `start_date`, `end_date`, `limit` (optional)

**Response:**
```json
{
  "vendors": [
    {
      "vendor_id": "uuid",
      "vendor_name": "AWS",
      "total_amount": 8500.00,
      "transaction_count": 12,
      "avg_transaction": 708.33,
      "percentage": 18.9,
      "last_transaction_date": "2025-01-10"
    }
  ],
  "total": 45000.00,
  "currency": "USD"
}
```

#### `GET /api/v1/crm/expenses/monthly-trends`
Get monthly expense trends.

**Query Parameters:**
- `months` (optional, default: 6): Number of months to include

**Response:**
```json
{
  "trends": [
    {
      "month": "2024-08",
      "month_label": "Aug 2024",
      "total_amount": 6500.00,
      "transaction_count": 22,
      "avg_amount": 295.45,
      "top_category": "Marketing",
      "growth_from_previous": 8.5
    },
    {
      "month": "2024-09",
      "month_label": "Sep 2024",
      "total_amount": 7200.00,
      "transaction_count": 25,
      "avg_amount": 288.00,
      "top_category": "Operations",
      "growth_from_previous": 10.8
    }
  ],
  "currency": "USD"
}
```

### Invoice Analytics

#### `GET /api/v1/invoices/summary`
Get invoice summary statistics.

**Query Parameters:**
- `start_date`, `end_date`, `contact_id`, `status` (optional)

**Response:**
```json
{
  "total_invoices": 125,
  "total_amount": 250000.00,
  "paid_amount": 175000.00,
  "pending_amount": 50000.00,
  "overdue_amount": 25000.00,
  "by_status": {
    "draft": 10,
    "sent": 30,
    "paid": 75,
    "overdue": 10
  },
  "currency": "USD",
  "avg_invoice_amount": 2000.00
}
```

#### `GET /api/v1/invoices/monthly-revenue`
Get monthly revenue breakdown.

**Query Parameters:**
- `months` (optional, default: 6)

**Response:**
```json
{
  "revenue": [
    {
      "month": "2024-08",
      "month_label": "Aug 2024",
      "total_revenue": 35000.00,
      "invoice_count": 18,
      "paid_count": 15,
      "avg_invoice": 1944.44
    }
  ],
  "currency": "USD"
}
```

### Payment Analytics

#### `GET /api/v1/payments/summary`
Get payment summary statistics.

**Query Parameters:**
- `contact_id` (optional)

**Response:**
```json
{
  "total_payments": 95,
  "total_amount": 175000.00,
  "total_applied": 170000.00,
  "total_remaining": 5000.00,
  "by_status": {
    "pending": 5,
    "completed": 85,
    "refunded": 5
  },
  "by_method": {
    "credit_card": 60,
    "bank_transfer": 25,
    "paypal": 10
  },
  "currency": "USD"
}
```

### Quote Analytics

#### `GET /api/v1/quotes/summary`
Get quote summary statistics.

**Response:**
```json
{
  "total_quotes": 45,
  "total_value": 125000.00,
  "by_status": {
    "draft": 8,
    "sent": 15,
    "accepted": 18,
    "rejected": 4
  },
  "acceptance_rate": 60.0,
  "avg_quote_value": 2777.78,
  "currency": "USD"
}
```

---

## 4. Activity Tracking & Audit Logs

### Endpoints

#### `GET /api/v1/audit/summary`
Get audit log summary statistics.

**Query Parameters:**
- `company_id`, `start_date`, `end_date` (optional)

**Response:**
```json
{
  "total_logs": 15234,
  "success_count": 14892,
  "failure_count": 312,
  "error_count": 30,
  "unique_users": 15,
  "unique_companies": 1,
  "top_actions": [
    {
      "action": "invoice.created",
      "count": 125
    },
    {
      "action": "expense.created",
      "count": 98
    }
  ],
  "top_resources": [
    {
      "resource_type": "invoice",
      "count": 345
    },
    {
      "resource_type": "expense",
      "count": 256
    }
  ]
}
```

#### `GET /api/v1/audit/stats`
Get detailed audit statistics (system owners only).

**Query Parameters:**
- `days` (1-365, default: 30)
- `company_id` (optional)

**Response:**
```json
{
  "daily_stats": [
    {
      "date": "2025-01-15",
      "success_count": 450,
      "failure_count": 12,
      "error_count": 2
    }
  ],
  "action_breakdown": {
    "invoice.created": 125,
    "expense.created": 98,
    "payment.received": 65
  },
  "status_breakdown": {
    "success": 14892,
    "failure": 312,
    "error": 30
  },
  "user_activity": [
    {
      "user_id": "uuid",
      "user_email": "user@example.com",
      "action_count": 234
    }
  ],
  "company_activity": [
    {
      "company_id": "uuid",
      "company_name": "Acme Inc",
      "action_count": 1234
    }
  ]
}
```

---

## 5. Database Models Required

### DashboardWidgetType
```python
class DashboardWidgetType(Base):
    id: UUID
    type: str  # e.g., "income_overview"
    name: str
    description: str
    category: str  # financial, analytics, business, system
    is_active: bool
    default_config: JSON
    created_at: datetime
    updated_at: datetime
```

### UserDashboardWidget
```python
class UserDashboardWidget(Base):
    id: UUID
    user_id: UUID  # FK to users
    widget_type: str  # FK to DashboardWidgetType
    position: int
    is_visible: bool
    config: JSON
    created_at: datetime
    updated_at: datetime
```

---

## 6. Implementation Priority

### Phase 1: Core Analytics (High Priority)
1. ✅ Expense analytics endpoints (already partially implemented in Zenible)
2. Invoice summary and monthly revenue
3. Payment summary
4. Quote summary

### Phase 2: Dashboard Widgets (Medium Priority)
1. Widget type management
2. User widget configuration
3. Widget data endpoints (income_overview, expense_summary)
4. Quick stats widget data

### Phase 3: Advanced Features (Lower Priority)
1. Bulk widget data retrieval
2. Monthly comparison widget data
3. Audit log statistics
4. Activity feeds

---

## 7. Performance Considerations

### Caching Strategy
- Widget data should be cached for 5-15 minutes depending on data volatility
- Use Redis for caching widget data
- Invalidate cache on relevant data changes (new invoice, payment, expense)

### Query Optimization
- Use database indexes on:
  - `invoices.status`, `invoices.created_at`, `invoices.contact_id`
  - `expenses.expense_date`, `expenses.category_id`, `expenses.vendor_id`
  - `payments.created_at`, `payments.status`
  - `audit_logs.created_at`, `audit_logs.action`, `audit_logs.resource_type`

### Bulk Operations
- Implement bulk data retrieval to reduce HTTP overhead
- Support batch widget data requests

---

## 8. Security Considerations

### Authorization
- All endpoints require authentication (Bearer token)
- Widget data filtered by user's company/tenant
- System owner endpoints (audit stats) require admin role

### Rate Limiting
- Widget data endpoints: 100 requests/minute per user
- Bulk data endpoints: 20 requests/minute per user
- Analytics endpoints: 50 requests/minute per user

---

## 9. Testing Requirements

### Unit Tests
- Test each analytics calculation (totals, averages, percentages)
- Test date range filtering
- Test multi-currency handling

### Integration Tests
- Test widget creation, update, deletion
- Test widget data retrieval with various filters
- Test bulk operations

### Performance Tests
- Test widget data retrieval under load (100+ concurrent users)
- Test database query performance with large datasets (10k+ records)

---

## 10. Migration Notes

The frontend analytics components are already implemented and functional with client-side calculations. However, implementing these backend endpoints will:

1. **Improve Performance**: Move heavy calculations to the backend
2. **Enable Real-time Updates**: WebSocket support for live dashboard updates
3. **Support Multi-user Analytics**: Company-wide analytics across all users
4. **Enable Advanced Features**: Predictive analytics, ML-based insights

The current client-side implementation in ExpenseAnalytics.jsx can serve as a reference for the calculation logic needed in the backend.

---

## Summary

**Total Endpoints to Implement:** ~25

**Core Endpoints (Must Have):**
- Dashboard widget management (8 endpoints)
- Dashboard widget data (3 endpoints)
- Expense analytics (4 endpoints)
- Invoice/Payment/Quote summaries (4 endpoints)

**Optional Endpoints (Nice to Have):**
- Audit statistics (2 endpoints)
- Advanced analytics (4 endpoints)

**Estimated Development Time:**
- Phase 1 (Core Analytics): 2-3 weeks
- Phase 2 (Dashboard Widgets): 2-3 weeks
- Phase 3 (Advanced Features): 1-2 weeks

**Total:** 5-8 weeks for complete implementation
