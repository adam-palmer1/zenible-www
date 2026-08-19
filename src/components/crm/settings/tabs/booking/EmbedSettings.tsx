import React, { useState, useEffect } from 'react';
import logger from '../../../../../utils/logger';
import {
  ClipboardDocumentIcon,
  CheckIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import callTypesAPI from '../../../../../services/api/crm/callTypes';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { useModalState } from '../../../../../hooks/useModalState';

/**
 * Embed Settings - Generate and copy embed code for booking widget
 */
interface CallTypeItem {
  id: string;
  shortcode: string;
  name: string;
  duration_minutes: number;
  description?: string;
}

// Widget's built-in default brand color (see call-widget/widget.css --zenible-primary)
const DEFAULT_PRIMARY_COLOR = '#8e51ff';
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// Matches the VARCHAR(255) that stores the label on the booking.
const MAX_TRACKING_LENGTH = 255;

// The label lands inside a double-quoted HTML attribute in the snippet below,
// so neutralise the characters that would otherwise break out of it.
const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Same for the single-quoted JS string in the programmatic example.
const escapeJsString = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const EmbedSettings = ({ username }: { username: string }) => {
  const [callTypes, setCallTypes] = useState<CallTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCallType, setSelectedCallType] = useState('');
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [tracking, setTracking] = useState('');
  const [copied, setCopied] = useState(false);
  const callTypeModal = useModalState();
  const [callTypeSearch, setCallTypeSearch] = useState('');

  const { showError } = useNotification();

  useEffect(() => {
    const loadCallTypes = async () => {
      try {
        const data = await callTypesAPI.list({ is_active: true }) as { items?: any[] } | any[];
        const items = Array.isArray(data) ? data : (data?.items || []);
        setCallTypes(items);
        // Auto-select first call type
        if (items.length > 0) {
          setSelectedCallType(items[0].shortcode);
        }
      } catch (error) {
        showError('Failed to load call types');
        logger.error('Failed to load call types:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCallTypes();
  }, [showError]);

  const selectedCallTypeData = Array.isArray(callTypes)
    ? callTypes.find((ct) => ct.shortcode === selectedCallType)
    : null;

  const widgetUrl = `${window.location.origin}/call-widget/zenible-booking.iife.js`;

  const normalizedColor = primaryColor.trim().toLowerCase();
  const isValidColor = HEX_COLOR_RE.test(normalizedColor);
  const hasCustomColor = isValidColor && normalizedColor !== DEFAULT_PRIMARY_COLOR;

  const trimmedTracking = tracking.trim().slice(0, MAX_TRACKING_LENGTH);

  const embedCode = selectedCallType
    ? `<!-- Zenible Booking Widget -->
<div
  data-zenible-booking
  data-username="${username}"
  data-call-type="${selectedCallType}"${theme !== 'light' ? `\n  data-theme="${theme}"` : ''}${hasCustomColor ? `\n  data-primary-color="${normalizedColor}"` : ''}${trimmedTracking ? `\n  data-tracking="${escapeAttr(trimmedTracking)}"` : ''}
></div>
<script src="${widgetUrl}" async></script>`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
      showError('Failed to copy to clipboard');
    }
  };

  const previewUrl = selectedCallType
    ? `${window.location.origin}/book/${username}/${selectedCallType}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading call types...</div>
      </div>
    );
  }

  if (callTypes.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <InformationCircleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          No Call Types Available
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Create a call type first to generate an embed code.
          Go to the "Call Types" tab to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <CodeBracketIcon className="h-5 w-5" />
          Embed Widget
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add your booking page to any website by copying the embed code below.
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        {/* Call Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Call Type
          </label>
          <button
            type="button"
            onClick={() => callTypeModal.open()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-zenible-primary transition-colors"
          >
            <span className="text-gray-900 dark:text-white">
              {selectedCallTypeData
                ? `${selectedCallTypeData.name} (${selectedCallTypeData.duration_minutes} min)`
                : 'Select a call type'}
            </span>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
          {selectedCallTypeData?.description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {selectedCallTypeData.description}
            </p>
          )}
        </div>

        {/* Theme Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'auto', label: 'Auto (follows system)' },
            ].map((option) => (
              <label
                key={option.value}
                className={`
                  flex-1 cursor-pointer px-4 py-2 rounded-lg border text-center text-sm font-medium transition-colors
                  ${theme === option.value
                    ? 'border-zenible-primary bg-zenible-primary/10 text-zenible-primary'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={(e) => setTheme(e.target.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Brand Color Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Brand Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Pick brand color"
              value={isValidColor ? normalizedColor : DEFAULT_PRIMARY_COLOR}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
            />
            <input
              type="text"
              aria-label="Brand color hex code"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder={DEFAULT_PRIMARY_COLOR}
              spellCheck={false}
              className={`w-36 px-3 py-2 font-mono text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zenible-primary focus:border-transparent ${
                primaryColor.trim() && !isValidColor
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {hasCustomColor && (
              <button
                type="button"
                onClick={() => setPrimaryColor(DEFAULT_PRIMARY_COLOR)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-zenible-primary transition-colors"
              >
                Reset to default
              </button>
            )}
          </div>
          {primaryColor.trim() && !isValidColor ? (
            <p className="mt-1 text-xs text-red-500">
              Enter a 6-digit hex code, e.g. {DEFAULT_PRIMARY_COLOR}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Replaces the default widget color. Leave as {DEFAULT_PRIMARY_COLOR} to keep the Zenible purple.
            </p>
          )}
        </div>

        {/* Tracking Label */}
        <div>
          <label
            htmlFor="embed-tracking"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tracking Label <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="embed-tracking"
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value.slice(0, MAX_TRACKING_LENGTH))}
            placeholder="fb-mwa-angle1"
            maxLength={MAX_TRACKING_LENGTH}
            spellCheck={false}
            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Saved against every booking made through this embed, so you can tell which page or ad
            produced it. Use a different label per landing page or ad angle &mdash; e.g. a UTM value
            or page name.
          </p>
        </div>
      </div>

      {/* Embed Code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Embed Code
          </label>
          <button
            onClick={handleCopy}
            disabled={!embedCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zenible-primary hover:bg-zenible-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
            <code>{embedCode || '// Select a call type to generate embed code'}</code>
          </pre>
        </div>
      </div>

      {/* Preview Link */}
      {previewUrl && (
        <div className="flex items-center gap-4 pt-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zenible-primary hover:underline"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Preview booking page
          </a>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5" />
          How to Use
        </h4>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Paste it into your website's HTML where you want the booking widget to appear</li>
          <li>The widget will automatically load and display your booking calendar</li>
        </ol>
      </div>

      {/* Advanced Options */}
      <details className="bg-gray-50 dark:bg-gray-800 rounded-lg">
        <summary className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          Advanced Options
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Data Attributes
            </h5>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="py-1 pr-4">Attribute</th>
                  <th className="py-1 pr-4">Required</th>
                  <th className="py-1">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-username</td>
                  <td className="py-1 pr-4">Yes</td>
                  <td className="py-1">Your booking username</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-call-type</td>
                  <td className="py-1 pr-4">Yes</td>
                  <td className="py-1">Call type shortcode</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-theme</td>
                  <td className="py-1 pr-4">No</td>
                  <td className="py-1">light, dark, or auto</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-primary-color</td>
                  <td className="py-1 pr-4">No</td>
                  <td className="py-1">Custom brand color (hex)</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-tracking</td>
                  <td className="py-1 pr-4">No</td>
                  <td className="py-1">
                    Campaign/source label stored on each booking, e.g.{' '}
                    <span className="font-mono text-xs">fb-mwa-angle1</span> (max{' '}
                    {MAX_TRACKING_LENGTH} chars)
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-metadata</td>
                  <td className="py-1 pr-4">No</td>
                  <td className="py-1">
                    JSON object of extra attribution values sent with the booking and to
                    any webhook, e.g.{' '}
                    <span className="font-mono text-xs">{'{"visitor_id":"v_123"}'}</span>{' '}
                    (max 20 keys)
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-mono text-xs">data-capture-url-params</td>
                  <td className="py-1 pr-4">No</td>
                  <td className="py-1">
                    Set to <span className="font-mono text-xs">false</span> to stop the widget
                    reading <span className="font-mono text-xs">utm_*</span>,{' '}
                    <span className="font-mono text-xs">gclid</span> and{' '}
                    <span className="font-mono text-xs">fbclid</span> from the page URL
                    (captured automatically by default)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              JavaScript API
            </h5>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs font-mono">
{`// Programmatic initialization
const widget = new ZenibleBookingWidget('#container', {
  username: '${username}',
  callType: '${selectedCallType}',
  theme: '${theme}',${hasCustomColor ? `\n  primaryColor: '${normalizedColor}',` : ''}${trimmedTracking ? `\n  tracking: '${escapeJsString(trimmedTracking)}',` : ''}
  onBookingComplete: (booking) => {
    logger.debug('Booking created:', booking);
  },
  onError: (error) => {
    logger.error('Booking error:', error);
  }
});

// Clean up when done
widget.destroy();`}
            </pre>
          </div>
        </div>
      </details>

      {/* Call Type Modal */}
      {callTypeModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                callTypeModal.close();
                setCallTypeSearch('');
              }}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Call Type
                </h3>
                <button
                  onClick={() => {
                    callTypeModal.close();
                    setCallTypeSearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                {callTypes.length > 5 && (
                  <input
                    type="text"
                    placeholder="Search call types..."
                    value={callTypeSearch}
                    onChange={(e) => setCallTypeSearch(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white mb-3"
                  />
                )}
                <div className="max-h-64 overflow-y-auto">
                  {callTypes
                    .filter(
                      (ct) =>
                        ct.name.toLowerCase().includes(callTypeSearch.toLowerCase()) ||
                        ct.shortcode.toLowerCase().includes(callTypeSearch.toLowerCase())
                    )
                    .map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => {
                          setSelectedCallType(ct.shortcode);
                          callTypeModal.close();
                          setCallTypeSearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                          selectedCallType === ct.shortcode ? 'bg-zenible-primary/10 text-zenible-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {ct.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {ct.duration_minutes} min
                          </span>
                        </div>
                        {ct.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {ct.description}
                          </p>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedSettings;
