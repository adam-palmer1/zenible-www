import React from 'react';
import chartIcon from '../../assets/icons/quizzes/chart-icon.svg';
import arrowRight1 from '../../assets/icons/quizzes/arrow-right-1.svg';
import arrowRight2 from '../../assets/icons/quizzes/arrow-right-2.svg';
import arrowRight3 from '../../assets/icons/quizzes/arrow-right-3.svg';

export default function QuizCard({
  icon,
  title,
  description,
  questionCount = 5,
  isAttempted = false,
  isAvailable = true,
  tags = [],
  onClick
}) {
  const handleClick = () => {
    onClick();
  };

  return (
    <div
      className={`bg-white border border-neutral-200 border-solid box-border content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[12px] shrink-0 w-[366px] transition-all ${
        isAvailable
          ? 'cursor-pointer hover:shadow-md'
          : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={handleClick}
    >
      {/* Status Badges */}
      {(isAttempted || !isAvailable) && (
        <div className="absolute top-[12px] right-[12px] flex gap-[6px]">
          {isAttempted && (
            <span className="bg-blue-100 text-blue-800 px-[8px] py-[4px] rounded-[6px] text-[12px] font-['Inter'] font-medium">
              Attempted
            </span>
          )}
          {!isAvailable && (
            <span className="bg-amber-100 text-amber-800 px-[8px] py-[4px] rounded-[6px] text-[12px] font-['Inter'] font-medium">
              Locked
            </span>
          )}
        </div>
      )}

      {/* Icon */}
      <div className="bg-violet-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[2px] relative rounded-[8px] shrink-0 size-[48px]">
        {icon}
      </div>

      {/* Title and Description */}
      <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] not-italic relative shrink-0 w-full">
        <div className="flex flex-col font-['Inter'] font-semibold justify-center relative shrink-0 text-[18px] text-zinc-950 w-full">
          <p className="leading-[26px]">{title}</p>
        </div>
        <div className="flex flex-col font-['Inter'] font-normal justify-center relative shrink-0 text-[14px] text-zinc-500 w-full">
          <p className="leading-[22px]">{description}</p>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-[6px] mt-[4px]">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-violet-50 text-[#8e51ff] px-[8px] py-[2px] rounded-[6px] text-[12px] font-['Inter'] font-medium capitalize"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section - Chip and Arrow Button */}
      <div className="content-stretch flex h-[28px] items-center justify-between relative shrink-0 w-full">
        {/* Questions Chip */}
        <div className="bg-white border border-neutral-200 border-solid box-border content-stretch flex gap-[3px] h-[28px] items-center justify-center px-[8px] py-[2px] relative rounded-[8px] shrink-0">
          <div className="relative shrink-0 size-[18px]">
            <div className="absolute contents inset-0">
              <img alt="" className="block max-w-none size-full" src={chartIcon} />
            </div>
          </div>
          <p className="font-['Inter'] font-medium leading-[22px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-zinc-950 whitespace-pre">
            {questionCount} Questions
          </p>
        </div>

        {/* Arrow Button */}
        <div className="border border-solid border-zinc-100 relative rounded-[10px] shrink-0 size-[36px]">
          <div className="box-border content-stretch flex gap-[4px] items-center justify-center overflow-clip px-[12px] py-[8px] relative rounded-[inherit] size-[36px]">
            <div className="overflow-clip relative shrink-0 size-[16px]">
              <div className="absolute inset-0">
                <img alt="" className="block max-w-none size-full" src={arrowRight1} />
              </div>
              <div className="absolute bottom-1/2 left-[15.63%] right-[15.63%] top-1/2">
                <div className="absolute inset-[-0.75px_-6.82%]">
                  <img alt="" className="block max-w-none size-full" src={arrowRight2} />
                </div>
              </div>
              <div className="absolute inset-[21.88%_15.63%_21.88%_56.25%]">
                <div className="absolute inset-[-8.33%_-16.67%]">
                  <img alt="" className="block max-w-none size-full" src={arrowRight3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
