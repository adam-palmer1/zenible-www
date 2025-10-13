import React, { useState } from 'react';
import quizAPI from '../../services/quizAPI';

// Validation functions
const validateQuestion = (question, index) => {
  const errors = [];

  // 1. Question text required
  if (!question.question_text || question.question_text.trim().length === 0) {
    errors.push({
      field: `questions[${index}].question_text`,
      message: 'Question text is required',
      index
    });
  }

  // 2. Points must be >= 1
  if (!question.points || question.points < 1) {
    errors.push({
      field: `questions[${index}].points`,
      message: 'Points must be at least 1',
      index
    });
  }

  // 3. Must have at least 2 answers
  if (!question.answers || question.answers.length < 2) {
    errors.push({
      field: `questions[${index}].answers`,
      message: 'Question must have at least 2 answers',
      index
    });
  }

  // 4. At least one answer must be correct
  const hasCorrectAnswer = question.answers?.some(a => a.is_correct);
  if (!hasCorrectAnswer) {
    errors.push({
      field: `questions[${index}].answers`,
      message: 'At least one answer must be marked as correct',
      index
    });
  }

  // 5. Validate each answer
  question.answers?.forEach((answer, answerIndex) => {
    if (!answer.answer_text || answer.answer_text.trim().length === 0) {
      errors.push({
        field: `questions[${index}].answers[${answerIndex}].answer_text`,
        message: `Answer ${answerIndex + 1} text is required`,
        index
      });
    }
  });

  return errors;
};

const validateBulkUpload = (data) => {
  const errors = [];

  // 1. Must have at least 1 question
  if (!data.questions || data.questions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'At least one question is required'
    });
    return errors;
  }

  // 2. Maximum 100 questions
  if (data.questions.length > 100) {
    errors.push({
      field: 'questions',
      message: 'Maximum 100 questions allowed per upload'
    });
  }

  // 3. Mode validation
  if (data.mode && !['append', 'replace'].includes(data.mode)) {
    errors.push({
      field: 'mode',
      message: "Mode must be 'append' or 'replace'"
    });
  }

  // 4. Validate each question
  data.questions.forEach((question, index) => {
    errors.push(...validateQuestion(question, index));
  });

  return errors;
};

export default function BulkQuestionUpload({ quizId, darkMode, onSuccess }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('append');
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

  // Parse and validate JSON file
  const parseAndValidate = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

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

  // Upload to API
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setValidationErrors([]);
    setUploadResult(null);

    try {
      // Parse and validate
      const data = await parseAndValidate(file);
      if (!data) {
        setUploading(false);
        return;
      }

      // Add mode to request
      data.mode = mode;

      // Call API
      const result = await quizAPI.bulkUploadQuestions(quizId, data);
      setUploadResult(result);

      if (result.failed === 0 && onSuccess) {
        // Clear file and reset after successful upload
        setFile(null);
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

  // Download template JSON
  const downloadTemplate = () => {
    const template = {
      questions: [
        {
          question_text: "What is the capital of France?",
          points: 10,
          order_index: 1,
          answers: [
            {
              answer_text: "London",
              is_correct: false,
              order_index: 0
            },
            {
              answer_text: "Paris",
              is_correct: true,
              explanation: "Paris is the capital and largest city of France",
              order_index: 1
            },
            {
              answer_text: "Berlin",
              is_correct: false,
              order_index: 2
            }
          ]
        },
        {
          question_text: "Which of the following are programming languages?",
          points: 5,
          order_index: 2,
          answers: [
            {
              answer_text: "Python",
              is_correct: true,
              order_index: 0
            },
            {
              answer_text: "JavaScript",
              is_correct: true,
              order_index: 1
            },
            {
              answer_text: "HTML",
              is_correct: false,
              explanation: "HTML is a markup language, not a programming language",
              order_index: 2
            }
          ]
        }
      ],
      mode: "append"
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quiz-questions-template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Group errors by question index
  const groupedErrors = validationErrors.reduce((acc, error) => {
    const key = error.index !== undefined ? `question-${error.index}` : 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(error);
    return acc;
  }, {});

  return (
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-gray-50 border-gray-300'}`}>
      <h4 className={`font-medium mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
        Bulk Upload Questions
      </h4>

      {/* Mode Selection */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
          Upload Mode
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="append"
              checked={mode === 'append'}
              onChange={(e) => setMode(e.target.value)}
              className="rounded"
              disabled={uploading}
            />
            <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Append (add to existing questions)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="replace"
              checked={mode === 'replace'}
              onChange={(e) => setMode(e.target.value)}
              className="rounded"
              disabled={uploading}
            />
            <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Replace (delete all existing questions first)
            </span>
          </label>
        </div>
      </div>

      {/* File Upload */}
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
                    Question {key.replace('question-', '')}:
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
          <div className="grid grid-cols-2 gap-2 mb-3">
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
            <div>
              <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Quiz Total Points:
              </p>
              <p className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                {uploadResult.quiz_total_points}
              </p>
            </div>
          </div>

          {/* Failed Questions */}
          {uploadResult.failed > 0 && (
            <div className={`p-2 rounded border ${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                Failed Questions:
              </p>
              <ul className="space-y-1">
                {uploadResult.results
                  .filter(r => !r.success)
                  .map((result) => (
                    <li key={result.index} className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                      Question {result.index + 1}: {result.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {uploadResult.failed === 0 && (
            <div className={`p-2 rounded border ${darkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                ✓ All questions uploaded successfully! Refreshing...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
