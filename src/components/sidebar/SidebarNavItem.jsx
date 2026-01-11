import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChevronRightIcon from './icons/ChevronRightIcon';

export default function SidebarNavItem({
  icon: Icon,
  label,
  path,
  isActive = false,
  hasChevron = false,
  onClick,
  isCollapsed = false
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
    <div className={isCollapsed ? "px-2" : "px-4"}>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-colors duration-150 text-left group
          ${isActive
            ? 'bg-[#F5F3FF] border border-[#8E51FF] text-[#09090B]'
            : 'text-[#71717A] hover:bg-[#F9FAFB] hover:text-[#374151]'
          }
        `}
        title={isCollapsed ? label : undefined}
      >
        <div className="flex items-center gap-2">
          <Icon
            className="w-6 h-6 flex-shrink-0"
            color={isActive ? '#8E51FF' : 'currentColor'}
          />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {label}
            </span>
          )}
        </div>

        {!isCollapsed && hasChevron && (
          <ChevronRightIcon
            className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-70 rotate-270"
            color="currentColor"
          />
        )}
      </button>
    </div>
  );
}