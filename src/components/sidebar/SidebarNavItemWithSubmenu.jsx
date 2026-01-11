import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SubmenuItemIcon from './icons/SubmenuItemIcon';

export default function SidebarNavItemWithSubmenu({
  icon: Icon,
  label,
  path,
  isActive = false,
  submenuItems = [],
  onClick,
  isCollapsed = false
}) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(isActive || submenuItems.some(item => item.isActive));

  const handleMainClick = () => {
    if (submenuItems.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  const handleSubmenuClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div>
      {/* Main Item */}
      <div className={isCollapsed ? "px-2" : "px-4"}>
        <button
          onClick={handleMainClick}
          className={`
            w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-colors duration-150 text-left group
            ${isActive && !isExpanded
              ? 'bg-[#F5F3FF] border border-[#8E51FF] text-[#09090B]'
              : 'text-[#71717A] hover:bg-[#F9FAFB] hover:text-[#374151]'
            }
          `}
          title={isCollapsed ? label : undefined}
        >
          <div className="flex items-center gap-2">
            <Icon
              className="w-6 h-6 flex-shrink-0"
              color={isActive && !isExpanded ? '#8E51FF' : '#71717A'}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {label}
              </span>
            )}
          </div>

          {!isCollapsed && submenuItems.length > 0 && (
            isExpanded ? (
              <ChevronDownIcon
                className="w-2.5 h-2.5 flex-shrink-0"
                color="#71717A"
              />
            ) : (
              <ChevronRightIcon
                className="w-4 h-4 flex-shrink-0 rotate-270"
                color="#71717A"
              />
            )
          )}
        </button>
      </div>

      {/* Submenu Items - Hidden when collapsed */}
      {!isCollapsed && isExpanded && submenuItems.length > 0 && (
        <div className="mt-2">
          {submenuItems.map((item, index) => (
            <div key={index} className="px-4">
              <button
                onClick={() => handleSubmenuClick(item)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-150 text-left
                  ${item.isActive
                    ? 'bg-[#F5F3FF] border border-[#8E51FF] text-[#09090B]'
                    : 'text-[#71717A] hover:bg-[#F9FAFB] hover:text-[#374151]'
                  }
                `}
              >
                <SubmenuItemIcon
                  className="w-6 h-6 flex-shrink-0"
                  isActive={item.isActive}
                />
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
