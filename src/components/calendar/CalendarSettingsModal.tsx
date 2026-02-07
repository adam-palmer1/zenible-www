import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import GoogleCalendarConnector from './GoogleCalendarConnector';

interface CalendarSettingsModalProps {
  onClose: () => void;
  googleConnected: boolean;
  googleAccounts: any[];
  primaryAccount: any;
  connectGoogleCalendar: (setAsPrimary: boolean) => void;
  setAccountAsPrimary: (accountId: any) => Promise<any>;
  disconnectAccount: (accountId: any) => Promise<any>;
  renameAccount: (accountId: any, name: string) => Promise<any>;
  updateAccountColor: (accountId: any, color: string) => Promise<any>;
  toggleAccountReadOnly: (accountId: any, isReadOnly: boolean) => Promise<any>;
  syncAccount: (accountId: any) => Promise<any>;
  enumsLoading: boolean;
  appointmentTypes: { value: string; label: string }[];
  visibleTypes: string[];
  typeColors: Record<string, string>;
  defaultAppointmentColors: Record<string, string>;
  toggleAppointmentType: (type: string) => void;
  updateTypeColor: (type: string, color: string) => void;
  resetColors: () => void;
}

export default function CalendarSettingsModal({
  onClose,
  googleConnected,
  googleAccounts,
  primaryAccount,
  connectGoogleCalendar,
  setAccountAsPrimary,
  disconnectAccount,
  renameAccount,
  updateAccountColor,
  toggleAccountReadOnly,
  syncAccount,
  enumsLoading,
  appointmentTypes,
  visibleTypes,
  typeColors,
  defaultAppointmentColors,
  toggleAppointmentType,
  updateTypeColor,
  resetColors,
}: CalendarSettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Calendar Settings</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            <GoogleCalendarConnector
              isConnected={googleConnected}
              accounts={googleAccounts}
              primaryAccount={primaryAccount}
              onAddAccount={connectGoogleCalendar}
              onSetPrimary={setAccountAsPrimary}
              onDisconnect={disconnectAccount}
              onRename={renameAccount}
              onColorChange={updateAccountColor}
              onToggleReadOnly={toggleAccountReadOnly}
              onSync={syncAccount}
            />

            <div className="border-t border-gray-200"></div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Appointment Types</h3>

              {enumsLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
                  <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
                  <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentTypes.map((type) => (
                    <div key={type.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`type-${type.value}`}
                          checked={visibleTypes.includes(type.value)}
                          onChange={() => toggleAppointmentType(type.value)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor={`type-${type.value}`} className="text-sm text-gray-700 cursor-pointer">
                          {type.label}
                        </label>
                      </div>
                      <input
                        type="color"
                        value={typeColors[type.value] || defaultAppointmentColors[type.value] || '#3b82f6'}
                        onChange={(e) => updateTypeColor(type.value, e.target.value)}
                        className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                        title={`Choose color for ${type.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={resetColors}
                className="mt-4 w-full px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Reset Colors to Default
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
