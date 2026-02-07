# TypeScript Migration Plan - Zenible Web

## Executive Summary

**Codebase Size:** 508 JavaScript files (380 `.jsx` + 128 `.js`) + 1 existing `.ts` file
**Framework:** React 19.1.1 + Vite 7.1.2
**Key Libraries:** TanStack Query, React Hook Form + Zod, React Router 7, Radix UI
**Estimated Scope:** ~509 files to convert across 6 major domains

---

## Phase 0: Foundation & Tooling Setup

### 0.1 Install TypeScript and Type Dependencies

```bash
npm install -D typescript @types/node
# Already installed: @types/react @types/react-dom
npm install -D @types/uuid @types/react-grid-layout
```

### 0.2 Create `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    // Relaxed settings for incremental migration:
    "allowJs": true,
    "checkJs": false,
    "noImplicitAny": false,           // Enable later
    "strictNullChecks": false,         // Enable later
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*", "vite-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 0.3 Create `tsconfig.strict.json` (target config for after migration)

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "allowJs": false,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true
  }
}
```

### 0.4 Create `vite-env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_HOME_URL: string;
  readonly VITE_HOST: string;
  readonly VITE_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 0.5 Update Vite Configuration

- Update `vite.config.js` -> `vite.config.ts`
- Update `vite.call-widget.config.js` -> `vite.call-widget.config.ts`
- Vite already supports TypeScript natively; no plugin changes needed

### 0.6 Update ESLint for TypeScript

```bash
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Update `eslint.config.js` to include TypeScript parser and rules.

### 0.7 Update Vitest for TypeScript

- Vitest supports TypeScript natively via Vite
- Update test setup file: `src/test/setup.js` -> `src/test/setup.ts`
- Update `vitest.config.js` -> `vitest.config.ts`

### 0.8 Add Type-Check Script to `package.json`

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch"
  }
}
```

---

## Phase 1: API Types from OpenAPI Spec (Auto-Generation)

### 1.1 Install OpenAPI Type Generator

```bash
npm install -D openapi-typescript
```

### 1.2 Generate Types from OpenAPI Spec

```bash
npx openapi-typescript https://api.zenible.com/api/v1/openapi.json -o src/types/api.generated.ts
```

This will auto-generate TypeScript interfaces for **all** API schemas:
- `UserResponse`, `UserDetailResponse`, `UserList`
- `Token`, `SetPasswordResponse`
- `PlanResponse`, `PlanCreate`, `PlanUpdate`
- `SubscriptionResponse`, `SubscriptionCreate`
- `PaymentResponse`, `PaymentIntentCreate`
- `AICharacterResponse`, `AICharacterCreate`
- `PreferenceResponse`, `PreferenceUpdate`
- All validation error types
- All enum types (roles, statuses, providers)

### 1.3 Create Supplementary Types (Not in OpenAPI)

The OpenAPI spec covers auth/users/plans/subscriptions/payments/AI/preferences but **NOT** the CRM and Finance domains. These must be created manually.

**File: `src/types/crm.ts`** - CRM domain types

```typescript
// Contacts
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  email?: string;
  phone?: string;
  status_id?: string;
  status?: ContactStatus;
  company_id?: string;
  confirmed_recurring_total?: number;
  active_recurring_total?: number;
  confirmed_one_off_total?: number;
  active_one_off_total?: number;
  one_off_total?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // ... additional fields from API responses
}

// Contact Status
interface ContactStatus {
  id: string;
  name: string;
  friendly_name: string;
  color: string;
  is_custom: boolean;
  sort_order: number;
}

// Services, Projects, Appointments, Companies, etc.
// (Full definitions derived from API service files)
```

**File: `src/types/finance.ts`** - Finance domain types

```typescript
// Invoice, Quote, Expense, Payment, CreditNote, Report types
// LineItem, Tax, Allocation types
// Recurring billing types
```

**File: `src/types/common.ts`** - Shared types

```typescript
// Pagination
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// API Error
interface APIError {
  detail: string | ValidationError[];
  message?: string;
  status?: number;
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Number Format
interface NumberFormat {
  decimal_separator: string;
  thousands_separator: string;
  format_string: string;
  name: string;
}

// Sort, Filter, DateRange types
```

**File: `src/types/websocket.ts`** - WebSocket/streaming types

