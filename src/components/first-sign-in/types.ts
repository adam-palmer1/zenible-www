import { Country, CompanyCountry } from '../../hooks/crm/useCountries';
import { Currency, CompanyCurrency } from '../../hooks/crm/useCompanyCurrencies';
import { NumberFormat } from '../../contexts/CRMReferenceDataContext';

export interface PlanResponse {
  id: string;
  name: string;
  description?: string | null;
  monthly_price: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface PlansApiResponse {
  plans?: PlanResponse[];
  items?: PlanResponse[];
  [key: string]: unknown;
}

export interface CompanyData {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  [key: string]: unknown;
}

export interface CompanyProfile {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export type { Country, CompanyCountry, Currency, CompanyCurrency, NumberFormat };
