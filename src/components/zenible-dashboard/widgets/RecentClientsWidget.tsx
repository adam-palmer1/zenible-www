import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';

interface RecentClientsWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

/**
 * Recent Clients Widget for Dashboard
 * Shows recently added or updated clients
 */
const RecentClientsWidget = ({ settings = {}, isHovered = false }: RecentClientsWidgetProps) => {
  const navigate = useNavigate();
  const { data: clients, isLoading: loading } = useDashboardWidget('recentClients');

  const clientList = clients || [];

  // Get initials for avatar
  const getInitials = (client: any): string => {
    const firstName = client.first_name || '';
    const lastName = client.last_name || '';
    const company = client.business_name || '';

    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return company.charAt(0).toUpperCase() || 'C';
  };

  // Get display name: "Firstname Lastname (Company)" or just "Company"
  const getDisplayName = (client: any): string => {
    const firstName = client.first_name || '';
    const lastName = client.last_name || '';
    const company = client.business_name || '';

    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName && company) {
      return `${fullName} (${company})`;
    }
    if (fullName) {
      return fullName;
    }
    return company || 'Unnamed Client';
  };

  const handleViewAll = () => navigate('/crm/clients');
  const handleClientClick = (id: string) => navigate(`/crm/clients?contact=${id}`);

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  return (
    <div className="flex flex-col h-full">
      {clientList.length === 0 ? (
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
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-y-auto space-y-2"
              style={{
                width: isHovered ? '100%' : 'calc(100% + 17px)',
                paddingRight: isHovered ? '0' : '17px',
                transition: 'width 0.2s ease, padding-right 0.2s ease'
              }}
            >
            {clientList.map((client: any) => (
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
                      {client.email || 'No email'}
                    </p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-[#8e51ff] flex-shrink-0" />
                </div>
              </button>
            ))}
            </div>
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