```typescript
interface ConnectionHealth {
  isHealthy: boolean;
  lastPing: number;
  latency: number;
  reconnectCount: number;
  connectionQuality: string;
}
```

### 1.4 Create Type Barrel File

**File: `src/types/index.ts`**

```typescript
export * from './api.generated';
export * from './crm';
export * from './finance';
export * from './common';
export * from './websocket';
export * from './emailTemplate';  // already exists
```

---

## Phase 2: Core Infrastructure (Bottom-Up)

Convert foundational files that everything depends on first.

### 2.1 Constants (6 files)

| File | Effort | Notes |
|------|--------|-------|
| `src/constants/finance.js` -> `.ts` | Medium | Add `as const` assertions to all constant objects. Export inferred literal types. |
| `src/constants/crm.js` -> `.ts` | Medium | Same pattern. Define enum-like union types. |

**Pattern to apply:**
```typescript
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  // ...
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
```

### 2.2 Utility Functions (12 files)

Convert in dependency order:

| Priority | File | Dependencies | Notes |
|----------|------|-------------|-------|
| 1 | `utils/stateHelpers.js` -> `.ts` | None | Add generics: `removeItem<T>(array: T[], id: string): T[]` |
| 2 | `utils/numberFormatUtils.js` -> `.ts` | NumberFormat type | Add `NumberFormat` interface usage |
| 3 | `utils/currency.js` -> `.ts` | NumberFormat | Add return types to all exports |
| 4 | `utils/currencyUtils.js` -> `.ts` | NumberFormat | Smaller currency utils |
| 5 | `utils/invoiceCalculations.js` -> `.ts` | LineItem types | Type all calculation inputs/outputs |
| 6 | `utils/recurringBilling.js` -> `.ts` | date-fns (already typed) | Add RecurringType union |
| 7 | `utils/csvParser.js` -> `.ts` | Expense types | Type row validation |
| 8 | `utils/expenseFieldFormatter.js` -> `.ts` | Expense types | Field mapping types |
| 9 | `utils/schemaValidation.js` -> `.ts` | None | JSON Schema types |
| 10 | `utils/iconUtils.js` -> `.ts` | None | Icon name union type |
| 11 | `utils/auth.js` -> `.ts` | API types | Auth token types, API response types |
| 12 | `utils/crm/*.js` -> `.ts` (3 files) | CRM types | Contact, appointment, value types |

### 2.3 Configuration Files (2 files)

| File | Notes |
|------|-------|
| `src/config/api.js` -> `.ts` | Type the ApiClient class, endpoint definitions, header functions |
| `src/lib/react-query.js` -> `.ts` | Already well-typed by TanStack Query |
| `src/lib/query-keys.js` -> `.ts` | Add type safety to query key factory |

---

## Phase 3: HTTP Client & API Service Layer

### 3.1 HTTP Client (1 file - critical path)

**File: `src/services/api/httpClient.js` -> `.ts`**

This is the most important file to type correctly as all API services depend on it.

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiErrorResponse {
  detail: string | ValidationError[];
  message?: string;
}

// Typed request factory
function createRequest(context: string): <T>(endpoint: string, options?: RequestOptions) => Promise<T>;

