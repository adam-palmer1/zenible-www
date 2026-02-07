import React, { useState, useEffect, useMemo } from 'react';
import customizationAPI from '../services/customizationAPI';
import { usePreferences } from '../contexts/PreferencesContext';

interface CustomizationQuestionsProps {
  onComplete?: (() => void) | null;
  showProgress?: boolean;
  autoSave?: boolean;
  className?: string;
  mode?: string;
}

const CustomizationQuestions: React.FC<CustomizationQuestionsProps> = ({
  onComplete = null,
  showProgress = true,
  autoSave = true,
  className = ''
}) => {
  const { darkMode } = usePreferences() as any;
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<any>(null);

  useEffect(() => {
    loadQuestionsAndAnswers();
  }, []);

  const loadQuestionsAndAnswers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionsData, answersData, statusData] = await Promise.all([
        customizationAPI.getQuestions(),
        customizationAPI.getMyAnswers(),
        customizationAPI.getCompletionStatus(),
      ]);

      setQuestions((questionsData as any).questions || []);

      // Convert answers array to object keyed by question_id
      const answersMap: Record<string, any> = {};
      // Handle both array and object response formats
      const answersArray = Array.isArray(answersData) ? answersData : ((answersData as any).answers || []);

      answersArray.forEach((item: any) => {
        // Use answer_text from the API response
        answersMap[item.question_id] = item.answer_text;
      });

      setAnswers(answersMap);
      setCompletionStatus(statusData);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateAnswer = (question: any, value: any) => {
    const rules = question.validation_rules || {};

    // Check required
    if (question.is_required && !value) {
      return 'This field is required';
    }

    // Type-specific validation
    switch (question.question_type) {
      case 'short_text':
      case 'long_text':
      case 'rich_text':
        if (rules.min_length && value && value.length < rules.min_length) {
          return `Minimum ${rules.min_length} characters required`;
        }
        if (rules.max_length && value && value.length > rules.max_length) {
          return `Maximum ${rules.max_length} characters allowed`;
        }
        if (rules.regex && value) {
          try {
            const regex = new RegExp(rules.regex);
            if (!regex.test(value)) {
              return 'Invalid format';
            }
          } catch {
            console.error('Invalid regex:', rules.regex);
          }
        }
        break;

      case 'number':
      case 'range': {
        const numValue = parseFloat(value);
        if (value && isNaN(numValue)) {
          return 'Must be a valid number';
        }
        if (rules.min_value !== undefined && numValue < rules.min_value) {
          return `Minimum value is ${rules.min_value}`;
        }
        if (rules.max_value !== undefined && numValue > rules.max_value) {
          return `Maximum value is ${rules.max_value}`;
        }
        break;
      }

      case 'url':
        if (value) {
          try {
            new URL(value);
          } catch {
            return 'Must be a valid URL';
          }
          if (rules.allowed_domains && rules.allowed_domains.length > 0) {
            const url = new URL(value);
            if (!rules.allowed_domains.includes(url.hostname)) {
              return `URL must be from: ${rules.allowed_domains.join(', ')}`;
            }
          }
        }
        break;

      case 'date':
        if (value && !Date.parse(value)) {
          return 'Must be a valid date';
        }
        break;
    }

    return null;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    setIsDirty(true);

    // Clear validation error when user starts typing
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const saveAllAnswers = async () => {
    if (!isDirty) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate all answers
      const errors: Record<string, string> = {};
      let hasErrors = false;

      questions.forEach(question => {
        const value = answers[question.id];
        const validationError = validateAnswer(question, value);
        if (validationError) {
          errors[question.id] = validationError;
          hasErrors = true;
        }
      });

      if (hasErrors) {
        setValidationErrors(errors);
        setSaving(false);
        return;
      }

      // Prepare answers for submission
      const answersToSubmit = Object.entries(answers)
        .filter(([, answer]) => answer !== undefined && answer !== '')
        .map(([question_id, answer]) => ({
          question_id,
          answer_text: String(answer), // Convert to string as backend expects
          answer_metadata: {}
        }));

      if (answersToSubmit.length > 0) {
        await customizationAPI.submitBulkAnswers(answersToSubmit);
      }

      setIsDirty(false);
      setSuccessMessage('Your answers have been saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Update completion status
      const statusData = await customizationAPI.getCompletionStatus();
      setCompletionStatus(statusData);

      // Call onComplete callback if all required questions are answered
      if (onComplete && statusData && (statusData as any).is_complete) {
        onComplete();
      }
    } catch (err) {
      setError('Failed to save answers. Please try again.');
      console.error('Failed to save answers:', err);
    } finally {
      setSaving(false);
    }
  };


  const renderQuestionInput = (question: any) => {
    const value = answers[question.id] || '';
    const fieldError = validationErrors[question.id];

    switch (question.question_type) {
      case 'short_text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.metadata?.placeholder || question.placeholder || 'Enter your answer...'}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent ${
              fieldError
                ? 'border-red-300'
                : darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'long_text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.metadata?.placeholder || question.placeholder || 'Enter your answer...'}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent ${
              fieldError
                ? 'border-red-300'
                : darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'rich_text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.metadata?.placeholder || question.placeholder || 'Enter your answer...'}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent ${
              fieldError
                ? 'border-red-300'
                : darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent ${
              fieldError
                ? 'border-red-300'
                : darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValue, option]
                      : currentValue.filter((v: string) => v !== option);
                    handleAnswerChange(question.id, newValue);
                  }}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={value === true || value === 'true'}
                onChange={() => handleAnswerChange(question.id, 'true')}
                className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300"
              />
              <span className={`ml-2 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={value === false || value === 'false'}
                onChange={() => handleAnswerChange(question.id, 'false')}
                className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300"
              />
              <span className={`ml-2 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>No</span>
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value ? parseFloat(e.target.value) : '')}
            placeholder={question.metadata?.placeholder || question.placeholder || 'Enter a number...'}
            min={question.validation_rules?.min_value}
            max={question.validation_rules?.max_value}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              fieldError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      case 'range': {
        const min = question.validation_rules?.min_value || 0;
        const max = question.validation_rules?.max_value || 100;
        const step = question.validation_rules?.step || 1;
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value || min}
              onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{min}</span>
              <span className="font-medium text-gray-700">{value || min}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      }

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              fieldError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.metadata?.placeholder || question.placeholder || 'https://example.com'}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              fieldError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      case 'file':
        return (
          <div className="text-sm text-gray-500">
            File upload is not yet implemented
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Unsupported question type: {question.question_type}
          </div>
        );
    }
  };

  const progressPercentage = useMemo(() => {
    if (!questions.length) return 0;
    const answeredCount = Object.keys(answers).filter(key => answers[key] !== undefined && answers[key] !== '').length;
    return Math.round((answeredCount / questions.length) * 100);
  }, [questions, answers]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Set!</h3>
        <p className="text-gray-500">No customization questions available at this time.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-purple-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Object.keys(answers).filter(key => answers[key] !== undefined && answers[key] !== '').length} of {questions.length} questions answered
          </p>
        </div>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className={`rounded-lg shadow p-6 ${
            darkMode ? 'bg-zenible-dark-card' : 'bg-white'
          }`}>
            <div className="mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`text-base font-medium mb-1 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}>
                    {question.question_text}
                    {question.is_required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </h3>
                  {(question.metadata?.help_text || question.help_text) && (
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      {question.metadata?.help_text || question.help_text}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-2">
              {renderQuestionInput(question)}
            </div>

            {validationErrors[question.id] && (
              <p className="text-sm text-red-600 mt-1">
                {validationErrors[question.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Save Button (for manual save mode) */}
      {!autoSave && (
        <div className="flex justify-end mt-6">
          <button
            onClick={saveAllAnswers}
            disabled={saving || !isDirty}
            className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
              darkMode
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-zenible-primary text-white hover:bg-opacity-90'
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Answers'
            )}
          </button>
        </div>
      )}

      {/* Auto-save indicator */}
      {autoSave && isDirty && (
        <div className="text-right text-sm text-gray-500">
          {saving ? (
            <span className="flex items-center justify-end">
              <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <span>Changes will be saved automatically</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomizationQuestions;
