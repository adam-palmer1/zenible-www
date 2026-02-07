import React from 'react';
import { QuizAnswer, QuizQuestion } from './types';
import { determineQuestionType, getQuestionTypeBadge } from './utils';

interface QuestionEditorProps {
  darkMode: boolean;
  question: QuizQuestion;
  qIndex: number;
  isExpanded: boolean;
  onToggleExpanded: (index: number) => void;
  onUpdateQuestion: (index: number, field: string, value: string | number | boolean) => void;
  onDeleteQuestion: (index: number) => void;
  onAddAnswer: (questionIndex: number) => void;
  onUpdateAnswer: (questionIndex: number, answerIndex: number, field: string, value: string | boolean) => void;
  onDeleteAnswer: (questionIndex: number, answerIndex: number) => void;
}

export default function QuestionEditor({
  darkMode,
  question,
  qIndex,
  isExpanded,
  onToggleExpanded,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
}: QuestionEditorProps) {
  return (
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
      <div className="space-y-3">
        {/* Question Header - Clickable for expand/collapse */}
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={() => onToggleExpanded(qIndex)}
          >
            <svg
              className={`w-5 h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''} ${darkMode ? 'text-zenible-dark-text' : 'text-gray-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h5 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
              Question {qIndex + 1}
              {question.question_text && ` - ${question.question_text.substring(0, 50)}${question.question_text.length > 50 ? '...' : ''}`}
            </h5>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className={`px-2 py-1 text-xs rounded-full ${getQuestionTypeBadge(determineQuestionType(question.answers))}`}>
              {determineQuestionType(question.answers) === 'single_select' ? 'Single Choice' : 'Multiple Choice'}
            </span>
            <button
              onClick={() => onDeleteQuestion(qIndex)}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Question Content - Conditionally rendered based on expanded state */}
        {isExpanded && (
          <>
            {/* Question Text */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Question Text *
              </label>
              <textarea
                value={question.question_text}
                onChange={(e) => onUpdateQuestion(qIndex, 'question_text', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300'}`}
                placeholder="Enter question text..."
              />
            </div>

            {/* Question Points */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Points *
              </label>
              <input
                type="number"
                min="1"
                value={question.points}
                onChange={(e) => onUpdateQuestion(qIndex, 'points', e.target.value)}
                className={`w-32 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Answers Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Answers ({(question.answers || []).length})
                </label>
                <button
                  onClick={() => onAddAnswer(qIndex)}
                  className="px-2 py-1 bg-zenible-primary text-white text-xs rounded hover:bg-opacity-90"
                >
                  + Add Answer
                </button>
              </div>

              {(question.answers || []).map((answer: QuizAnswer, aIndex: number) => (
                <div key={aIndex} className={`p-3 rounded border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-300'}`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={answer.is_correct}
                          onChange={(e) => onUpdateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)}
                          className="rounded"
                        />
                        <input
                          type="text"
                          value={answer.answer_text}
                          onChange={(e) => onUpdateAnswer(qIndex, aIndex, 'answer_text', e.target.value)}
                          placeholder="Answer text..."
                          className={`flex-1 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-gray-50 border-gray-200'}`}
                        />
                        {answer.is_correct && (
                          <span className="text-zenible-primary text-xs font-medium">&#10003; Correct</span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteAnswer(qIndex, aIndex)}
                        className="ml-2 text-red-600 hover:text-red-900 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="text"
                      value={answer.explanation || ''}
                      onChange={(e) => onUpdateAnswer(qIndex, aIndex, 'explanation', e.target.value)}
                      placeholder="Explanation (optional)..."
                      className={`w-full px-2 py-1 rounded border text-xs ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
