import React, { useState, useEffect } from 'react';
import { useCRMReferenceData } from '../../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../../hooks/crm/useCompanyAttributes';
import { useNotification } from '../../../../contexts/NotificationContext';
import { usePreferences } from '../../../../contexts/PreferencesContext';
import { ExclamationTriangleIcon, XMarkIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AdvancedTabProps {
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

/**
 * Advanced Tab - Advanced settings and preferences
 */
const AdvancedTab: React.FC<AdvancedTabProps> = ({ onUnsavedChanges }) => {
  const { numberFormats, loading: formatsLoading } = useCRMReferenceData();
  const { getNumberFormat, setNumberFormat, getTimezone, setTimezone, loading: attributesLoading } = useCompanyAttributes();
  const { showSuccess, showError } = useNotification();
  const { getPreference, updatePreference, reloadPreferences } = usePreferences();

  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/London');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showNumberFormatModal, setShowNumberFormatModal] = useState(false);
  const [resettingSetup, setResettingSetup] = useState(false);

  useEffect(() => {
    if (!attributesLoading) {
      const numberFormat = getNumberFormat();
      const timezone = getTimezone();
      if (numberFormat) setSelectedFormat(numberFormat);
      if (timezone) setSelectedTimezone(timezone);
    }
  }, [attributesLoading, getNumberFormat, getTimezone]);

  const timezones = [
    { value: 'America/New_York', label: 'New York', region: 'US' },
    { value: 'America/Chicago', label: 'Chicago', region: 'US' },
    { value: 'America/Denver', label: 'Denver', region: 'US' },
    { value: 'America/Los_Angeles', label: 'Los Angeles', region: 'US' },
    { value: 'America/Anchorage', label: 'Anchorage', region: 'US' },
    { value: 'Pacific/Honolulu', label: 'Honolulu', region: 'US' },
    { value: 'America/Toronto', label: 'Toronto', region: 'Canada' },
    { value: 'America/Vancouver', label: 'Vancouver', region: 'Canada' },
    { value: 'America/Mexico_City', label: 'Mexico City', region: 'Mexico' },
    { value: 'Europe/London', label: 'London', region: 'UK' },
    { value: 'Europe/Paris', label: 'Paris', region: 'France' },
    { value: 'Europe/Berlin', label: 'Berlin', region: 'Germany' },
    { value: 'Europe/Madrid', label: 'Madrid', region: 'Spain' },
    { value: 'Europe/Rome', label: 'Rome', region: 'Italy' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Netherlands' },
    { value: 'Europe/Stockholm', label: 'Stockholm', region: 'Sweden' },
    { value: 'Europe/Dublin', label: 'Dublin', region: 'Ireland' },
    { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Portugal' },
    { value: 'Europe/Warsaw', label: 'Warsaw', region: 'Poland' },
    { value: 'Europe/Moscow', label: 'Moscow', region: 'Russia' },
    { value: 'Europe/Istanbul', label: 'Istanbul', region: 'Turkey' },
    { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Japan' },
    { value: 'Asia/Seoul', label: 'Seoul', region: 'South Korea' },
    { value: 'Asia/Shanghai', label: 'Shanghai', region: 'China' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'China' },
    { value: 'Asia/Singapore', label: 'Singapore', region: 'Singapore' },
    { value: 'Asia/Dubai', label: 'Dubai', region: 'UAE' },
    { value: 'Asia/Kolkata', label: 'Mumbai', region: 'India' },
    { value: 'Asia/Bangkok', label: 'Bangkok', region: 'Thailand' },
    { value: 'Asia/Jakarta', label: 'Jakarta', region: 'Indonesia' },
    { value: 'Australia/Sydney', label: 'Sydney', region: 'Australia' },
    { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Australia' },
    { value: 'Australia/Perth', label: 'Perth', region: 'Australia' },
    { value: 'Pacific/Auckland', label: 'Auckland', region: 'New Zealand' },
    { value: 'America/Sao_Paulo', label: 'S\u00e3o Paulo', region: 'Brazil' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Argentina' },
    { value: 'Africa/Cairo', label: 'Cairo', region: 'Egypt' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'South Africa' },
  ];

  const filteredTimezones = timezones.filter(tz =>
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.region.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.value.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const getTimezoneLabel = (value: string) => {
    const tz = timezones.find(t => t.value === value);
    if (tz) return `${tz.label}, ${tz.region}`;
    return value;
  };

  const getNumberFormatInfo = (formatId: string | null) => {
    const format = numberFormats.find((f: any) => f.id === formatId);
    if (format) return { name: format.name, example: format.format_string };
    return { name: 'Select format', example: '' };
  };

  const handleFormatChange = (formatId: string) => { setSelectedFormat(formatId); setHasChanges(true); onUnsavedChanges?.(true); };
  const handleTimezoneChange = (timezone: string) => { setSelectedTimezone(timezone); setHasChanges(true); onUnsavedChanges?.(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedFormat) await setNumberFormat(selectedFormat);
      if (selectedTimezone) await setTimezone(selectedTimezone);
      setHasChanges(false);
      onUnsavedChanges?.(false);
      showSuccess('Advanced settings saved successfully');
    } catch (error) {
      showError('Failed to save advanced settings');
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSetupWizard = async () => {
    setResettingSetup(true);
    try {
      await updatePreference('onboarding_status', null, 'user');
      await updatePreference('onboarding_reminder_date', null, 'user');
      await reloadPreferences();
      showSuccess('Setup wizard reset. It will appear on your next dashboard visit.');
    } catch (error) {
      showError('Failed to reset setup wizard');
      console.error('Reset failed:', error);
    } finally {
      setResettingSetup(false);
    }
  };

  const onboardingStatus = getPreference('onboarding_status');

  if (formatsLoading || attributesLoading) {
    return (<div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading advanced settings...</div></div>);
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Number Format</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how numbers are displayed throughout the application (decimals and thousands separators)</p>
        <button type="button" onClick={() => setShowNumberFormatModal(true)} className="w-full md:w-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-zenible-primary transition-colors">
          <div>
            <span className="text-gray-900 dark:text-white">{getNumberFormatInfo(selectedFormat).name}</span>
            {getNumberFormatInfo(selectedFormat).example && (<span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">(e.g. {getNumberFormatInfo(selectedFormat).example})</span>)}
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timezone</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set your company's timezone for dates, times, and scheduling</p>
        <button type="button" onClick={() => setShowTimezoneModal(true)} className="w-full md:w-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-zenible-primary transition-colors">
          <span className="text-gray-900 dark:text-white">{getTimezoneLabel(selectedTimezone)}</span>
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Export</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Export your company data for backup or migration purposes</p>
        <div className="flex gap-3">
          <button disabled className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed">Export Contacts (Coming Soon)</button>
          <button disabled className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed">Export Services (Coming Soon)</button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Setup Wizard</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Re-run the initial setup wizard to update your profile and company information.</p>
        <div className="flex items-center gap-4">
          <button onClick={handleResetSetupWizard} disabled={resettingSetup || !onboardingStatus} className="flex items-center gap-2 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ArrowPathIcon className={`h-4 w-4 ${resettingSetup ? 'animate-spin' : ''}`} />
            {resettingSetup ? 'Resetting...' : 'Reset Setup Wizard'}
          </button>
          {!onboardingStatus && <span className="text-sm text-gray-500 dark:text-gray-400">Setup wizard is already pending</span>}
          {onboardingStatus === 'complete' && <span className="text-sm text-green-600 dark:text-green-400">Setup completed</span>}
          {onboardingStatus === 'ignored' && <span className="text-sm text-amber-600 dark:text-amber-400">Setup was skipped</span>}
          {onboardingStatus === 'deferred' && <span className="text-sm text-blue-600 dark:text-blue-400">Setup was deferred</span>}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Danger Zone</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mb-4">Permanent actions that cannot be undone. Proceed with caution.</p>
              <button disabled className="px-4 py-2 bg-red-600 text-white rounded-lg opacity-50 cursor-not-allowed">Delete All Company Data (Coming Soon)</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button onClick={() => { setSelectedFormat(getNumberFormat()); setSelectedTimezone(getTimezone() || 'Europe/London'); setHasChanges(false); onUnsavedChanges?.(false); }} disabled={!hasChanges} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
        <button onClick={handleSave} disabled={!hasChanges || saving} className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {showTimezoneModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => { setShowTimezoneModal(false); setTimezoneSearch(''); }} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Timezone</h3>
                <button onClick={() => { setShowTimezoneModal(false); setTimezoneSearch(''); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <div className="p-4">
                <input type="text" placeholder="Search timezones..." value={timezoneSearch} onChange={(e) => setTimezoneSearch(e.target.value)} autoFocus className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white mb-3" />
                <div className="max-h-64 overflow-y-auto">
                  {filteredTimezones.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No timezones matching "{timezoneSearch}"</div>
                  ) : (
                    filteredTimezones.map((tz) => (
                      <button key={tz.value} onClick={() => { handleTimezoneChange(tz.value); setShowTimezoneModal(false); setTimezoneSearch(''); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between rounded-lg ${selectedTimezone === tz.value ? 'bg-zenible-primary/10 text-zenible-primary' : ''}`}>
                        <span className="text-gray-900 dark:text-white">{tz.label}</span>
                        <span className="text-gray-400 text-xs">{tz.region}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNumberFormatModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowNumberFormatModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Number Format</h3>
                <button onClick={() => setShowNumberFormatModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <div className="p-4">
                <div className="max-h-64 overflow-y-auto">
                  {numberFormats.map((format: any) => (
                    <button key={format.id} onClick={() => { handleFormatChange(format.id); setShowNumberFormatModal(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between rounded-lg ${selectedFormat === format.id ? 'bg-zenible-primary/10 text-zenible-primary' : ''}`}>
                      <div>
                        <div className={`font-medium ${selectedFormat === format.id ? 'text-zenible-primary' : 'text-gray-900 dark:text-white'}`}>{format.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Example: {format.format_string}</div>
                      </div>
                      {selectedFormat === format.id && <div className="h-2 w-2 rounded-full bg-zenible-primary" />}
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

export default AdvancedTab;
