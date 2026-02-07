import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';

interface ClientSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  selectedClientId: string;
  onSelect: (clientId: string) => void;
  loading: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Client Select Dropdown
 * Appears as a dropdown next to the trigger element
 */
const ClientSelectModal: React.FC<ClientSelectModalProps> = ({ isOpen, onClose, clients, selectedClientId, onSelect, loading, triggerRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter((client: any) => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
      const businessName = client.business_name?.toLowerCase() || '';
      return fullName.includes(query) || businessName.includes(query);
    });
  }, [clients, searchQuery]);

  const handleSelect = (clientId: string) => {
    onSelect(clientId);
    setSearchQuery('');
    onClose();
  };

  const getClientDisplay = (client: any) => {
    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName && client.business_name) {
      return `${fullName} (${client.business_name})`;
    }
    return fullName || client.business_name || 'Unnamed Client';
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ maxWidth: '400px' }}
    >
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Client List */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No clients found' : 'No clients available'}
          </div>
        ) : (
          <div className="py-1">
            {filteredClients.map((client: any) => (
              <button
                key={client.id}
                onClick={() => handleSelect(client.id)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                  client.id === selectedClientId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <span className="text-gray-900 dark:text-white">
                  {getClientDisplay(client)}
                </span>
                {client.id === selectedClientId && (
                  <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSelectModal;
