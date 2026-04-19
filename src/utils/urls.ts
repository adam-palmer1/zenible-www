/**
 * URL safety helpers used when rendering backend- or user-supplied URLs as
 * anchors / image sources. Defense-in-depth against `javascript:` / `data:text/html`
 * URLs that would execute on click if a backend response or upstream API
 * ever carried them.
 */

/** URL schemes we render as-is in `href` / `src` attributes. */
const SAFE_HREF_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** URL schemes we allow specifically on `<img src>` — browsers can render blob: / data: images safely. */
const SAFE_IMG_SCHEMES = new Set(['http:', 'https:', 'data:', 'blob:']);

/**
 * Returns true if `value` parses as a URL with a scheme we allow in `href`.
 * Protocol-relative (`//host/path`) and scheme-less paths (`/foo`, `foo`) are
 * treated as same-origin and accepted.
 *
 * Returns false for `javascript:`, `vbscript:`, `data:`, `file:`, and any URL
 * we can't parse.
 */
export function isSafeHref(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  // Same-origin-relative paths are safe.
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return true;

  try {
    // `new URL` requires an absolute URL, so give it a base for protocol-relative
    // and bare-host cases.
    const url = new URL(trimmed, window.location.origin);
    return SAFE_HREF_SCHEMES.has(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns the URL if safe, otherwise `undefined` — handy for inline JSX:
 *   <a href={safeHref(backendUrl)}>
 */
export function safeHref(value: string | null | undefined): string | undefined {
  return isSafeHref(value) ? value! : undefined;
}

/** Same as isSafeHref but accepts data: and blob: (for `<img>` tags). */
export function isSafeImgSrc(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return true;
  try {
    const url = new URL(trimmed, window.location.origin);
    return SAFE_IMG_SCHEMES.has(url.protocol);
  } catch {
    return false;
  }
}
