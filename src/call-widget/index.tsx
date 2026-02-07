import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import BookingWidget from './BookingWidget';
import widgetStyles from './widget.css?inline';

declare const __ZENIBLE_API_URL__: string | undefined;

// API URL baked in at build time
const DEFAULT_API_URL = typeof __ZENIBLE_API_URL__ !== 'undefined'
  ? __ZENIBLE_API_URL__
  : 'https://api.zenible.com/api/v1';

interface WidgetOptions {
  username?: string;
  callType?: string;
  theme?: string;
  primaryColor?: string;
  apiBaseUrl?: string;
  onBookingComplete?: (result: any) => void;
  onError?: (err: any) => void;
}

interface WidgetConfig {
  username: string;
  callType: string;
  theme: string;
  primaryColor?: string;
  apiBaseUrl: string;
  onBookingComplete?: (result: any) => void;
  onError?: (err: any) => void;
}

// Widget class for programmatic usage
class ZenibleBookingWidget {
  container: HTMLElement | null;
  options: WidgetConfig;
  root: Root | null = null;

  constructor(container: string | HTMLElement, options: WidgetOptions = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      console.error('[ZenibleBooking] Container not found');
      this.options = {} as WidgetConfig;
      return;
    }

    const el = this.container as HTMLElement;

    this.options = {
      username: options.username || el.dataset.username || '',
      callType: options.callType || el.dataset.callType || '',
      theme: options.theme || el.dataset.theme || 'light',
      primaryColor: options.primaryColor || el.dataset.primaryColor,
      apiBaseUrl: options.apiBaseUrl || el.dataset.apiBaseUrl || this.detectApiBaseUrl(),
      onBookingComplete: options.onBookingComplete,
      onError: options.onError,
    };

    if (!this.options.username || !this.options.callType) {
      console.error('[ZenibleBooking] username and callType are required');
      return;
    }

    this.init();
  }

  detectApiBaseUrl(): string {
    // Use the API URL baked in at build time
    return DEFAULT_API_URL;
  }

  init(): void {
    if (!this.container) return;

    // Create Shadow DOM for style isolation
    const shadow = this.container.attachShadow({ mode: 'open' });

    // Create style element
    const style = document.createElement('style');
    style.textContent = widgetStyles;

    // Apply theme
    if (this.options.theme === 'dark') {
      style.textContent += '\n:host { color-scheme: dark; }';
      style.textContent += '\n.zenible-widget { --zenible-bg: #1f2937; --zenible-bg-secondary: #374151; --zenible-bg-hover: #4b5563; --zenible-text: #f9fafb; --zenible-text-secondary: #d1d5db; --zenible-text-muted: #9ca3af; --zenible-border: #4b5563; }';
    } else if (this.options.theme === 'auto') {
      style.textContent += '\n@media (prefers-color-scheme: dark) { .zenible-widget { --zenible-bg: #1f2937; --zenible-bg-secondary: #374151; --zenible-bg-hover: #4b5563; --zenible-text: #f9fafb; --zenible-text-secondary: #d1d5db; --zenible-text-muted: #9ca3af; --zenible-border: #4b5563; } }';
    }

    // Apply custom primary color if provided
    if (this.options.primaryColor) {
      const color = this.options.primaryColor;
      style.textContent += `\n:host { --zenible-primary: ${color}; --zenible-primary-hover: ${this.darkenColor(color, 15)}; --zenible-border-focus: ${color}; }`;
    }

    shadow.appendChild(style);

    // Create React mount point
    const mountPoint = document.createElement('div');
    shadow.appendChild(mountPoint);

    // Mount React component
    this.root = createRoot(mountPoint);
    this.root.render(
      <BookingWidget
        config={{
          username: this.options.username,
          callType: this.options.callType,
          apiBaseUrl: this.options.apiBaseUrl,
          onBookingComplete: this.options.onBookingComplete,
          onError: this.options.onError,
        }}
      />
    );
  }

  darkenColor(color: string, percent: number): string {
    // Simple hex color darkening
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  destroy(): void {
    if (this.root) {
      this.root.unmount();
    }
  }
}

// Auto-initialize widgets on page load
function initWidgets(): void {
  const containers = document.querySelectorAll('[data-zenible-booking]');
  containers.forEach((container) => {
    // Skip if already initialized
    if (container.shadowRoot) return;
    new ZenibleBookingWidget(container as HTMLElement);
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidgets);
} else {
  initWidgets();
}

// Watch for dynamically added widgets
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.hasAttribute && element.hasAttribute('data-zenible-booking')) {
          new ZenibleBookingWidget(element);
        }
        // Also check descendants
        const descendants = element.querySelectorAll?.('[data-zenible-booking]');
        descendants?.forEach((container) => {
          if (!container.shadowRoot) {
            new ZenibleBookingWidget(container as HTMLElement);
          }
        });
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// Export for programmatic usage
declare global {
  interface Window {
    ZenibleBookingWidget: typeof ZenibleBookingWidget;
  }
}
window.ZenibleBookingWidget = ZenibleBookingWidget;

export default ZenibleBookingWidget;
