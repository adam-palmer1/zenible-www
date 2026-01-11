/**
 * Contact utility functions
 * Shared helpers for contact data formatting and manipulation
 */

/**
 * Get contact's full name (first + last name)
 * @param {Object} contact - Contact object
 * @returns {string} Full name or empty string
 */
export const getContactFullName = (contact) => {
  if (!contact) return '';

  return [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
};

/**
 * Get contact's display name with fallbacks
 * Prioritizes: Full Name > Business Name > Email > Fallback
 * @param {Object} contact - Contact object
 * @param {string} fallback - Fallback text if no name available
 * @returns {string} Display name
 */
export const getContactDisplayName = (contact, fallback = 'Unnamed Contact') => {
  if (!contact) return fallback;

  const fullName = getContactFullName(contact);

  return fullName ||
         contact.business_name ||
         contact.email ||
         fallback;
};

/**
 * Get contact initials for avatar
 * @param {Object} contact - Contact object
 * @returns {string} 1-2 character initials
 */
export const getContactInitials = (contact) => {
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
