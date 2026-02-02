import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import contactsAPI from '../../../services/api/crm/contacts';

/**
 * Recent Clients Widget for Dashboard
 * Shows recently added or updated clients
 *
 * Settings:
 * - limit: Number of clients to display (default: 5)
 */
const RecentClientsWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const limit = settings.limit || 5;

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const response = await contactsAPI.list({
          is_client: true,
          sort_by: 'created_at',
          sort_order: 'desc',
          limit: limit,
        });
        setClients(response.items || response || []);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [limit]);

  // Get initials for avatar
  const getInitials = (client) => {
    const firstName = client.first_name || '';
    const lastName = client.last_name || '';
    const company = client.company_name || '';

    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return company.charAt(0).toUpperCase() || 'C';
  };

  // Get display name
  const getDisplayName = (client) => {
    if (client.first_name || client.last_name) {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
    return client.company_name || 'Unnamed Client';
  };

  const handleViewAll = () => navigate('/crm?tab=clients');
  const handleClientClick = (id) => navigate(`/crm?tab=clients&contact=${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[180px]">
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No clients yet</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Add your first client
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleClientClick(client.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#8e51ff] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">
                      {getInitials(client)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getDisplayName(client)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {client.email || client.company_name || 'No email'}
                    </p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-[#8e51ff] flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View all clients
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentClientsWidget;
