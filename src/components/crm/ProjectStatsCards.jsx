import React from 'react';
import {
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { PROJECT_STATUS } from '../../constants/crm';

/**
 * Project statistics cards component
 * Displays overview stats for projects
 * Cards are clickable to filter projects by status
 */
const ProjectStatsCards = ({ stats, activeFilter, onFilterClick }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Projects',
      value: stats.total || 0,
      icon: RectangleStackIcon,
      color: 'blue',
      status: null, // null means "all projects"
    },
    {
      title: 'Planning',
      value: stats.planning || 0,
      icon: ClipboardDocumentListIcon,
      color: 'gray',
      status: PROJECT_STATUS.PLANNING,
    },
    {
      title: 'Active',
      value: stats.active || 0,
      icon: PlayIcon,
      color: 'blue',
      status: PROJECT_STATUS.ACTIVE,
    },
    {
      title: 'On Hold',
      value: stats.on_hold || 0,
      icon: PauseIcon,
      color: 'yellow',
      status: PROJECT_STATUS.ON_HOLD,
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: CheckCircleIcon,
      color: 'green',
      status: PROJECT_STATUS.COMPLETED,
    },
    {
      title: 'Cancelled',
      value: stats.cancelled || 0,
      icon: XCircleIcon,
      color: 'red',
      status: PROJECT_STATUS.CANCELLED,
    },
  ];

  const colorMap = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => {
        const colors = colorMap[card.color] || colorMap.blue;
        const Icon = card.icon;
        const isActive = activeFilter === card.status;

        return (
          <button
            key={card.title}
            onClick={() => onFilterClick(card.status)}
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm transition-all text-left w-full ${
              isActive
                ? 'ring-2 ring-zenible-primary shadow-md scale-105'
                : 'hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {card.value}
                </p>
              </div>
              {Icon && (
                <div
                  className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${
                    isActive ? 'ring-2 ring-zenible-primary' : ''
                  }`}
                >
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ProjectStatsCards;
