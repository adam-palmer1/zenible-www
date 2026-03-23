import { useState, useCallback } from 'react';

const STORAGE_KEY = 'zenible_cookie_consent';

export interface CookieConsent {
  accepted: boolean;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

function readConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [consent, setConsentState] = useState<CookieConsent | null>(readConsent);

  const getConsent = useCallback((): CookieConsent | null => {
    return readConsent();
  }, []);

  const setConsent = useCallback((preferences: Omit<CookieConsent, 'timestamp' | 'essential'>) => {
    const value: CookieConsent = {
      ...preferences,
      essential: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setConsentState(value);
  }, []);

  const hasConsented = useCallback((): boolean => {
    return readConsent() !== null;
  }, []);

  const hasCategory = useCallback((category: keyof Pick<CookieConsent, 'essential' | 'analytics' | 'marketing'>): boolean => {
    const current = readConsent();
    if (!current) return false;
    return current[category] === true;
  }, []);

  return { consent, getConsent, setConsent, hasConsented, hasCategory };
}
