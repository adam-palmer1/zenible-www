import React from 'react';

interface Answer {
  id: string | number;
  answer_text: string;
}

interface Question {
  question_type: string;
  points: number;
  question_text: string;
  answers: Answer[];
}

interface QuestionCardProps {
  question: Question;
  selectedAnswers: (string | number)[];
  onAnswerSelect: (answerId: string | number) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

function QuestionCard({
  question,
  selectedAnswers,
  onAnswerSelect,
  onSubmit,
  canSubmit
}: QuestionCardProps) {
  if (!question) return null;

  const isSingleSelect = question.question_type === 'single_select';

  return (
    <div className="bg-white max-w-[900px] mx-auto px-[24px] py-[32px]">
      {/* Question Header */}
      <div className="mb-[24px]">
        <div className="flex items-center gap-[12px] mb-[12px]">
          <span
            className={`px-[12px] py-[4px] rounded-[8px] text-[12px] font-['Inter'] font-medium ${
              isSingleSelect
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {isSingleSelect ? 'Single Select' : 'Multi Select'}
          </span>
          <span className="px-[12px] py-[4px] rounded-[8px] bg-violet-50 text-[#8e51ff] text-[12px] font-['Inter'] font-medium">
            {question.points} Points
          </span>
        </div>
        <h2 className="font-['Inter'] font-semibold text-[24px] text-zinc-950 leading-[32px]">
          {question.question_text}
        </h2>
        <p className="font-['Inter'] font-normal text-[14px] text-zinc-500 mt-[8px]">
          {isSingleSelect ? 'Choose one answer' : 'Select all that apply'}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-[12px] mb-[32px]">
        {question.answers.map((answer) => {
          const isSelected = selectedAnswers.includes(answer.id);

          return (
            <div
              key={answer.id}
              className={`border-2 rounded-[12px] p-[16px] cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#8e51ff] bg-violet-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
              onClick={() => onAnswerSelect(answer.id)}
            >
              <div className="flex items-start gap-[12px]">
                <input
                  type={isSingleSelect ? 'radio' : 'checkbox'}
                  checked={isSelected}
                  onChange={() => onAnswerSelect(answer.id)}
                  name={isSingleSelect ? 'answer' : undefined}
                  className="mt-[2px] shrink-0 w-[18px] h-[18px] cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <label className="flex-1 font-['Inter'] font-normal text-[16px] text-zinc-950 leading-[24px] cursor-pointer">
                  {answer.answer_text}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`w-full py-[14px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] transition-all ${
          canSubmit
            ? 'bg-[#8e51ff] text-white hover:bg-violet-600'
            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
        }`}
      >
        Submit Answer
      </button>
    </div>
  );
}

export default React.memo(QuestionCard);
