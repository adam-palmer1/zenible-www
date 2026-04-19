import { describe, it, expect } from 'vitest';
import { normalizeFilters, queryKeys } from './query-keys';

describe('normalizeFilters', () => {
  it('passes primitives through unchanged', () => {
    expect(normalizeFilters(42)).toBe(42);
    expect(normalizeFilters('foo')).toBe('foo');
    expect(normalizeFilters(true)).toBe(true);
  });

  it('returns undefined for null or undefined', () => {
    expect(normalizeFilters(null)).toBeUndefined();
    expect(normalizeFilters(undefined)).toBeUndefined();
  });

  it('sorts object keys so hash is stable across insertion orders', () => {
    const a = normalizeFilters({ b: 1, a: 2 });
    const b = normalizeFilters({ a: 2, b: 1 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).toBe('{"a":2,"b":1}');
  });

  it('drops keys with undefined or empty-string values', () => {
    const out = normalizeFilters({ a: 1, b: undefined, c: '', d: 'keep' });
    expect(out).toEqual({ a: 1, d: 'keep' });
  });

  it('drops keys whose value normalizes to undefined (null)', () => {
    const out = normalizeFilters({ a: 1, b: null });
    expect(out).toEqual({ a: 1 });
  });

  it('preserves numeric 0 and boolean false', () => {
    const out = normalizeFilters({ a: 0, b: false });
    expect(out).toEqual({ a: 0, b: false });
  });

  it('recurses into nested objects', () => {
    const out = normalizeFilters({ outer: { b: 1, a: 2 } });
    expect(JSON.stringify(out)).toBe('{"outer":{"a":2,"b":1}}');
  });

  it('normalizes inside arrays (sorts keys of each object)', () => {
    const out = normalizeFilters({ items: [{ b: 1, a: 2 }, { d: 4, c: 3 }] });
    expect(JSON.stringify(out)).toBe('{"items":[{"a":2,"b":1},{"c":3,"d":4}]}');
  });

  it('filters out undefineds inside arrays', () => {
    const out = normalizeFilters({ items: [null, 1, undefined, 2] });
    expect(out).toEqual({ items: [1, 2] });
  });

  it('leaves Date instances and other non-plain objects alone', () => {
    const d = new Date('2024-01-01T00:00:00Z');
    const out = normalizeFilters({ when: d }) as { when: Date };
    expect(out.when).toBe(d);
  });
});

describe('queryKeys.contacts.list', () => {
  it('produces identical keys for reordered filter objects', () => {
    const a = queryKeys.contacts.list({ status: 'active', search: 'acme' });
    const b = queryKeys.contacts.list({ search: 'acme', status: 'active' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('is distinct from a different filter set', () => {
    const a = queryKeys.contacts.list({ status: 'active' });
    const b = queryKeys.contacts.list({ status: 'archived' });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe('queryKeys.dashboard.widgets', () => {
  it('sorts visibleIds so list order does not affect the key', () => {
    const a = queryKeys.dashboard.widgets(['calendar', 'projects', 'invoices']);
    const b = queryKeys.dashboard.widgets(['invoices', 'calendar', 'projects']);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
