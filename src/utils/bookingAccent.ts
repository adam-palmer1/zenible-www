/**
 * Accent colour for public booking surfaces.
 *
 * A call type carries its own colour, which should brand the public booking
 * page and the embed widget in place of the default Zenible purple.
 */

/** Zenible's default brand colour (tailwind.config.js -> zenible.primary). */
export const DEFAULT_BOOKING_ACCENT = '#8e51ff';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Accept only a well-formed 6-digit hex, so a bad value can't break the page. */
export const normalizeAccent = (value?: string | null): string =>
  value && HEX_RE.test(value.trim()) ? value.trim().toLowerCase() : DEFAULT_BOOKING_ACCENT;

/**
 * Pick a foreground that stays legible on the accent.
 *
 * Hosts can choose any colour, including near-white ones, so hardcoding white
 * would make the primary button unreadable. Strict maximum-contrast is wrong
 * in the other direction: it puts dark text on mid-blue and on Zenible's own
 * purple, which reads as a bug. So prefer white while it clears 3:1 — the WCAG
 * threshold for UI components and large text, which is what these accents
 * carry — and fall back to near-black only when white genuinely fails.
 */
const WHITE_MIN_CONTRAST = 3;

const relativeLuminance = (hex: string): number => {
  const h = normalizeAccent(hex).slice(1);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(parseInt(h.slice(0, 2), 16)) +
    0.7152 * channel(parseInt(h.slice(2, 4), 16)) +
    0.0722 * channel(parseInt(h.slice(4, 6), 16))
  );
};

export const readableOn = (hex: string): string => {
  const l = relativeLuminance(hex);
  const contrastWithWhite = 1.05 / (l + 0.05);
  return contrastWithWhite >= WHITE_MIN_CONTRAST ? '#ffffff' : '#111827';
};

/** Slightly darker accent for hover states. */
export const darkenAccent = (hex: string, percent = 12): string => {
  const h = normalizeAccent(hex).slice(1);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(parseInt(h.slice(0, 2), 16) - amt);
  const g = clamp(parseInt(h.slice(2, 4), 16) - amt);
  const b = clamp(parseInt(h.slice(4, 6), 16) - amt);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** CSS custom properties to spread onto a public booking surface's root. */
export const accentStyle = (color?: string | null): React.CSSProperties => {
  const accent = normalizeAccent(color);
  return {
    '--booking-accent': accent,
    '--booking-accent-hover': darkenAccent(accent),
    '--booking-accent-fg': readableOn(accent),
  } as React.CSSProperties;
};

/**
 * Same accent, mapped onto the embed widget's own variable names.
 *
 * widget.css predates the booking-page tokens and styles itself from
 * --zenible-primary; keeping a separate mapping avoids renaming variables
 * inside the shadow-DOM stylesheet.
 */
export const widgetAccentStyle = (color?: string | null): React.CSSProperties => {
  const accent = normalizeAccent(color);
  return {
    '--zenible-primary': accent,
    '--zenible-primary-hover': darkenAccent(accent),
    '--zenible-border-focus': accent,
    '--zenible-primary-fg': readableOn(accent),
  } as React.CSSProperties;
};
