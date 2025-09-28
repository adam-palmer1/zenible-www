import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChevronRightIcon from './icons/ChevronRightIcon';

export default function SidebarNavItem({
  icon: Icon,
  label,
  path,
  isActive = false,
  hasChevron = false,
  onClick
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div className="px-4">
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 text-left group
          ${isActive
            ? 'bg-[#F3F0FF] text-[#8B5CF6]'
            : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <Icon
            className="w-5 h-5 flex-shrink-0"
            color={isActive ? '#8B5CF6' : 'currentColor'}
          />
          <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
            {label}
          </span>
        </div>

        {hasChevron && (
          <ChevronRightIcon
            className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-70"
            color="currentColor"
          />
        )}
      </button>
    </div>
  );
}