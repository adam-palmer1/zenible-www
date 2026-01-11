import React, { useState } from 'react';
import quizAPI from '../../services/quizAPI';
import { ICON_OPTIONS, isValidIcon, getIconPath } from '../../utils/iconUtils';

// Validation functions
const validateAnswer = (answer, questionIndex, answerIndex) => {
  const errors = [];

  if (!answer.answer_text || answer.answer_text.trim().length === 0) {
    errors.push({
      field: `quizzes[].questions[${questionIndex}].answers[${answerIndex}].answer_text`,
      message: `Answer ${answerIndex + 1} text is required`,
      questionIndex,
      answerIndex
    });
  }

  if (typeof answer.is_correct !== 'boolean') {
    errors.push({
      field: `quizzes[].questions[${questionIndex}].answers[${answerIndex}].is_correct`,
      message: `Answer ${answerIndex + 1} must have is_correct as boolean`,
      questionIndex,
      answerIndex
    });
  }

  return errors;
};

const validateQuestion = (question, questionIndex) => {
  const errors = [];

  // Question text required
  if (!question.question_text || question.question_text.trim().length === 0) {
    errors.push({
      field: `quizzes[].questions[${questionIndex}].question_text`,
      message: 'Question text is required',
      questionIndex
    });
  }

  // Points must be >= 1
  if (!question.points || question.points < 1) {
    errors.push({
      field: `quizzes[].questions[${questionIndex}].points`,
      message: 'Points must be at least 1',
      questionIndex
    });
  }

  // Must have at least 2 answers
  if (!question.answers || question.answers.length < 2) {
    errors.push({
      field: `quizzes[].questions[${questionIndex}].answers`,
      message: 'Question must have at least 2 answers',
      questionIndex
    });
  }

  // At least one answer must be correct
  const hasCorrectAnswer = question.answers?.some(a => a.is_correct);
  if (!hasCorrectAnswer) {
    errors.push({
      field: `quizzes[].questions[${questionIndex}].answers`,
      message: 'At least one answer must be marked as correct',
      questionIndex
    });
  }

  // Validate each answer
  question.answers?.forEach((answer, answerIndex) => {
    errors.push(...validateAnswer(answer, questionIndex, answerIndex));
  });

  return errors;
};

const validateQuiz = (quiz, quizIndex) => {
  const errors = [];

  // Title required
  if (!quiz.title || quiz.title.trim().length === 0) {
    errors.push({
      field: `quizzes[${quizIndex}].title`,
      message: 'Quiz title is required',
      quizIndex
    });
  }

  // Must have at least 1 question
  if (!quiz.questions || quiz.questions.length === 0) {
    errors.push({
      field: `quizzes[${quizIndex}].questions`,
      message: 'Quiz must have at least 1 question',
      quizIndex
    });
    return errors; // Can't validate questions if none exist
  }

  // Validate each question
  quiz.questions.forEach((question, questionIndex) => {
    const questionErrors = validateQuestion(question, questionIndex);
    questionErrors.forEach(err => {
      errors.push({
        ...err,
        quizIndex
      });
    });
  });

  return errors;
};

const validateBulkUpload = (data) => {
  const errors = [];

  // Default tag icon required
  if (!data.default_tag_icon || data.default_tag_icon.trim().length === 0) {
    errors.push({
      field: 'default_tag_icon',
      message: 'Default tag icon is required'
    });
  } else if (!isValidIcon(data.default_tag_icon)) {
    errors.push({
      field: 'default_tag_icon',
      message: `Invalid icon name: ${data.default_tag_icon}. Must be a valid Heroicon name.`
    });
  }

  // Must have at least 1 quiz
  if (!data.quizzes || data.quizzes.length === 0) {
    errors.push({
      field: 'quizzes',
      message: 'At least one quiz is required'
    });
    return errors;
  }

  // Maximum 50 quizzes
  if (data.quizzes.length > 50) {
    errors.push({
      field: 'quizzes',
      message: 'Maximum 50 quizzes allowed per upload'
    });
  }

  // Validate each quiz
  data.quizzes.forEach((quiz, quizIndex) => {
    errors.push(...validateQuiz(quiz, quizIndex));
  });

  return errors;
};

