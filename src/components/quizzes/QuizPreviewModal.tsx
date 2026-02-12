import React from 'react';
import chartIcon from '../../assets/icons/quizzes/chart-icon.svg';

interface QuizPreviewModalProps {
  quiz: any;
  onStartQuiz: () => void;
  onTryAnother: () => void;
  onClose: () => void;
}

export default function QuizPreviewModal({ quiz, onStartQuiz, onTryAnother, onClose }: QuizPreviewModalProps) {
  if (!quiz) return null;

  // Prevent clicks inside modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isAttempted = quiz.is_attempted || false;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 border-solid content-stretch flex flex-col items-start relative rounded-[12px] max-w-[95vw] md:max-w-[700px] max-h-[90vh] overflow-auto"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="box-border content-stretch flex gap-[8px] items-center p-[24px] pb-[16px] relative shrink-0 w-full border-b border-neutral-200">
          <div className="flex-1 flex items-center gap-[12px]">
            <h2 className="font-['Inter'] font-semibold text-[24px] text-zinc-950 leading-[32px]">
              {quiz.title}
            </h2>
            {isAttempted && (
              <span className="bg-blue-100 text-blue-800 px-[10px] py-[4px] rounded-[6px] text-[12px] font-['Inter'] font-medium">
                Already Attempted
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Description */}
        {quiz.description && (
          <div className="px-[24px] pt-[16px]">
            <p className="font-['Inter'] font-normal text-[16px] text-zinc-600 leading-[24px]">
              {quiz.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="px-[24px] pt-[16px] flex gap-[16px] flex-wrap">
          <div className="flex items-center gap-[8px]">
            <div className="relative shrink-0 size-[18px]">
              <img alt="" className="block max-w-none size-full" src={chartIcon} />
            </div>
            <p className="font-['Inter'] font-medium text-[14px] text-zinc-950">
              {quiz.total_questions} Questions
            </p>
          </div>
          <div className="flex items-center gap-[8px]">
            <span className="text-[18px]">⭐</span>
            <p className="font-['Inter'] font-medium text-[14px] text-zinc-950">
              {quiz.total_points} Points Total
            </p>
          </div>
          {quiz.expire_time_minutes && (
            <div className="flex items-center gap-[8px]">
              <span className="text-[18px]">⏱️</span>
              <p className="font-['Inter'] font-medium text-[14px] text-zinc-950">
                {quiz.expire_time_minutes} Minute Time Limit
              </p>
            </div>
          )}
        </div>

        {/* Sample Question */}
        {quiz.first_question && (
          <div className="px-[24px] pt-[24px] pb-[16px] w-full">
            <div className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-[16px]">
              <h3 className="font-['Inter'] font-semibold text-[16px] text-zinc-950 mb-[12px]">
                Sample Question:
              </h3>
              <p className="font-['Inter'] font-medium text-[16px] text-zinc-800 mb-[16px] leading-[24px]">
                {quiz.first_question.question_text}
              </p>
              <div className="space-y-[8px]">
                {quiz.first_question.answers.map((answer: any) => (
                  <div
                    key={answer.id}
                    className="flex items-start gap-[12px] font-['Inter'] font-normal text-[14px] text-zinc-600"
                  >
                    <span className="shrink-0 mt-1">
                      {quiz.first_question.question_type === 'single_select' ? '\u25CB' : '\u2610'}
                    </span>
                    <span>{answer.answer_text}</span>
                  </div>
                ))}
              </div>
              {quiz.first_question.question_type === 'multi_select' && (
                <p className="font-['Inter'] font-normal text-[12px] text-zinc-500 mt-[12px] italic">
                  * Multiple answers may be correct
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="box-border content-stretch flex gap-[16px] items-start p-[24px] pt-[16px] relative shrink-0 w-full">
          <button
            onClick={onTryAnother}
            className="basis-0 border border-neutral-200 border-solid grow min-h-px min-w-px relative rounded-[12px] shrink-0 hover:bg-gray-50 transition-colors"
          >
            <div className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[inherit] w-full">
              <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-950 whitespace-pre">
                Try Another
              </p>
            </div>
          </button>
          <button
            onClick={onStartQuiz}
            className="basis-0 bg-[#8e51ff] box-border content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px overflow-clip p-[12px] relative rounded-[12px] shrink-0 hover:bg-violet-600 transition-colors"
          >
            <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
              {isAttempted ? 'Retake Quiz' : 'Start Quiz'}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
