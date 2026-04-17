import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '../../hooks/useEscapeKey';
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
  listAccountCalendars: (accountId: string) => Promise<any[]>;
  updateSelectedCalendars: (accountId: string, calendarIds: string[]) => Promise<any>;
  updateSubcalendarColor: (accountId: string, calendarId: string, color: string) => Promise<any>;
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
  listAccountCalendars,
  updateSelectedCalendars,
  updateSubcalendarColor,
}: CalendarSettingsModalProps) {
  useEscapeKey(onClose);

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
              onListCalendars={listAccountCalendars}
              onUpdateSelectedCalendars={updateSelectedCalendars}
              onSubcalendarColorChange={updateSubcalendarColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