export default function BulkQuizUpload({ darkMode, onSuccess }) {
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'paste'
  const [file, setFile] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [defaultTagIcon, setDefaultTagIcon] = useState('book-open');
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        alert('Please upload a JSON file');
        return;
      }
      setFile(selectedFile);
      setValidationErrors([]);
      setUploadResult(null);
    }
  };

  // Parse and validate JSON from file
  const parseAndValidateFile = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Add default_tag_icon to data
      data.default_tag_icon = defaultTagIcon;

      // Validate
      const errors = validateBulkUpload(data);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return null;
      }

      return data;
    } catch (error) {
      setValidationErrors([{
        field: 'file',
        message: 'Invalid JSON format: ' + error.message
      }]);
      return null;
    }
  };

  // Parse and validate JSON from textarea
  const parseAndValidateText = (text) => {
    try {
      const data = JSON.parse(text);

      // Add default_tag_icon to data
      data.default_tag_icon = defaultTagIcon;

      // Validate
      const errors = validateBulkUpload(data);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return null;
      }

      return data;
    } catch (error) {
      setValidationErrors([{
        field: 'json',
        message: 'Invalid JSON format: ' + error.message
      }]);
      return null;
    }
  };

  // Upload to API
  const handleUpload = async () => {
    // Validate input based on mode
    if (inputMode === 'file' && !file) return;
    if (inputMode === 'paste' && !jsonInput.trim()) return;

    setUploading(true);
    setValidationErrors([]);
    setUploadResult(null);

    try {
      // Parse and validate based on input mode
      let data;
      if (inputMode === 'file') {
        data = await parseAndValidateFile(file);
      } else {
        data = parseAndValidateText(jsonInput);
      }

      if (!data) {
        setUploading(false);
        return;
      }

      // Call API
      const result = await quizAPI.bulkUploadQuizzes(data);
      setUploadResult(result);

      if (result.failed === 0 && onSuccess) {
        // Clear inputs and reset after successful upload
        setFile(null);
        setJsonInput('');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Get template JSON object
  const getTemplate = () => {
    return {
      default_tag_icon: "book-open",
      quizzes: [
        {
          title: "Python Basics",
          description: "Test your Python knowledge",
          tag_names: ["python", "programming", "beginner"],
          questions: [
            {
              question_text: "What is the output of print(2 + 2)?",
              points: 10,
              answers: [
                {
                  answer_text: "3",
                  is_correct: false
                },
                {
                  answer_text: "4",
                  is_correct: true,
                  explanation: "In Python, 2 + 2 equals 4"
                },
                {
                  answer_text: "22",
                  is_correct: false
                }
              ]
            },
            {
              question_text: "Which of the following are valid Python data types?",
              points: 5,
              answers: [
                {
                  answer_text: "int",
                  is_correct: true
                },
                {
                  answer_text: "string",
                  is_correct: false,
                  explanation: "The correct type name is 'str', not 'string'"
                },
                {
                  answer_text: "list",
                  is_correct: true
                },
                {
                  answer_text: "dict",
                  is_correct: true
                }
              ]
            }
          ]
        },
        {
          title: "JavaScript Fundamentals",
          description: "Test your JavaScript knowledge",
          tag_names: ["javascript", "web-development"],
          questions: [
            {
              question_text: "What does 'let' keyword do in JavaScript?",
              points: 10,
              answers: [
                {
                  answer_text: "Declares a block-scoped variable",
                  is_correct: true,
                  explanation: "'let' declares variables that are limited to the block scope"
                },
                {
                  answer_text: "Declares a global variable",
                  is_correct: false
                },
                {
                  answer_text: "Declares a constant",
                  is_correct: false
                }
              ]
            }
          ]
        }
      ]
    };
  };

  // Download template JSON as file
  const downloadTemplate = () => {
    const template = getTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-quizzes-template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy template JSON to clipboard
  const copyTemplateToClipboard = async () => {
    try {
      const template = getTemplate();
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      alert('Template copied to clipboard!');
    } catch (error) {
      alert('Failed to copy template to clipboard');
    }
  };

  // Group errors by quiz index
  const groupedErrors = validationErrors.reduce((acc, error) => {
    const key = error.quizIndex !== undefined ? `quiz-${error.quizIndex}` : 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(error);
    return acc;
  }, {});

  return (
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-gray-50 border-gray-300'}`}>
      <h4 className={`font-medium mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
        Bulk Upload Quizzes
      </h4>

      {/* Input Mode Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setInputMode('file');
            setValidationErrors([]);
            setUploadResult(null);
          }}
          disabled={uploading}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === 'file'
              ? 'bg-zenible-primary text-white'
              : darkMode
              ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          📁 Upload File
        </button>
        <button
          onClick={() => {
            setInputMode('paste');
            setValidationErrors([]);
            setUploadResult(null);
          }}
          disabled={uploading}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === 'paste'
              ? 'bg-zenible-primary text-white'
              : darkMode
              ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          📋 Paste JSON
        </button>
      </div>

      {/* Default Tag Icon Selection */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
          Default Icon for Auto-Created Tags
        </label>
        <div className="flex items-center gap-3">
          <select
            value={defaultTagIcon}
            onChange={(e) => setDefaultTagIcon(e.target.value)}
            disabled={uploading}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300'}`}
          >
            {ICON_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={`p-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-gray-300'}`}>
            <svg className={`w-6 h-6 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(defaultTagIcon)} />
            </svg>
          </div>
        </div>
        <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          This icon will be used for any tags that are created during the upload
        </p>
      </div>

      {/* File Upload or JSON Paste Input */}
      {inputMode === 'file' ? (
        <div className="flex gap-2 mb-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={uploading}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300'}`}
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`px-4 py-2 rounded-lg text-sm ${
              file && !uploading
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={downloadTemplate}
            disabled={uploading}
            className={`px-4 py-2 rounded-lg border text-sm ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Download Template
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Paste Quiz JSON
            </label>
            <button
              onClick={copyTemplateToClipboard}
              disabled={uploading}
              className={`px-3 py-1 rounded-lg border text-xs ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              📋 Copy Template
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setValidationErrors([]);
              setUploadResult(null);
            }}
            disabled={uploading}
            placeholder='Paste your quiz JSON here... (e.g., {"quizzes": [...]})'
            rows={12}
            className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary' : 'bg-white border-gray-300 placeholder-gray-400'}`}
          />
          <button
            onClick={handleUpload}
            disabled={!jsonInput.trim() || uploading}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
              jsonInput.trim() && !uploading
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload JSON'}
          </button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className={`p-3 rounded-lg border mb-4 ${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <h5 className={`font-medium text-sm mb-2 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
            Validation Errors ({validationErrors.length}):
          </h5>
          <div className="space-y-2">
            {Object.entries(groupedErrors).map(([key, errors]) => (
              <div key={key}>
                {key !== 'general' && (
                  <p className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Quiz {parseInt(key.replace('quiz-', '')) + 1}:
                  </p>
                )}
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((err, i) => (
                    <li key={i} className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-gray-300'}`}>
          <h5 className={`font-medium text-sm mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
            Upload Results
          </h5>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Total Submitted:
              </p>
              <p className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                {uploadResult.total_submitted}
              </p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Successful:
              </p>
              <p className="text-lg font-semibold text-green-600">
                {uploadResult.successful}
              </p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Failed:
              </p>
              <p className="text-lg font-semibold text-red-600">
                {uploadResult.failed}
              </p>
            </div>
          </div>

          {/* Created Tags */}
          {uploadResult.created_tags && uploadResult.created_tags.length > 0 && (
            <div className={`p-2 rounded border mb-3 ${darkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                Created Tags ({uploadResult.created_tags.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {uploadResult.created_tags.map((tagName, i) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
                    {tagName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Failed Quizzes */}
          {uploadResult.failed > 0 && (
            <div className={`p-2 rounded border ${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                Failed Quizzes:
              </p>
              <ul className="space-y-1">
                {uploadResult.results
                  .filter(r => !r.success)
                  .map((result) => (
                    <li key={result.index} className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                      Quiz {result.index + 1} ({result.title || 'Untitled'}): {result.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {uploadResult.failed === 0 && (
            <div className={`p-2 rounded border ${darkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                ✓ All quizzes uploaded successfully! Refreshing...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className={`p-3 rounded-lg border text-xs ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
        <p className="font-medium mb-1">Upload Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Maximum 50 quizzes per upload</li>
          <li>Each quiz must have a title and at least 1 question</li>
          <li>Each question must have at least 2 answers and 1 correct answer</li>
          <li>Tag names will auto-create tags if they don't exist</li>
          <li>Processing is independent - some quizzes may succeed while others fail</li>
        </ul>
      </div>
    </div>
  );
}
