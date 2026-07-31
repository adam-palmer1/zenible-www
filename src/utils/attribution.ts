/**
 * First-touch acquisition attribution.
 *
 * Captures where a visitor came from on their very first landing and freezes
 * it in localStorage so it survives in-page navigation, tab close, and the
 * visitor returning days later before they sign up. This is what lets us
 * attribute a signup to its real channel (e.g. Facebook via fbclid/referrer)
 * instead of defaulting to "Direct" when utm tags are absent.
 *
 * IP address and user-agent are intentionally NOT captured here — the backend
 * derives those from the request so they cannot be spoofed or stripped.
 */

export interface Attribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  landing_page?: string | null;
  timezone?: string | null;
  language?: string | null;
}

const FIRST_TOUCH_KEY = 'zenible_first_touch';

/** Read attribution from the current page/URL. */
function readCurrent(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const get = (key: string): string | null => params.get(key) || null;

  let timezone: string | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    timezone = null;
  }

  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_term: get('utm_term'),
    utm_content: get('utm_content'),
    fbclid: get('fbclid'),
    gclid: get('gclid'),
    // Always capture the referrer — not only when utm tags are present, so a
    // Facebook/Google organic click (referrer but no utm) is still attributed.
    referrer: document.referrer || null,
    landing_page: window.location.href || null,
    timezone,
    language: navigator.language || null,
  };
}

/**
 * Capture first-touch attribution once, on the first landing. First touch
 * wins — an existing record is never overwritten.
 */
export function captureFirstTouch(): void {
  try {
    if (localStorage.getItem(FIRST_TOUCH_KEY)) return;
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(readCurrent()));
  } catch {
    // localStorage unavailable (private mode / blocked) — capture is best-effort.
  }
}

/**
 * Return the stored first-touch attribution to send at signup, falling back to
 * the current page if nothing was stored (e.g. localStorage blocked).
 */
export function getAttribution(): Attribution {
  try {
    const stored = localStorage.getItem(FIRST_TOUCH_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
  } catch {
    // ignore and fall through to current-page values
  }
  return readCurrent();
}
