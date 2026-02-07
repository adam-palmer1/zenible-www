import React from 'react';
import { useDrag } from 'react-dnd';
import dragDot1 from '../../assets/icons/boardroom/drag-dot-1.svg';
import dragDot2 from '../../assets/icons/boardroom/drag-dot-2.svg';
import { AVATAR_COLORS } from '../../constants/colors';

interface ExpertCardProps {
  expert: any;
  darkMode: boolean;
}

function ExpertCard({ expert, darkMode }: ExpertCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EXPERT',
    item: { expert },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [expert]);

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on character ID
  const getAvatarColor = () => {
    if (!expert?.id) return AVATAR_COLORS[0];
    const index = parseInt(expert.id) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  // Truncate description
  const truncateDescription = (text: string, maxLength = 80) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get first 2 skills/tags and count the rest
  const getVisibleSkills = () => {
    const skills = expert?.skills || expert?.tags || [];
    if (skills.length === 0) return [];
    const visible = skills.slice(0, 2);
    const remaining = skills.length - visible.length;
    if (remaining > 0) {
      return [...visible, `+${remaining}`];
    }
    return visible;
  };

  return (
    <div
      ref={drag as any}
      className={`w-full border border-solid box-border flex flex-col gap-4 p-4 rounded-xl transition-opacity ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      } ${isDragging ? 'opacity-50' : 'opacity-100'} cursor-move`}
      style={{ width: '280px' }}
    >
      {/* Header with Avatar, Name, Role, and Drag Handle */}
      <div className="flex gap-3 items-center w-full">
        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: getAvatarColor()
          }}
        >
          <span className="font-['Inter'] font-bold text-[20px] leading-[28px] text-white">
            {getInitials(expert?.name || expert?.character_name)}
          </span>
        </div>

        {/* Name and Role */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-['Inter'] font-semibold text-[14px] leading-[22px] truncate ${
                darkMode ? 'text-gray-100' : 'text-zinc-950'
              }`}
            >
              {expert?.name || expert?.character_name || 'Unknown Expert'}
            </span>
          </div>
          <span
            className={`font-['Inter'] font-normal text-[10px] leading-[14px] truncate ${
              darkMode ? 'text-gray-400' : 'text-zinc-500'
            }`}
          >
            {expert?.role || expert?.title || 'Expert'}
          </span>
        </div>

        {/* Drag Handle Icon */}
        <div className="flex items-center justify-center p-2 rounded-lg shrink-0" style={{ width: '28px', height: '28px' }}>
          <div className="relative" style={{ width: '10.667px', height: '10.667px' }}>
            {/* 6 dots arranged in 2 columns, 3 rows */}
            <img src={dragDot1} alt="" className="absolute" style={{ top: '18.75%', left: '31.25%', width: '9.38%', height: '9.38%' }} />
            <img src={dragDot2} alt="" className="absolute" style={{ top: '18.75%', left: '59.38%', width: '9.38%', height: '9.38%' }} />
            <img src={dragDot2} alt="" className="absolute" style={{ top: '45.31%', left: '31.25%', width: '9.38%', height: '9.38%' }} />
            <img src={dragDot2} alt="" className="absolute" style={{ top: '45.31%', left: '59.38%', width: '9.38%', height: '9.38%' }} />
            <img src={dragDot2} alt="" className="absolute" style={{ top: '71.88%', left: '31.25%', width: '9.38%', height: '9.38%' }} />
            <img src={dragDot2} alt="" className="absolute" style={{ top: '71.88%', left: '59.38%', width: '9.38%', height: '9.38%' }} />
          </div>
        </div>
      </div>

      {/* Description and Skills */}
      <div className="flex flex-col gap-2 w-full">
        {/* Description */}
        <p
          className={`font-['Inter'] font-medium text-[14px] leading-[22px] ${
            darkMode ? 'text-gray-400' : 'text-zinc-500'
          }`}
        >
          {truncateDescription(expert?.description || expert?.bio || 'Expert in their field')}
        </p>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5">
          {getVisibleSkills().map((skill: any, index: number) => (
            <div
              key={index}
              className={`border border-solid box-border flex items-center justify-center px-2 py-0.5 rounded-md h-5 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-zinc-100 border-neutral-200 text-zinc-500'
              }`}
            >
              <span className="font-['Inter'] font-medium text-[10px] leading-[14px] whitespace-nowrap">
                {skill}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ExpertCard);
