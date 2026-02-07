import React, { useState, useEffect } from 'react';
import { RectangleStackIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS, PROJECT_STATUS_HEX_COLORS } from '../../../constants/crm';
import projectsAPI from '../../../services/api/crm/projects';
import { useNavigate } from 'react-router-dom';

interface CurrentProjectsWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

/**
 * Current Projects Widget for Dashboard
 * Shows active and upcoming projects
 */
const CurrentProjectsWidget = ({ settings = {}, isHovered = false }: CurrentProjectsWidgetProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const limit = settings.limit || 3;

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        // Fetch active, planning, and on_hold projects
        const response = await (projectsAPI as any).list({
          statuses: [(PROJECT_STATUS as any).ACTIVE, (PROJECT_STATUS as any).PLANNING, (PROJECT_STATUS as any).ON_HOLD]
        });
        // Sort by start_date (most recent first) and limit
        const sortedProjects = (response.items || response || [])
          .sort((a: any, b: any) => {
            if (!a.start_date) return 1;
            if (!b.start_date) return -1;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
          })
          .slice(0, limit);
        setProjects(sortedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [limit]);

  const handleViewAll = () => {
    navigate('/crm?tab=projects');
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/crm?tab=projects&projectId=${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Projects List */}
      <div className="flex-1 overflow-hidden">
        {projects.length === 0 ? (
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
          {projects.map((project) => (
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
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: (PROJECT_STATUS_HEX_COLORS as any)[project.status] }}
                    />
                    <span className="text-xs text-gray-500">
                      {(PROJECT_STATUS_LABELS as any)[project.status]}
                    </span>
                    {project.services_count > 0 && (
                      <>
                        <span className="text-xs text-gray-300">&bull;</span>
                        <span className="text-xs text-gray-500">
                          {project.services_count} service{project.services_count !== 1 ? 's' : ''}
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
      {projects.length > 0 && (
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
