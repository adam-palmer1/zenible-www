import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import customizationAPI from '../services/customizationAPI';

// Figma SVG assets - converted from localhost to data URIs
const sparkleIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28' fill='none'%3E%3Cpath d='M14 2L16.29 9.71L24 12L16.29 14.29L14 22L11.71 14.29L4 12L11.71 9.71L14 2Z' fill='%238e51ff'/%3E%3C/svg%3E";
const profileIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M20.5901 22C20.5901 18.13 16.7402 15 12.0002 15C7.26015 15 3.41016 18.13 3.41016 22' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const briefcaseIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M8 21V7C8 5.895 8.895 5 10 5H14C15.105 5 16 5.895 16 7V21M5 21H19C20.105 21 21 20.105 21 19V11C21 9.895 20.105 9 19 9H5C3.895 9 3 9.895 3 11V19C3 20.105 3.895 21 5 21Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const awardIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M8.21 13.89L7 23L12 20L17 23L15.79 13.88' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

interface OnboardingQuestion {
  id: string;
  page_number: number;
  display_order: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
  placeholder?: string;
  metadata?: {
    placeholder?: string;
    help_text?: string;
    options?: Array<{ value: string; label: string } | string>;
  };
}

interface OnboardingAnswer {
  question_id: string;
  answer_text?: string;
  answer?: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { darkMode, updatePreference, reloadPreferences } = usePreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  type AnswerValue = string | number | boolean | string[];
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load questions and existing answers on mount
  useEffect(() => {
    if (isOpen) {
      loadQuestionsAndAnswers();
    }
  }, [isOpen]);

