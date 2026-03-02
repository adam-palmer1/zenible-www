import { useState, useEffect } from 'react';
import companyUsersAPI from '../../services/api/crm/companyUsers';
import type { UserPermissionsResponse } from '../../types';

interface CRMPermissions {
  /** User has full CRM access (services, projects, contacts) */
  hasCRMAccess: boolean;
  /** User has contacts-only access (contacts, clients, vendors) */
  hasContactsAccess: boolean;
  /** User can edit statuses, create custom statuses, etc. (crm_full, contacts_full, company_admin) */
  hasWriteAccess: boolean;
  loading: boolean;
}

/**
 * Hook to fetch CRM permissions for the current user.
 *
 * - `hasCRMAccess` = true when user has crm_view, crm_full, company_admin, or is_company_admin
 * - `hasContactsAccess` = true when user has any CRM or contacts permission
 */
export function useCRMPermissions(): CRMPermissions {
  const [hasCRMAccess, setHasCRMAccess] = useState(true); // default true to avoid flash
  const [hasContactsAccess, setHasContactsAccess] = useState(true);
  const [hasWriteAccess, setHasWriteAccess] = useState(true); // default true to avoid flash
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPermissions = async () => {
      try {
        const perms = await companyUsersAPI.getMyPermissions() as UserPermissionsResponse;
        if (cancelled) return;

        const codes = perms.permissions || [];
        const isAdmin = perms.is_company_admin || perms.is_platform_admin;

        const crmCodes = ['crm_view', 'crm_full', 'company_admin'];
        const contactCodes = ['contacts_view', 'contacts_full'];
        const writeCodes = ['crm_full', 'contacts_full', 'company_admin'];

        setHasCRMAccess(isAdmin || codes.some(c => crmCodes.includes(c)));
        setHasContactsAccess(isAdmin || codes.some(c => [...crmCodes, ...contactCodes].includes(c)));
        setHasWriteAccess(isAdmin || codes.some(c => writeCodes.includes(c)));
      } catch {
        // On error, default to full access to avoid locking users out
        setHasCRMAccess(true);
        setHasContactsAccess(true);
        setHasWriteAccess(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPermissions();
    return () => { cancelled = true; };
  }, []);

  return { hasCRMAccess, hasContactsAccess, hasWriteAccess, loading };
}
