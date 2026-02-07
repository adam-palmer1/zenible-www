/**
 * Contact value calculation utilities
 *
 * Provides functions for calculating contact values, totals, and projections
 */

interface ContactFinancials {
  confirmed_recurring_total?: string | number | null;
  active_recurring_total?: string | number | null;
  confirmed_one_off_total?: string | number | null;
  active_one_off_total?: string | number | null;
  one_off_total?: string | number | null;
}

export const calculateContactValue = (contact: ContactFinancials | null | undefined): number => {
  const confirmedRecurring = parseFloat(String(contact?.confirmed_recurring_total ?? 0)) || 0;
  const activeRecurring = parseFloat(String(contact?.active_recurring_total ?? 0)) || 0;
  const confirmedOneOff = parseFloat(String(contact?.confirmed_one_off_total ?? 0)) || 0;
  const activeOneOff = parseFloat(String(contact?.active_one_off_total ?? 0)) || 0;
  return confirmedRecurring + activeRecurring + confirmedOneOff + activeOneOff;
};

export const calculateMRR = (contact: ContactFinancials | null | undefined): number => {
  const confirmedRecurring = parseFloat(String(contact?.confirmed_recurring_total ?? 0)) || 0;
  const activeRecurring = parseFloat(String(contact?.active_recurring_total ?? 0)) || 0;
  // Note: API returns annualized values, so divide by 12 for monthly
  return (confirmedRecurring + activeRecurring) / 12;
};

export const calculateARR = (contact: ContactFinancials | null | undefined): number => {
  const confirmedRecurring = parseFloat(String(contact?.confirmed_recurring_total ?? 0)) || 0;
  const activeRecurring = parseFloat(String(contact?.active_recurring_total ?? 0)) || 0;
  return confirmedRecurring + activeRecurring;
};

export const calculateOneOffTotal = (contact: ContactFinancials | null | undefined): number => {
  return parseFloat(String(contact?.one_off_total ?? 0)) || 0;
};

export const calculateLTV = (contact: ContactFinancials | null | undefined): number => {
  return calculateARR(contact) + calculateOneOffTotal(contact);
};

export interface ValueBreakdown {
  mrr: number;
  arr: number;
  oneOffTotal: number;
  totalValue: number;
  ltv: number;
}

export const getValueBreakdown = (contact: ContactFinancials | null | undefined): ValueBreakdown => {
  return {
    mrr: calculateMRR(contact),
    arr: calculateARR(contact),
    oneOffTotal: calculateOneOffTotal(contact),
    totalValue: calculateContactValue(contact),
    ltv: calculateLTV(contact)
  };
};
