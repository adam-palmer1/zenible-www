import React from 'react';
import TimerCountdown from './TimerCountdown';

interface QuizHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  score: number;
  totalPoints: number;
  expiresAt: string | null;
}

export default function QuizHeader({
  questionNumber,
  totalQuestions,
  score,
  totalPoints,
  expiresAt
}: QuizHeaderProps) {
  const progressPercentage = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="px-[24px] py-[16px]">
        {/* Top Row: Question Progress and Timer */}
        <div className="flex items-center justify-between mb-[12px]">
          <div className="flex items-center gap-[16px]">
            <p className="font-['Inter'] font-semibold text-[18px] text-zinc-950">
              Question {questionNumber} of {totalQuestions}
            </p>
            <div className="bg-neutral-50 px-[12px] py-[6px] rounded-[8px]">
              <p className="font-['Inter'] font-medium text-[14px] text-zinc-950">
                Score: {score}/{totalPoints}
              </p>
            </div>
          </div>
          <TimerCountdown expiresAt={expiresAt} />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-[8px] overflow-hidden">
          <div
            className="bg-[#8e51ff] h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
