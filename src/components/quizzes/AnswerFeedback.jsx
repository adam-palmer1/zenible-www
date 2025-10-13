import React from 'react';

export default function AnswerFeedback({ isCorrect, pointsEarned, correctAnswers }) {
  return (
    <div className="bg-white max-w-[900px] mx-auto px-[24px] py-[32px]">
      {/* Feedback Header */}
      <div
        className={`border-l-4 rounded-[12px] p-[24px] mb-[24px] ${
          isCorrect
            ? 'border-green-500 bg-green-50'
            : 'border-red-500 bg-red-50'
        }`}
      >
        <div className="flex items-center gap-[16px] mb-[12px]">
          <div
            className={`flex items-center justify-center w-[48px] h-[48px] rounded-full ${
              isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span className="text-white text-[28px] font-bold">
              {isCorrect ? '✓' : '✗'}
            </span>
          </div>
          <div>
            <h3
              className={`font-['Inter'] font-semibold text-[24px] ${
                isCorrect ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h3>
            <p
              className={`font-['Inter'] font-medium text-[16px] ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}
            >
              +{pointsEarned} points
            </p>
          </div>
        </div>
      </div>

      {/* Correct Answers Section */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-[24px]">
        <h4 className="font-['Inter'] font-semibold text-[18px] text-zinc-950 mb-[16px]">
          {isCorrect ? 'Explanation:' : 'Correct Answer(s):'}
        </h4>
        <div className="space-y-[16px]">
          {correctAnswers.map((answer) => (
            <div key={answer.id} className="pb-[16px] border-b border-neutral-200 last:border-b-0 last:pb-0">
              <div className="flex items-start gap-[12px] mb-[8px]">
                <span className="text-green-500 text-[20px] shrink-0">✓</span>
                <p className="font-['Inter'] font-semibold text-[16px] text-zinc-950 leading-[24px]">
                  {answer.answer_text}
                </p>
              </div>
              {answer.explanation && (
                <p className="font-['Inter'] font-normal text-[14px] text-zinc-600 leading-[22px] ml-[32px]">
                  {answer.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-advancing message */}
      <p className="font-['Inter'] font-normal text-[14px] text-zinc-500 text-center mt-[24px]">
        Moving to next question in a moment...
      </p>
    </div>
  );
}
