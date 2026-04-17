import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useContacts } from './useContacts';

interface UseSearchableContactsOptions {
  skipInitialFetch?: boolean;
}

/**
 * Wraps useContacts with server-side search.
 * Returns a merged list of initially loaded contacts + search results,
 * so dropdowns can access all contacts via typing.
 *
 * Usage:
 *   const { contacts, loading, searchQuery, setSearchQuery, createContact } =
 *     useSearchableContacts({ is_client: true });
 */
export function useSearchableContacts(
  filters: Record<string, unknown> = {},
  options: UseSearchableContactsOptions = {}
) {
  const {
    contacts: initialContacts,
    loading,
    fetchContacts,
    createContact,
    ...rest
  } = useContacts({ per_page: 200, ...filters }, 0, options);

  const [searchedContacts, setSearchedContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced server-side search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchedContacts([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const stringFilters: Record<string, string> = {};
        for (const [k, v] of Object.entries(filters)) {
          if (v !== null && v !== undefined) stringFilters[k] = String(v);
        }
        const result = await fetchContacts({
          search: searchQuery,
          per_page: '50',
          fields: 'id,first_name,last_name,email,business_name,phone,country_code,display_name,is_client,is_vendor',
          ...stringFilters,
        }) as any;
        setSearchedContacts(result?.items || []);
      } catch {
        // Ignore search errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // During active search, return only search results; otherwise return initial contacts
  const contacts = useMemo(() => {
    if (searchQuery.trim()) {
      return searchedContacts;
    }
    return initialContacts || [];
  }, [initialContacts, searchedContacts, searchQuery]);

  return {
    contacts,
    loading,
    searching,
    searchQuery,
    setSearchQuery,
    fetchContacts,
    createContact,
    ...rest,
  };
}
