/**
 * Convert backend sender_type to frontend role.
 */
export function senderTypeToRole(senderType: string): 'user' | 'assistant' | 'system' {
  switch (senderType?.toUpperCase()) {
    case 'USER': return 'user';
    case 'AI': return 'assistant';
    case 'SYSTEM': return 'system';
    default: return 'assistant';
  }
}