  const loadQuestionsAndAnswers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionsData, answersData] = await Promise.all([
        customizationAPI.getQuestions(),
        customizationAPI.getMyAnswers(),
      ]);

      // Sort questions by page_number and display_order
      const sortedQuestions = (((questionsData as Record<string, unknown>).questions as OnboardingQuestion[]) || []).sort((a, b) => {
        if (a.page_number !== b.page_number) {
          return a.page_number - b.page_number;
        }
        return a.display_order - b.display_order;
      });

      setQuestions(sortedQuestions);

      // Convert answers array to object keyed by question_id
      const answersMap: Record<string, AnswerValue> = {};
      // Handle both array directly or object with answers property
      const answersArray: OnboardingAnswer[] = Array.isArray(answersData) ? answersData : ((answersData as Record<string, unknown>).answers as OnboardingAnswer[]) || [];

      if (answersArray.length > 0) {
        answersArray.forEach(item => {
          // Parse answer_text based on question type
          const rawValue = item.answer_text || item.answer || '';
          let parsedValue: AnswerValue = rawValue;

          // Find the question to determine its type
          const question = sortedQuestions.find(q => q.id === item.question_id);
          if (question) {
            if (question.question_type === 'boolean') {
              parsedValue = rawValue === 'true';
            } else if (question.question_type === 'number') {
              parsedValue = Number(rawValue);
            } else if (question.question_type === 'multi_select') {
              try {
                parsedValue = JSON.parse(rawValue) as string[];
              } catch {
                // If parsing fails, treat as single value array
                parsedValue = rawValue ? [rawValue] : [];
              }
            }
          }

          answersMap[item.question_id] = parsedValue;
        });
      }
      setAnswers(answersMap);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get questions for current page
  const getCurrentPageQuestions = () => {
    if (!questions.length || showWelcome) return [];
    const currentPageNumber = currentStep;
    return questions.filter(q => q.page_number === currentPageNumber);
  };


  const validateCurrentPage = () => {
    const pageQuestions = getCurrentPageQuestions();
    const errors: Record<string, string> = {};
    let isValid = true;

    pageQuestions.forEach(question => {
      if (question.is_required && !answers[question.id]) {
        errors[question.id] = 'This field is required';
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const saveCurrentPageAnswers = async () => {
    const pageQuestions = getCurrentPageQuestions();
    const answersToSave: { question_id: string; answer_text: string; answer_metadata: Record<string, unknown> }[] = [];

    pageQuestions.forEach(question => {
      if (answers[question.id] !== undefined && answers[question.id] !== '') {
        // Convert answer to string format for answer_text
        const rawAnswer = answers[question.id];
        let answerText: string;
        if (typeof rawAnswer === 'boolean') {
          answerText = rawAnswer.toString();
        } else if (typeof rawAnswer === 'number') {
          answerText = rawAnswer.toString();
        } else if (Array.isArray(rawAnswer)) {
          answerText = JSON.stringify(rawAnswer);
        } else {
          answerText = rawAnswer;
        }

        answersToSave.push({
          question_id: question.id,
          answer_text: answerText,
          answer_metadata: {}
        });
      }
    });

    if (answersToSave.length > 0) {
      try {
        await customizationAPI.submitBulkAnswers(answersToSave);
      } catch (err) {
        console.error('Failed to save answers:', err);
        throw err;
      }
    }
  };

  const handleNext = async () => {
    // If we're on the welcome page, just move to questions
    if (showWelcome) {
      setShowWelcome(false);
      setCurrentStep(1); // Start with question page 1
      return;
    }

    // If we're on the completion page, complete the onboarding
    if (showCompletion) {
      setSaving(true);
      try {
        await updatePreference('onboarding_status', 'complete', 'user');
        await updatePreference('onboarding_reminder_date', null, 'user');
        await reloadPreferences();
        onClose();
      } catch {
        setError('Failed to complete setup. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!validateCurrentPage()) {
      return;
    }

    setSaving(true);
    try {
      await saveCurrentPageAnswers();

      const totalQuestionPages = Math.max(...questions.map(q => q.page_number || 1));

      if (currentStep < totalQuestionPages) {
        setCurrentStep(currentStep + 1);
      } else {
        // Show completion page after last question
        setShowCompletion(true);
      }
    } catch {
      setError('Failed to save answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    // If we're on the completion page, go back to last question page
    if (showCompletion) {
      setShowCompletion(false);
      return;
    }

    if (!showWelcome && currentStep === 1) {
      // Go back to welcome page
      setShowWelcome(true);
      setCurrentStep(0);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRemindLater = async () => {
    const reminderDate = new Date();
    reminderDate.setHours(reminderDate.getHours() + 24);

    try {
      await updatePreference('onboarding_status', 'deferred', 'user');
      await updatePreference('onboarding_reminder_date', reminderDate.toISOString(), 'user');

      // Reload preferences to ensure they're synced
      await reloadPreferences();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }

    onClose();
  };

  const handleIgnore = async () => {
    await updatePreference('onboarding_status', 'ignored', 'user');
    await updatePreference('onboarding_reminder_date', null, 'user');
    await reloadPreferences();
    onClose();
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Clear validation error for this field
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const renderQuestionInput = (question: OnboardingQuestion) => {
    const rawValue = answers[question.id];
    const value = rawValue !== undefined ? rawValue : '';
    const error = validationErrors[question.id];
    const placeholder = question.metadata?.placeholder || question.placeholder || 'Enter your answer...';

    switch (question.question_type) {
      case 'short_text':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          />
        );

      case 'long_text':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          />
        );

      case 'single_select': {
        const options = question.metadata?.options || [];
        return (
          <select
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          >
            <option value="">Select an option</option>
            {options.map((option, index) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={index} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        );
      }

      case 'multi_select': {
        const multiOptions = question.metadata?.options || [];
        const selectedValues: string[] = value ? (Array.isArray(value) ? value as string[] : [String(value)]) : [];

        return (
          <div className="space-y-2">
            {multiOptions.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const isChecked = selectedValues.includes(optionValue);

              return (
                <label
                  key={index}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer ${
                    isChecked
                      ? 'border-zenible-primary bg-zenible-tab-bg'
                      : darkMode
                      ? 'border-zenible-dark-border bg-zenible-dark-bg'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, optionValue]
                        : selectedValues.filter(v => v !== optionValue);
                      handleAnswerChange(question.id, newValues);
                    }}
                    className="mr-3 text-zenible-primary"
                  />
                  <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                    {optionLabel}
                  </span>
                </label>
              );
            })}
          </div>
        );
      }

      case 'boolean':
        return (
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={value === true || value === 'true'}
                onChange={() => handleAnswerChange(question.id, true)}
                className="mr-2"
              />
              <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={value === false || value === 'false'}
                onChange={() => handleAnswerChange(question.id, false)}
                className="mr-2"
              />
              <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>No</span>
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value as number | string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value ? Number(e.target.value) : '')}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          />
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const maxQuestionPage = questions.length ? Math.max(...questions.map(q => q.page_number || 1)) : 0;
  const currentDisplayStep = showWelcome ? 1 : showCompletion ? maxQuestionPage + 1 : currentStep + 1;
  const totalDisplaySteps = questions.length ? maxQuestionPage + 1 : 1; // +1 for welcome page
  const pageQuestions = getCurrentPageQuestions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>
            {showCompletion ? 'Profile Complete!' : 'Profile Setup'}
          </h2>
          <button
            onClick={handleIgnore}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Stepper */}
        {totalDisplaySteps > 1 && (
          <div className={`px-6 py-3 border-b ${
            darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              {[...Array(totalDisplaySteps)].map((_, index) => {
                const stepNum = index + 1;
                const isActive = !showCompletion && stepNum === currentDisplayStep;
                const isPast = showCompletion || stepNum < currentDisplayStep;

                return (
                  <React.Fragment key={index}>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        isPast
                          ? 'bg-zenible-tab-bg border-[1.5px] border-zenible-primary'
                          : isActive
                          ? 'bg-white border-[1.5px] border-zenible-primary text-zenible-primary'
                          : darkMode
                          ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text-secondary'
                          : 'bg-white border-[1.5px] border-gray-300 text-gray-500'
                      }`}
                    >
                      {isPast ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="#8e51ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        String(stepNum).padStart(2, '0')
                      )}
                    </div>
                    {index < totalDisplaySteps - 1 && (
                      <div className={`w-12 h-[1.5px] ${
                        isPast ? 'bg-zenible-primary' : darkMode ? 'bg-zenible-dark-border' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-8 w-8 text-zenible-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Loading questions...
                </span>
              </div>
            </div>
          ) : showWelcome ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center p-8 space-y-6">
              {/* Icon */}
              <div className="w-14 h-14 bg-zenible-tab-bg rounded-full flex items-center justify-center">
                <img src={sparkleIcon} alt="Sparkle" className="w-7 h-7" />
              </div>

              {/* Title and Description */}
              <div className="text-center max-w-md space-y-2">
                <h3 className={`text-xl font-semibold ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}>
                  Personalize Your Business Intelligence Features
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}>
                  Help Zenible to personalize the content that it creates for your business, ensuring that feedback and guidance are always relevant to your experience and background.
                </p>
                <p className={`text-sm mt-2 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}>
                  Provide as much detail as you can. If a question doesn't apply to you, feel free to leave it blank.
                </p>
              </div>

              {/* Info Cards */}
              <div className="flex gap-4 w-full max-w-lg">
                <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
                  darkMode
                    ? 'bg-zenible-dark-card border-zenible-dark-border'
                    : 'bg-white border-gray-200'
                }`}>
                  <img src={profileIcon} alt="Personal Info" className="w-6 h-6 mx-auto" />
                  <p className={`text-sm ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    Personal Info
                  </p>
                </div>

                <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
                  darkMode
                    ? 'bg-zenible-dark-card border-zenible-dark-border'
                    : 'bg-white border-gray-200'
                }`}>
                  <img src={briefcaseIcon} alt="Work History" className="w-6 h-6 mx-auto" />
                  <p className={`text-sm ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    Work History
                  </p>
                </div>

                <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
                  darkMode
                    ? 'bg-zenible-dark-card border-zenible-dark-border'
                    : 'bg-white border-gray-200'
                }`}>
                  <img src={awardIcon} alt="Qualifications" className="w-6 h-6 mx-auto" />
                  <p className={`text-sm ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    Qualifications
                  </p>
                </div>
              </div>

              {/* Time estimate */}
              <p className={`text-xs text-center ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
              }`}>
                Takes about 5-6 minutes • Recommended for best performance
              </p>

              {/* Remind me later link */}
              <button
                onClick={handleRemindLater}
                className={`text-xs text-center mt-1 underline hover:no-underline transition-all ${
                  darkMode ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Remind me later
              </button>
            </div>
          ) : showCompletion ? (
            /* Completion Screen */
            <div className="flex flex-col items-center justify-center py-16 px-8">
              {/* Green checkmark circle */}
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#8e51ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Title */}
              <h3 className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
              }`}>
                Profile Complete!
              </h3>

              {/* Main text */}
              <p className={`text-sm text-center max-w-md mx-auto mb-6 ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
              }`}>
                Thank you for completing your profile. Zenible will now use your background and preferences to shape every insight, recommendation, and piece of guidance you receive.
              </p>

              {/* Bottom note */}
              <p className={`text-xs text-center ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
              }`}>
                You can update this information anytime in your profile settings
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center">
              <p className={darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}>
                No onboarding questions available.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="p-6">

              {/* Questions */}
              <div className="space-y-6">
                {pageQuestions.map((question) => (
                  <div key={question.id}>
                    <label className={`block mb-2 ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                    }`}>
                      <span className="font-medium">{question.question_text}</span>
                      {question.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {question.metadata?.help_text && (
                      <p className={`text-sm mb-2 ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {question.metadata.help_text}
                      </p>
                    )}
                    {renderQuestionInput(question)}
                    {validationErrors[question.id] && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors[question.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!loading && (
          <div className={`p-4 border-t ${
            darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
          }`}>
            <div className="flex gap-4">
              {showWelcome ? (
                /* Welcome page buttons */
                <>
                  <button
                    onClick={handleIgnore}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Get Started
                  </button>
                </>
              ) : showCompletion ? (
                /* Completion page buttons */
                <>
                  <button
                    onClick={handlePrevious}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={saving}
                    className={`flex-1 px-4 py-3 bg-zenible-primary text-white rounded-lg transition-colors ${
                      saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                    }`}
                  >
                    {saving ? 'Completing...' : 'Complete setup'}
                  </button>
                </>
              ) : (
                /* Question page buttons */
                <>
                  {currentStep === 1 ? (
                    <button
                      onClick={handlePrevious}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors"
                    >
                      Previous
                    </button>
                  ) : currentStep > 1 ? (
                    <button
                      onClick={handlePrevious}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors"
                    >
                      Previous
                    </button>
                  ) : null}

                  <button
                    onClick={handleNext}
                    disabled={saving}
                    className={`flex-1 px-4 py-3 bg-zenible-primary text-white rounded-lg transition-colors ${
                      saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Next'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}