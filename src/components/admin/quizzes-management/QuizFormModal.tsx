import React from 'react';
import { getIconPath } from '../../../utils/iconUtils';
import BulkQuestionUpload from '../BulkQuestionUpload';
import { Quiz, QuizAnswer, QuizFormState, QuizQuestion, QuizTag } from './types';
import { calculateTotalPoints } from './utils';
import QuestionEditor from './QuestionEditor';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface QuizFormModalProps {
  darkMode: boolean;
  editingQuiz: Quiz | null;
  quizForm: QuizFormState;
  setQuizForm: (form: QuizFormState) => void;
  quizTags: QuizTag[];
  expandedQuestions: number[];
  showBulkUpload: boolean;
  setShowBulkUpload: (value: boolean) => void;
  onSaveQuiz: () => void;
  onClose: () => void;
  onAddQuestion: () => void;
  onToggleQuestionExpanded: (index: number) => void;
  onUpdateQuestion: (index: number, field: string, value: string | number | boolean) => void;
  onDeleteQuestion: (index: number) => void;
  onAddAnswer: (questionIndex: number) => void;
  onUpdateAnswer: (questionIndex: number, answerIndex: number, field: string, value: string | boolean) => void;
  onDeleteAnswer: (questionIndex: number, answerIndex: number) => void;
  onBulkUploadSuccess: () => void;
}

export default function QuizFormModal({
  darkMode,
  editingQuiz,
  quizForm,
  setQuizForm,
  quizTags,
  expandedQuestions,
  showBulkUpload,
  setShowBulkUpload,
  onSaveQuiz,
  onClose,
  onAddQuestion,
  onToggleQuestionExpanded,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  onBulkUploadSuccess,
}: QuizFormModalProps) {
  useEscapeKey(onClose);

  const isSaveDisabled =
    !quizForm.title ||
    quizForm.questions.length === 0 ||
    quizForm.questions.some((q: QuizQuestion) =>
      !q.answers ||
      q.answers.length < 2 ||
      !q.answers.some((a: QuizAnswer) => a.is_correct)
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className={`w-full max-w-[95vw] md:max-w-4xl mx-4 my-8 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {editingQuiz ? 'Edit Quiz' : 'Create Quiz'}
          </h3>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Quiz Info */}
          <div className="space-y-4">
            <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>Quiz Details</h4>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Title *
              </label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="Enter quiz title..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="Enter quiz description..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Tags
              </label>
              <p className={`text-xs mb-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Click tags to select/deselect
              </p>
              <div className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className="flex flex-wrap gap-2">
                  {quizTags.map((tag: QuizTag) => {
                    const isSelected = quizForm.tag_ids.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setQuizForm({ ...quizForm, tag_ids: quizForm.tag_ids.filter((id: string) => id !== tag.id) });
                          } else {
                            setQuizForm({ ...quizForm, tag_ids: [...quizForm.tag_ids, tag.id] });
                          }
                        }}
                        className={`flex items-center gap-1 px-3 py-2 rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-zenible-primary bg-opacity-10 border-zenible-primary text-zenible-primary'
                            : darkMode
                            ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon ?? 'book-open')} />
                        </svg>
                        <span className="text-sm font-medium">{tag.name}</span>
                        {isSelected && (
                          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={quizForm.is_active}
                onChange={(e) => setQuizForm({ ...quizForm, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Active
              </label>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Questions ({quizForm.questions.length}) - Total Points: {calculateTotalPoints(quizForm.questions)}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={onAddQuestion}
                  className="px-3 py-1 bg-zenible-primary text-white text-sm rounded-lg hover:bg-opacity-90"
                >
                  + Add Question
                </button>
                {editingQuiz && (
                  <button
                    onClick={() => setShowBulkUpload(!showBulkUpload)}
                    className={`px-3 py-1 text-sm rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {showBulkUpload ? 'Hide' : '\uD83D\uDCE4'} Bulk Upload
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Upload Section */}
            {showBulkUpload && editingQuiz && (
              <BulkQuestionUpload
                quizId={editingQuiz.id}
                darkMode={darkMode}
                onSuccess={onBulkUploadSuccess}
              />
            )}

            {quizForm.questions.map((question: QuizQuestion, qIndex: number) => (
              <QuestionEditor
                key={qIndex}
                darkMode={darkMode}
                question={question}
                qIndex={qIndex}
                isExpanded={expandedQuestions.includes(qIndex)}
                onToggleExpanded={onToggleQuestionExpanded}
                onUpdateQuestion={onUpdateQuestion}
                onDeleteQuestion={onDeleteQuestion}
                onAddAnswer={onAddAnswer}
                onUpdateAnswer={onUpdateAnswer}
                onDeleteAnswer={onDeleteAnswer}
              />
            ))}
          </div>
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onSaveQuiz}
            disabled={isSaveDisabled}
            className={`px-4 py-2 rounded-lg ${
              !isSaveDisabled
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
