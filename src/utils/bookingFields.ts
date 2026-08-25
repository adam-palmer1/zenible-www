/**
 * Public booking form field configuration.
 *
 * A call type decides which optional fields its form collects and whether each
 * is required. The API is the source of truth and re-validates on submit —
 * this only drives rendering and inline errors.
 *
 * `name` and `email` are intentionally absent: they're always collected and
 * always required, because email is the contact key, the confirmation
 * recipient and the cancel/reschedule token holder.
 */

export type FieldState = 'hidden' | 'optional' | 'required';

export type BookingFieldKey = 'phone' | 'company' | 'notes';

/** Mirrors BOOKING_FIELD_DEFAULTS server-side: the pre-configurable behaviour. */
export const BOOKING_FIELD_DEFAULTS: Record<BookingFieldKey, FieldState> = {
  phone: 'optional',
  company: 'hidden',
  notes: 'optional',
};

export const BOOKING_FIELD_LABELS: Record<BookingFieldKey, string> = {
  phone: 'Phone number',
  company: 'Company',
  notes: 'Notes',
};

/** Order the fields render in. */
export const BOOKING_FIELD_KEYS: BookingFieldKey[] = ['phone', 'company', 'notes'];

/** Merge a call type's config over the defaults, ignoring anything malformed. */
export const resolveBookingFields = (
  raw?: Partial<Record<string, string>> | null
): Record<BookingFieldKey, FieldState> => {
  const resolved = { ...BOOKING_FIELD_DEFAULTS };
  if (raw && typeof raw === 'object') {
    for (const key of BOOKING_FIELD_KEYS) {
      const value = raw[key];
      if (value === 'hidden' || value === 'optional' || value === 'required') {
        resolved[key] = value;
      }
    }
  }
  return resolved;
};

export const isShown = (state: FieldState): boolean => state !== 'hidden';
export const isRequired = (state: FieldState): boolean => state === 'required';
