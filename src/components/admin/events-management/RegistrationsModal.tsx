import React from 'react';
import { LoadingSpinner } from '../../shared';
import { EventItem, EventRegistration } from './types';
import eventsAPI from '../../../services/eventsAPI';

interface RegistrationsModalProps {
  darkMode: boolean;
  event: EventItem;
  registrations: EventRegistration[];
  registrationsLoading: boolean;
  onClose: () => void;
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  return eventsAPI.formatLocalDateTime(dateString);
};

export default function RegistrationsModal({
  darkMode,
  event,
  registrations,
  registrationsLoading,
  onClose,
}: RegistrationsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-[95vw] md:max-w-4xl max-h-[80vh] overflow-hidden rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Event Registrations: {event.title}
          </h3>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {registrationsLoading ? (
            <LoadingSpinner height="py-12" />
          ) : registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      User Email
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Name
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Registered At
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Attending
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                  {registrations.map((reg, idx) => (
                    <tr key={idx}>
                      <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {reg.user_email}
                      </td>
                      <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {reg.user_name || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {formatDateTime(reg.registered_at)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {reg.is_attending ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Yes</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No registrations yet
            </div>
          )}
        </div>
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
