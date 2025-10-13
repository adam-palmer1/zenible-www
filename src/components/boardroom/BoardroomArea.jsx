import React from 'react';
import { useDrop } from 'react-dnd';
import EmptyState from './EmptyState';
import bgPattern from '../../assets/icons/boardroom/bg-pattern.svg';
import expand1 from '../../assets/icons/boardroom/expand-1.svg';
import expand2 from '../../assets/icons/boardroom/expand-2.svg';
import expand3 from '../../assets/icons/boardroom/expand-3.svg';
import expand4 from '../../assets/icons/boardroom/expand-4.svg';
import expand5 from '../../assets/icons/boardroom/expand-5.svg';

export default function BoardroomArea({ selectedExperts, onExpertDrop, onExpertRemove, darkMode }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EXPERT',
    drop: (item) => {
      if (item.expert) {
        onExpertDrop(item.expert);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [onExpertDrop]);

  return (
    <div
      className={`flex-1 flex flex-col h-full border border-solid ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      } rounded-xl`}
    >
      {/* Header */}
      <div
        className={`border-b border-solid flex items-center gap-4 px-4 ${
          darkMode ? 'border-gray-700' : 'border-neutral-200'
        }`}
        style={{ height: '64px' }}
      >
        {/* Expand Icon */}
        <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
          <img src={expand1} alt="" className="absolute inset-0" />
          <img src={expand2} alt="" className="absolute" style={{ top: '18.75%', left: '18.75%', width: '18.75%', height: '18.75%' }} />
          <img src={expand3} alt="" className="absolute" style={{ top: '18.75%', left: '18.75%', width: '25%', height: '25%' }} />
          <img src={expand4} alt="" className="absolute" style={{ top: '62.5%', left: '62.5%', width: '18.75%', height: '18.75%' }} />
          <img src={expand5} alt="" className="absolute" style={{ top: '56.25%', left: '56.25%', width: '25%', height: '25%' }} />
        </div>

        {/* Title */}
        <h1
          className={`flex-1 font-['Inter'] font-semibold text-[18px] leading-[26px] ${
            darkMode ? 'text-gray-100' : 'text-zinc-950'
          }`}
        >
          The Boardroom
        </h1>
      </div>

      {/* Content Area with Drop Zone */}
      <div
        ref={drop}
        className={`flex-1 relative overflow-hidden transition-colors ${
          isOver ? (darkMode ? 'bg-gray-700/50' : 'bg-neutral-100/50') : ''
        }`}
      >
        {/* Background Pattern */}
        <div
          className="absolute pointer-events-none opacity-30"
          style={{
            left: '-338px',
            top: '-67px',
            width: '1440px',
            height: '960px'
          }}
        >
          <img
            src={bgPattern}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full h-full">
          {selectedExperts.length === 0 ? (
            <EmptyState darkMode={darkMode} />
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              {/* Grid of Selected Experts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedExperts.map((expert) => (
                  <div
                    key={expert.id}
                    className={`border border-solid rounded-xl p-4 flex flex-col gap-3 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    {/* Expert Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: getAvatarColor(expert.id)
                        }}
                      >
                        <span className="font-['Inter'] font-bold text-[20px] leading-[28px] text-white">
                          {getInitials(expert?.name || expert?.character_name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-['Inter'] font-semibold text-[14px] leading-[22px] truncate ${
                            darkMode ? 'text-gray-100' : 'text-zinc-950'
                          }`}
                        >
                          {expert?.name || expert?.character_name || 'Unknown Expert'}
                        </h3>
                        <p
                          className={`font-['Inter'] font-normal text-[10px] leading-[14px] truncate ${
                            darkMode ? 'text-gray-400' : 'text-zinc-500'
                          }`}
                        >
                          {expert?.role || expert?.title || 'Expert'}
                        </p>
                      </div>
                      {/* Remove Button */}
                      <button
                        onClick={() => onExpertRemove(expert.id)}
                        className={`shrink-0 p-1 rounded hover:bg-opacity-10 transition-colors ${
                          darkMode ? 'hover:bg-white' : 'hover:bg-black'
                        }`}
                        title="Remove expert"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 4L4 12M4 4L12 12"
                            stroke={darkMode ? '#9CA3AF' : '#71717A'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Description */}
                    <p
                      className={`font-['Inter'] font-normal text-[12px] leading-[18px] ${
                        darkMode ? 'text-gray-400' : 'text-zinc-500'
                      }`}
                    >
                      {expert?.description || expert?.bio || 'Expert in their field'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
const AVATAR_COLORS = ['#8e51ff', '#00a63e', '#00a6f4', '#fb2c36', '#f0b100'];

function getAvatarColor(id) {
  if (!id) return AVATAR_COLORS[0];
  const index = parseInt(id) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