// Typed base API class
class BaseAPI {
  protected request: ReturnType<typeof createRequest>;
  constructor(context: string);
  protected cleanParams(params: Record<string, unknown>): Record<string, string>;
  protected buildQueryString(params: Record<string, unknown>): string;
}
```

### 3.2 CRM API Services (26 files)

Each service file follows a consistent pattern. Convert in this order:

| Priority | File | Endpoints | Complexity |
|----------|------|-----------|------------|
| 1 | `services/api/crm/index.js` | Barrel export | Low |
| 2 | `services/api/crm/contacts.js` | 30+ endpoints | High |
| 3 | `services/api/crm/companies.js` | 6 endpoints | Low |
| 4 | `services/api/crm/appointments.js` | 15+ endpoints | Medium |
| 5 | `services/api/crm/projects.js` | 10 endpoints | Medium |
| 6 | `services/api/crm/services.js` | 6 endpoints | Low |
| 7 | `services/api/crm/statuses.js` | 5 endpoints | Low |
| 8 | `services/api/crm/currencies.js` | 6 endpoints | Low |
| 9 | `services/api/crm/taxes.js` | CRUD | Low |
| 10 | `services/api/crm/countries.js` | Read-only | Low |
| 11 | `services/api/crm/industries.js` | Read-only | Low |
| 12 | `services/api/crm/employeeRanges.js` | Read-only | Low |
| 13 | `services/api/crm/vendorTypes.js` | Read-only | Low |
| 14 | `services/api/crm/contactStatuses.js` | CRUD | Low |
| 15 | `services/api/crm/contactPersons.js` | CRUD | Low |
| 16 | `services/api/crm/contactFiles.js` | File uploads | Medium |
| 17 | `services/api/crm/companyAttributes.js` | CRUD | Low |
| 18 | `services/api/crm/companyUsers.js` | CRUD | Low |
| 19 | `services/api/crm/numberFormats.js` | Read-only | Low |
| 20 | `services/api/crm/emailTemplates.js` | CRUD | Medium |
| 21 | `services/api/crm/billableHours.js` | CRUD | Low |
| 22 | `services/api/crm/bookingSettings.js` | Settings CRUD | Medium |
| 23 | `services/api/crm/callTypes.js` | CRUD | Low |
| 24 | `services/api/crm/appointmentEnums.js` | Read-only | Low |
| 25 | `services/api/crm/currencyConversion.js` | Conversion | Low |
| 26 | `services/api/crm/zoom.js` | OAuth flow | Medium |

**Typed service pattern:**
```typescript
import type { Contact, PaginatedResponse } from '@/types';

