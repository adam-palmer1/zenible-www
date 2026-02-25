import React from 'react';
import { RectangleStackIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, type ProjectStatus } from '../../../constants/crm';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';

interface CurrentProjectsWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

/**
 * Current Projects Widget for Dashboard
 * Shows active and upcoming projects
 */
const CurrentProjectsWidget = ({ settings = {}, isHovered = false }: CurrentProjectsWidgetProps) => {
  const { data: projects, isLoading: loading } = useDashboardWidget('currentProjects');
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/crm/projects');
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/crm/projects?projectId=${projectId}`);
  };

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  const projectList = projects || [];

  return (
    <div className="flex flex-col h-full">
      {/* Projects List */}
      <div className="flex-1 overflow-hidden">
        {projectList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <RectangleStackIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No active projects</p>
            <button
              onClick={handleViewAll}
              className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
            >
              View all projects
            </button>
          </div>
        ) : (
          <div
            className="h-full overflow-y-auto space-y-2"
            style={{
              width: isHovered ? '100%' : 'calc(100% + 17px)',
              paddingRight: isHovered ? '0' : '17px',
              transition: 'width 0.2s ease, padding-right 0.2s ease'
            }}
          >
          {projectList.map((project: any) => (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${PROJECT_STATUS_COLORS[project.status as ProjectStatus]}`}>
                      {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                    </span>
                    {project.active_services_count > 0 && (
                      <>
                        <span className="text-xs text-gray-300">&bull;</span>
                        <span className="text-xs text-gray-500">
                          {project.active_services_count} service{project.active_services_count !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-[#8e51ff] flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {projectList.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleViewAll}
            className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
          >
            View all projects
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CurrentProjectsWidget;
