/**
 * Contact utility functions
 * Shared helpers for contact data formatting and manipulation
 */

interface ContactLike {
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
}

export const getContactFullName = (contact: ContactLike | null | undefined): string => {
  if (!contact) return '';

  return [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
};

export const getContactDisplayName = (contact: ContactLike | null | undefined, fallback = 'Unnamed Contact'): string => {
  if (!contact) return fallback;

  const fullName = getContactFullName(contact);

  return fullName ||
         contact.business_name ||
         contact.email ||
         fallback;
};

export const getContactInitials = (contact: ContactLike | null | undefined): string => {
  if (!contact) return '?';

  const fullName = getContactFullName(contact);
  if (fullName) {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  if (contact.business_name) {
    return contact.business_name.substring(0, 2).toUpperCase();
  }

  if (contact.email) {
    return contact.email[0].toUpperCase();
  }

  return '?';
};