class ContactsAPI extends BaseAPI {
  async list(params?: ContactListParams): Promise<PaginatedResponse<Contact>> { ... }
  async get(id: string): Promise<Contact> { ... }
  async create(data: ContactCreate): Promise<Contact> { ... }
  async update(id: string, data: Partial<ContactCreate>): Promise<Contact> { ... }
  async delete(id: string): Promise<void> { ... }
}
```

### 3.3 Finance API Services (8 files)

| File | Endpoints | Complexity |
|------|-----------|------------|
| `services/api/finance/index.js` | Barrel export | Low |
| `services/api/finance/invoices.js` | 35+ endpoints | High |
| `services/api/finance/quotes.js` | 25+ endpoints | High |
| `services/api/finance/expenses.js` | 30+ endpoints | High |
| `services/api/finance/payments.js` | 20+ endpoints | High |
| `services/api/finance/creditNotes.js` | 15+ endpoints | Medium |
| `services/api/finance/reports.js` | 5+ endpoints | Medium |
| `services/api/finance/paymentIntegrations.js` | OAuth + webhooks | Medium |

### 3.4 Other API Services (6 files)

| File | Notes |
|------|-------|
| `services/api/public/booking.js` | Public booking endpoints |
| `services/api/public/index.js` | Barrel export |
| `services/adminAPI.js` | Admin dashboard API |
| `services/userAPI.js` | User profile API |
| `services/planAPI.js` | Plan/subscription API |
| `services/eventsAPI.js` | Events API |

### 3.5 Business Logic Services

| File | Notes |
|------|-------|
| `services/crm/*.js` | CRM business logic (non-API) |

---

## Phase 4: React Context Providers (15 files)

Convert contexts from innermost (fewest dependencies) to outermost.

| Priority | Context | State Complexity | Notes |
|----------|---------|-----------------|-------|
| 1 | `ModalPortalContext.jsx` -> `.tsx` | Low | Simple ref context |
| 2 | `NotificationContext.jsx` -> `.tsx` | Low | Toast + confirm state |
| 3 | `ContactActionsContext.jsx` -> `.tsx` | Low | Action handler callbacks |
| 4 | `UsageDashboardContext.jsx` -> `.tsx` | Medium | Usage limit types |
| 5 | `PreferencesContext.jsx` -> `.tsx` | Medium | Preference record types |
| 6 | `CRMReferenceDataContext.jsx` -> `.tsx` | Medium | All CRM reference data |
| 7 | `PaymentIntegrationsContext.jsx` -> `.tsx` | Medium | Stripe/PayPal state |
| 8 | `WebSocketContext.jsx` -> `.tsx` | High | Connection health, streaming |
| 9 | `AuthContext.jsx` -> `.tsx` | High | User, auth state, all auth methods |
| 10 | `CRMContext.jsx` -> `.tsx` | High | Contact selection, modals, filters |
| 11 | `InvoiceContext.jsx` -> `.tsx` | High | Invoice list, pagination, filters |
| 12 | `QuoteContext.jsx` -> `.tsx` | High | Quote list, pagination, filters |
| 13 | `ExpenseContext.jsx` -> `.tsx` | High | Expense list, categories, filters |
| 14 | `PaymentsContext.jsx` -> `.tsx` | High | Payment tracking, reconciliation |
| 15 | `ReportsContext.jsx` -> `.tsx` | High | Report data, filters |

**Typed context pattern:**
```typescript
interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // ... all methods
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## Phase 5: Custom Hooks (37 files)

### 5.1 Base/Shared Hooks

| Hook | Returns | Notes |
|------|---------|-------|
| `hooks/useDataFetch.ts` | Generic data fetching | Add generics `useDataFetch<T>()` |
| `hooks/useDebouncedPreference.ts` | Debounced setter | Simple typing |
| `hooks/useSSEStreaming.ts` | SSE connection | Event type unions |
| `hooks/useWebSocketConnection.ts` | WS state | ConnectionHealth type |
| `hooks/useCalendar.ts` | Calendar operations | Appointment types |
| `hooks/useBaseAIAnalysis.ts` | Base AI hook | Generic analysis result |

### 5.2 AI Analysis Hooks (4 files)

All extend `useBaseAIAnalysis` with specific input/output types.

### 5.3 CRM Hooks (22 files in `hooks/crm/`)

All follow a data-fetching pattern returning typed arrays with CRUD methods.

### 5.4 Finance Hooks (2 files in `hooks/finance/`)

### 5.5 Mutation Hooks (1 file in `hooks/mutations/`)

### 5.6 Query Hooks (1 file in `hooks/queries/`)

**Typed hook pattern:**
```typescript
interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  create: (data: ContactCreate) => Promise<Contact>;
  update: (id: string, data: Partial<ContactCreate>) => Promise<Contact>;
  delete: (id: string) => Promise<void>;
  refresh: () => void;
}

function useContacts(filters?: ContactFilters, options?: UseContactsOptions): UseContactsReturn;
```

---

## Phase 6: UI Components (45 files)

### 6.1 Base UI Components (`src/components/ui/`)

| Component | Props Interface | Notes |
|-----------|----------------|-------|
| `ui/modal/Modal.jsx` -> `.tsx` | `ModalProps` | Radix Dialog wrapper |
| `ui/form/Form.jsx` -> `.tsx` | `FormProps<T>` | React Hook Form provider (generic) |
| `ui/form/FormField.jsx` -> `.tsx` | `FormFieldProps` | Input field wrapper |
| `ui/form/FormSelect.jsx` -> `.tsx` | `FormSelectProps` | Select wrapper |
| `ui/form/FormCheckbox.jsx` -> `.tsx` | `FormCheckboxProps` | Checkbox wrapper |
| `ui/form/FormTextarea.jsx` -> `.tsx` | `FormTextareaProps` | Textarea wrapper |
| `ui/form/FormComponents.jsx` -> `.tsx` | Various | Utility form components |
| `ui/dropdown/Dropdown.jsx` -> `.tsx` | `DropdownProps` | Radix Dropdown wrapper |
| `ui/combobox/Combobox.jsx` -> `.tsx` | `ComboboxProps<T>` | Generic combobox |

### 6.2 Shared Components (`src/components/shared/`)

Approximately 30 components including:
- Layout components (PageHeader, etc.)
- Modal variants (ConfirmationModal, FormModal, etc.)
- Navigation (ActionMenu, FilterBar)
- Sidebar components (16 icon components + navigation)
- Analytics display components

### 6.3 Common Components (`src/components/common/`)

Shared across feature modules.

---

## Phase 7: Feature Components (280 files)

Convert by feature domain, largest/most complex last.

### 7.1 Layout Components (~5 files)

`src/components/layout/` - App shell, navigation wrappers.

### 7.2 Sidebar Components (~20 files)

`src/components/sidebar/` - Navigation sidebar with icons.

### 7.3 Settings Components (~5 files)

`src/components/settings/` - User settings pages.

### 7.4 Booking Components (~5 files)

`src/components/booking/` - Public booking pages.

### 7.5 AI Analysis Components (~14 files)

`src/components/ai/`, `headline-analyzer/`, `profile-analyzer/`, `proposal-wizard/`, `viral-post-generator/`

### 7.6 Learning Components (~22 files)

`src/components/live-qa/`, `quizzes/`, `boardroom/`

### 7.7 Email Components

`src/components/email/` - Email template management.

### 7.8 Calendar Components

`src/components/calendar/` - Calendar views, appointment modals.

### 7.9 Dashboard Components (~24 files)

`src/components/zenible-dashboard/` + `widgets/`

### 7.10 CRM Components (~80 files)

`src/components/crm/` with subdirectories:
- Core views, forms, filters
- Contact management
- Service & project management
- Settings (booking, integrations, users)
- Sales pipeline

### 7.11 Finance Components (~95 files)

`src/components/finance/` - Largest module:
- Invoices (24 components)
- Quotes (11 components)
- Expenses (20 components)
- Payments (15 components)
- Credit notes (4 components)
- Reports (6 components)
- Clients (2 components)
- Allocations (4 components)
- Shared (9 components)

### 7.12 Admin Components (~35 files)

`src/components/admin/` - Admin management panels.

---

## Phase 8: Pages & Entry Points

### 8.1 Page Components (~13 files)

| File | Notes |
|------|-------|
| `pages/signin/SignIn.jsx` -> `.tsx` | Auth page |
| `pages/signup/SignUp.jsx` -> `.tsx` | Registration |
| `pages/signup/VerifyEmail.jsx` -> `.tsx` | Email verification |
| `pages/signup/VerifyEmailToken.jsx` -> `.tsx` | Token verification |
| `pages/signup/EmailConfirmed.jsx` -> `.tsx` | Confirmation |
| `pages/signup/components/OTPInput.jsx` -> `.tsx` | OTP input |
| `pages/forgot-password/ForgotPassword.jsx` -> `.tsx` | Password reset |
| `pages/forgot-password/ResetPassword.jsx` -> `.tsx` | Set new password |
| `pages/booking/PublicBookingPage.jsx` -> `.tsx` | Public booking |
| `pages/booking/PublicUserPage.jsx` -> `.tsx` | Public user page |
| `pages/booking/BookingConfirmation.jsx` -> `.tsx` | Booking confirm |
| `pages/booking/BookingCancellation.jsx` -> `.tsx` | Booking cancel |
| `pages/booking/ZoomCallback.jsx` -> `.tsx` | Zoom OAuth |

### 8.2 Top-Level Components (~17 files)

Components at `src/components/` root level (ProtectedRoute, Plans, UserSettings, etc.)

### 8.3 App Entry Points

| File | Notes |
|------|-------|
| `src/main.jsx` -> `main.tsx` | Update `index.html` script src |
| `src/App.jsx` -> `App.tsx` | Main app with all routes and providers |
| `src/call-widget/index.jsx` -> `index.tsx` | Widget entry point |

### 8.4 Call Widget (4 files)

`src/call-widget/` - Separate embeddable widget build.

---

## Phase 9: Strict Mode Activation

### 9.1 Enable Strict Null Checks

Update `tsconfig.json`:
```json
"strictNullChecks": true
```

Fix all resulting null/undefined errors across the codebase.

### 9.2 Enable No Implicit Any

Update `tsconfig.json`:
```json
"noImplicitAny": true
```

Fix all remaining implicit `any` types.

### 9.3 Disable `allowJs`

```json
"allowJs": false
```

Ensure no `.js`/`.jsx` files remain in `src/`.

### 9.4 Switch to `tsconfig.strict.json`

Replace main config with strict config. All compiler checks fully enabled.

---

## Phase 10: Cleanup & Validation

### 10.1 Remove JSDoc Type Comments

- Remove `@param {Object}`, `@returns {Promise<Object>}` etc.
- Keep non-type JSDoc comments (descriptions, examples)

### 10.2 Update Build Scripts

Ensure `package.json` scripts include type checking:
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build",
    "build:all": "tsc --noEmit && vite build && vite build --config vite.call-widget.config.ts",
    "lint": "eslint . && tsc --noEmit"
  }
}
```

### 10.3 CI/CD Integration

Add `npm run typecheck` to CI pipeline before build step.

### 10.4 Update `index.html`

```html
<script type="module" src="/src/main.tsx"></script>
```

### 10.5 Remove Unused Dependencies

- Remove `prop-types` if ever added
- Audit for any JS-only tooling that can be replaced

---

## Migration Strategy: Key Decisions

### Incremental vs. Big Bang

**Recommended: Incremental migration** using `allowJs: true`.

- Files can be converted one at a time
- `.ts`/`.tsx` files can import from `.js`/`.jsx` files and vice versa
- Each converted file is immediately type-checked
- No need to stop feature development during migration

### File Renaming Strategy

1. Rename `.js` -> `.ts` for non-React files (utilities, services, constants)
2. Rename `.jsx` -> `.tsx` for React components
3. Update imports only if module resolution requires it (Vite handles this automatically)

### Type Strictness Progression

```
Phase 0-8:  allowJs=true, noImplicitAny=false, strictNullChecks=false
Phase 9.1:  allowJs=true, noImplicitAny=false, strictNullChecks=true
Phase 9.2:  allowJs=true, noImplicitAny=true,  strictNullChecks=true
Phase 9.3:  allowJs=false, full strict mode
```

### Handling Third-Party Libraries

| Library | Types Available | Action |
|---------|----------------|--------|
| React 19 | `@types/react` (installed) | None needed |
| React Router 7 | Built-in types | None needed |
| TanStack Query 5 | Built-in types | None needed |
| React Hook Form | Built-in types | None needed |
| Zod | Built-in types (infer schemas) | Use `z.infer<typeof schema>` |
| Radix UI | Built-in types | None needed |
| date-fns | Built-in types | None needed |
| Chart.js | Built-in types | None needed |
| Stripe.js | Built-in types | None needed |
| Socket.io Client | Built-in types | None needed |
| uuid | `@types/uuid` needed | Install |
| react-grid-layout | `@types/react-grid-layout` needed | Install |
| react-quill-new | May need custom `.d.ts` | Check availability |
| react-easy-crop | Built-in types | None needed |
| @dnd-kit | Built-in types | None needed |
| react-dnd | Built-in types | None needed |
| Heroicons | Built-in types | None needed |
| Lucide React | Built-in types | None needed |

### Zod Schema Integration

The project already uses Zod for form validation. Leverage this for TypeScript types:

```typescript
import { z } from 'zod';
import { contactSchema } from '@/components/crm/schemas/contactSchema';

// Infer TypeScript type from Zod schema
type ContactFormData = z.infer<typeof contactSchema>;
```

This avoids duplicating type definitions that Zod already defines.

---

## File Conversion Checklist (per file)

For each file being converted:

1. [ ] Rename file extension (`.js` -> `.ts` or `.jsx` -> `.tsx`)
2. [ ] Add explicit types to function parameters
3. [ ] Add return types to exported functions
4. [ ] Replace `any` with proper types where possible
5. [ ] Type state variables (`useState<Type>()`)
6. [ ] Type context values and create typed hooks
7. [ ] Add proper event handler types (`React.ChangeEvent<HTMLInputElement>`)
8. [ ] Type refs (`useRef<HTMLDivElement>(null)`)
9. [ ] Remove redundant JSDoc type annotations
10. [ ] Ensure file compiles with `tsc --noEmit`
11. [ ] Verify no runtime regressions (run affected tests)

---

## Summary Statistics

| Phase | Files | Description |
|-------|-------|-------------|
| 0 | 8 | Tooling setup (tsconfig, vite, eslint, vitest) |
| 1 | 6 | Type definitions (auto-generated + manual) |
| 2 | 16 | Constants, utilities, config |
| 3 | 41 | HTTP client + all API services |
| 4 | 15 | React context providers |
| 5 | 37 | Custom hooks |
| 6 | 45 | UI + shared components |
| 7 | 280 | Feature components (CRM, Finance, Admin, etc.) |
| 8 | 38 | Pages, entry points, call widget |
| 9 | 0 | Strict mode activation (config changes only) |
| 10 | 0 | Cleanup and CI integration |
| **Total** | **~486** | **+ config files** |

---

## Risk Mitigation

1. **Runtime behavior unchanged** - TypeScript types are erased at compile time. No runtime changes.
2. **Incremental adoption** - `allowJs` means you can convert one file at a time.
3. **Test coverage** - Run `npm run test` after each phase to catch regressions.
4. **Type checking gating** - Add `tsc --noEmit` to CI early (Phase 0) so type errors are caught.
5. **Rollback** - Renaming `.ts` back to `.js` instantly reverts a file (types become ignored).
6. **Feature development** - Can continue in parallel. New files should be `.tsx`/`.ts` from Phase 0 onward.

## Recommended Rule Going Forward

After Phase 0 is complete, **all new files must be TypeScript** (`.ts`/`.tsx`). This prevents the backlog from growing while migration is in progress.
