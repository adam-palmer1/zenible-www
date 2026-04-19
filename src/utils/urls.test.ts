import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSafeHref, safeHref, isSafeImgSrc } from './urls';

describe('isSafeHref', () => {
  beforeEach(() => {
    // jsdom sets this to "http://localhost/" by default — make it deterministic.
    vi.stubGlobal('window', { ...window, location: { ...window.location, origin: 'https://app.example.test' } });
  });

  it('accepts same-origin path-relative URLs', () => {
    expect(isSafeHref('/foo')).toBe(true);
    expect(isSafeHref('/foo/bar?baz=1')).toBe(true);
    expect(isSafeHref('#fragment')).toBe(true);
    expect(isSafeHref('?query=1')).toBe(true);
  });

  it('accepts http(s) URLs', () => {
    expect(isSafeHref('https://example.com/page')).toBe(true);
    expect(isSafeHref('http://example.com')).toBe(true);
  });

  it('accepts mailto: and tel:', () => {
    expect(isSafeHref('mailto:a@b.com')).toBe(true);
    expect(isSafeHref('tel:+15555555555')).toBe(true);
  });

  it('rejects javascript: URIs (XSS)', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('JavaScript:alert(1)')).toBe(false);
    expect(isSafeHref('  javascript:alert(1)  ')).toBe(false);
  });

  it('rejects data: URIs (XSS)', () => {
    expect(isSafeHref('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript:', () => {
    expect(isSafeHref('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects file:', () => {
    expect(isSafeHref('file:///etc/passwd')).toBe(false);
  });

  it('rejects null, undefined, empty', () => {
    expect(isSafeHref(null)).toBe(false);
    expect(isSafeHref(undefined)).toBe(false);
    expect(isSafeHref('')).toBe(false);
    expect(isSafeHref('   ')).toBe(false);
  });

  it('rejects non-string values', () => {
    // @ts-expect-error — testing runtime guard
    expect(isSafeHref(42)).toBe(false);
    // @ts-expect-error — testing runtime guard
    expect(isSafeHref({})).toBe(false);
  });
});

describe('safeHref', () => {
  it('returns the value when safe', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com');
  });

  it('returns undefined when unsafe (lets React omit the attribute)', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
  });
});

describe('isSafeImgSrc', () => {
  it('accepts http(s), data:, blob:', () => {
    expect(isSafeImgSrc('https://cdn.example.com/foo.png')).toBe(true);
    expect(isSafeImgSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isSafeImgSrc('blob:https://app.test/abc-123')).toBe(true);
  });

  it('rejects javascript: and vbscript:', () => {
    expect(isSafeImgSrc('javascript:alert(1)')).toBe(false);
    expect(isSafeImgSrc('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects empty and null', () => {
    expect(isSafeImgSrc('')).toBe(false);
    expect(isSafeImgSrc(null)).toBe(false);
  });
});
