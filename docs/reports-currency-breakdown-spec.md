# Reports API - Currency Breakdown Enhancement

## Overview
Add currency breakdown fields to the `/crm/reports/transactions/summary` endpoint to support multi-currency display in the Reports dashboard.

## Current Response
```json
{
  "total_count": 20,
  "total_amount": "2273.62",
  "income_total": "753.00",
  "expense_total": "1520.62",
  "net_amount": "-767.62",
  "outstanding_invoices": "246.00",
  "overdue_invoices": "0",
  "overdue_count": 0,
  "by_status": [...],
  "by_type": [...],
  "by_period": [...]
}
```

## Proposed Changes

### New Fields
Add the following currency breakdown fields to the summary response:

```json
{
  // Existing fields...
  "total_count": 20,
  "total_amount": "2273.62",
  "income_total": "753.00",
  "expense_total": "1520.62",
  "net_amount": "-767.62",
  "outstanding_invoices": "246.00",

  // NEW: Currency breakdowns
  "income_by_currency": [
    {
      "currency_id": "1b9ab18a-5e64-4912-a574-eaca3f34b906",
      "currency_code": "GBP",
      "currency_symbol": "£",
      "amount": "507.00"
    },
    {
      "currency_id": "b9f8892e-2cf9-42cd-b9bd-e75132eaec4d",
      "currency_code": "USD",
      "currency_symbol": "$",
      "amount": "246.00"
    }
  ],
  "expense_by_currency": [
    {
      "currency_id": "1b9ab18a-5e64-4912-a574-eaca3f34b906",
      "currency_code": "GBP",
      "currency_symbol": "£",
      "amount": "714.80"
    },
    {
      "currency_id": "b9f8892e-2cf9-42cd-b9bd-e75132eaec4d",
      "currency_code": "USD",
      "currency_symbol": "$",
      "amount": "805.82"
    }
  ],
  "outstanding_by_currency": [
    {
      "currency_id": "1b9ab18a-5e64-4912-a574-eaca3f34b906",
      "currency_code": "GBP",
      "currency_symbol": "£",
      "amount": "246.00"
    }
  ],

  // NEW: Default currency for main totals (converted amounts)
  "default_currency": {
    "id": "1b9ab18a-5e64-4912-a574-eaca3f34b906",
    "code": "GBP",
    "symbol": "£"
  }
}
```

### TypeScript Interface
```typescript
interface CurrencyAmount {
  currency_id: string;
  currency_code: string;
  currency_symbol: string;
  amount: string;  // Decimal as string
}

interface SimpleCurrency {
  id: string;
  code: string;
  symbol: string;
}

interface TransactionSummary {
  // Existing fields (totals in default currency)
  total_count: number;
  total_amount: string;
  income_total: string;      // Converted to default currency
  expense_total: string;     // Converted to default currency
  net_amount: string;        // Converted to default currency
  outstanding_invoices: string;
  overdue_invoices: string;
  overdue_count: number;

  // Currency breakdowns (NEW)
  income_by_currency: CurrencyAmount[];
  expense_by_currency: CurrencyAmount[];
  outstanding_by_currency: CurrencyAmount[];

  // Default currency info (NEW)
  default_currency: SimpleCurrency;

  // Existing breakdown arrays
  by_status: StatusAggregation[];
  by_type: TypeAggregation[];
  by_period?: PeriodAggregation[];
}
```

## Implementation Notes

### Main Totals
- `income_total`, `expense_total`, `net_amount`, `outstanding_invoices` should be **converted to the company's default currency** using current exchange rates
- This allows displaying a single meaningful total at the top of each card

### Currency Breakdown Arrays
- Group transactions by currency and sum amounts
- Include currency symbol for easy frontend display
- Only include currencies that have transactions (empty arrays are fine)
- Sort by amount descending (largest first)

### Income Calculation
- Sum of: paid invoices + completed payments
- Group by currency

### Expense Calculation
- Sum of: all expenses (regardless of status)
- Group by currency

### Outstanding Calculation
- Sum of: unpaid/partially paid invoices
- Group by currency

## Frontend Display Pattern

The KPI cards will display:
```
┌─────────────────────────────────────────────────────┐
│ Total Income                          [📈 icon]    │
│                                                      │
│ £753.00                                             │  ← Main total (default currency)
│                                                      │
│ £507.00 + $246.00                                   │  ← Breakdown (if multiple currencies)
└─────────────────────────────────────────────────────┘
```

- Main value shows total converted to default currency
- Subtitle shows breakdown only if 2+ currencies exist
- Format: `{symbol}{amount}` joined with ` + `

## Migration
- No breaking changes to existing fields
- New fields are additive
- Frontend can check for field existence and gracefully degrade
