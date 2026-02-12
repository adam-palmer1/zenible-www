import React, { useState, useEffect } from 'react';
import { RectangleStackIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, type ProjectStatus } from '../../constants/crm';
import projectsAPI from '../../services/api/crm/projects';
import { useNavigate } from 'react-router-dom';

/**
 * Current Projects Widget for Dashboard
 * Shows active and upcoming projects
 */
const CurrentProjectsWidget = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        // Fetch active, planning, and on_hold projects
        const response = await projectsAPI.list({
          statuses: [PROJECT_STATUS.ACTIVE, PROJECT_STATUS.PLANNING, PROJECT_STATUS.ON_HOLD]
        }) as { items?: { id: string; name: string; status: string; start_date?: string; services_count?: number }[] };
        // Sort by start_date (most recent first) and limit to 3
        const sortedProjects = (response.items || [])
          .sort((a: any, b: any) => {
            if (!a.start_date) return 1;
            if (!b.start_date) return -1;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
          })
          .slice(0, 3);
        setProjects(sortedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleViewAll = () => {
    navigate('/crm?tab=projects');
  };

  const handleProjectClick = (projectId: string) => {
    // Navigate to project details (you can customize this)
    navigate(`/crm?tab=projects&projectId=${projectId}`);
  };

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6 h-[246px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 h-[246px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-zinc-700">Current Projects</h3>
        </div>
        <div className="bg-neutral-50 p-2 rounded-lg">
          <RectangleStackIcon className="w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <RectangleStackIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No active projects</p>
            <button
              onClick={handleViewAll}
              className="mt-2 text-xs text-zenible-primary hover:text-zenible-primary/80"
            >
              View all projects
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-zenible-primary hover:bg-blue-50/50 transition-all group"
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
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-zenible-primary flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {projects.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleViewAll}
            className="w-full text-sm text-zenible-primary hover:text-zenible-primary/80 font-medium flex items-center justify-center gap-1"
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
