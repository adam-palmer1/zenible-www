/**
 * Contact Ordering Utilities
 * Handles linked-list based contact ordering using after_id
 */

/**
 * Orders contacts by following the linked-list structure using after_id.
 *
 * @param {Array} contacts - Array of contacts to order
 * @returns {Array} Ordered array starting from the top (after_id=null)
 */
export function orderContactsByLinkedList(contacts) {
  if (contacts.length === 0) return [];

  // Build lookup maps
  const contactMap = new Map(contacts.map(c => [c.id, c]));
  const afterMap = new Map(
    contacts
      .filter(c => c.after_id)
      .map(c => [c.after_id, c])
  );

  // Find the top contact (after_id = null)
  const topContact = contacts.find(c => c.after_id === null);

  if (!topContact) {
    console.warn('No top contact found (after_id=null)', contacts);
    return contacts; // Fallback to unordered
  }

  // Build ordered list by following the chain
  const ordered = [];
  let current = topContact;
  const visited = new Set();

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);

    // Find the contact that comes after this one
    current = afterMap.get(current.id);
  }

  // Add any orphaned contacts at the end
  const orphaned = contacts.filter(c => !visited.has(c.id));
  if (orphaned.length > 0) {
    console.warn(`Found ${orphaned.length} orphaned contacts`, orphaned);
    ordered.push(...orphaned);
  }

  return ordered;
}

/**
 * Calculate the after_id for a contact being dragged to a new position
 *
 * @param {number} destIndex - The destination index in the ordered list
 * @param {Array} orderedContacts - The current ordered contacts in the destination column (excluding the dragged contact)
 * @returns {string|null} The ID of the contact to appear after, or null for top position
 */
export function calculateAfterId(destIndex, orderedContacts) {
  if (destIndex === 0) {
    // Dropped at top
    return null;
  } else {
    // Dropped after the contact at index (destIndex - 1)
    return orderedContacts[destIndex - 1].id;
  }
}
