import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import quizAPI from '../../services/quizAPI';
import { getIconPath } from '../../utils/iconUtils';
import BulkQuestionUpload from './BulkQuestionUpload';
import BulkQuizUpload from './BulkQuizUpload';

export default function QuizzesManagement() {
  const { darkMode } = useOutletContext();

  // Main state
  const [quizzes, setQuizzes] = useState([]);
  const [quizTags, setQuizTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkQuizUpload, setShowBulkQuizUpload] = useState(false);

  // Bulk delete states
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState(null);

  // Form state
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    tag_ids: [],
    is_active: true,
    questions: []
  });

  // Question/Answer editing
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editingAnswerIndex, setEditingAnswerIndex] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState([]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchQuizzes();
  }, [page, perPage, search, tagFilter, activeFilter]);

  useEffect(() => {
    fetchQuizTags();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(tagFilter && { tag_id: tagFilter }),
        ...(activeFilter !== '' && { is_active: activeFilter === 'true' })
      };

      const response = await quizAPI.getQuizzes(params);
      // Handle both direct array response and paginated object response
      const quizzesArray = Array.isArray(response) ? response : (response.quizzes || response.items || []);
      setQuizzes(quizzesArray);
      setTotal(Array.isArray(response) ? response.length : (response.total || 0));
      setTotalPages(Array.isArray(response) ? 1 : (response.total_pages || 1));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizTags = async () => {
    try {
      const response = await quizAPI.getQuizTags({ is_active: true });
      // Handle both direct array response and paginated object response
      const tagsArray = Array.isArray(response) ? response : (response.tags || response.items || []);
      setQuizTags(tagsArray);
    } catch (err) {
      console.error('Error fetching quiz tags:', err);
    }
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({
      title: '',
      description: '',
      tag_ids: [],
      is_active: true,
      questions: []
    });
    setShowQuizModal(true);
  };

  const handleEditQuiz = async (quiz) => {
    try {
      // Fetch full quiz details with questions and answers
      const fullQuiz = await quizAPI.getQuiz(quiz.id);

      // Use available_tags from response if provided, otherwise fall back to current quizTags
      if (fullQuiz.available_tags) {
        setQuizTags(fullQuiz.available_tags);
      }

      setEditingQuiz(fullQuiz);
      setQuizForm({
        title: fullQuiz.title,
        description: fullQuiz.description || '',
        tag_ids: fullQuiz.tag_ids || [],
        is_active: fullQuiz.is_active,
        questions: fullQuiz.questions || []
      });
      setShowQuizModal(true);
    } catch (err) {
      alert(`Error loading quiz: ${err.message}`);
    }
  };

  const handleCloneQuiz = async (quiz) => {
    try {
      const fullQuiz = await quizAPI.getQuiz(quiz.id);

      // Use available_tags from response if provided
      if (fullQuiz.available_tags) {
        setQuizTags(fullQuiz.available_tags);
      }

      setEditingQuiz(null);
      setQuizForm({
        title: `${fullQuiz.title} (Copy)`,
        description: fullQuiz.description || '',
        tag_ids: fullQuiz.tag_ids || [],
        is_active: fullQuiz.is_active,
        questions: (fullQuiz.questions || []).map(q => ({
          ...q,
          id: undefined, // Remove ID so it creates new
          answers: (q.answers || []).map(a => ({
            ...a,
            id: undefined // Remove ID so it creates new
          }))
        }))
      });
      setShowQuizModal(true);
    } catch (err) {
      alert(`Error cloning quiz: ${err.message}`);
    }
  };

  const handleSaveQuiz = async () => {
    try {
      // Validate questions and answers
      for (let i = 0; i < quizForm.questions.length; i++) {
        const question = quizForm.questions[i];

        // Check for at least 2 answers
        if (!question.answers || question.answers.length < 2) {
          alert(`Question ${i + 1} must have at least 2 answers`);
          return;
        }

        // Check for at least one correct answer
        const hasCorrectAnswer = question.answers.some(a => a.is_correct);
        if (!hasCorrectAnswer) {
          alert(`Question ${i + 1} must have at least one correct answer`);
          return;
        }

        // Check all answers have text
        const emptyAnswers = question.answers.filter(a => !a.answer_text || a.answer_text.trim() === '');
        if (emptyAnswers.length > 0) {
          alert(`Question ${i + 1} has answers without text`);
          return;
        }
      }

      const data = {
        title: quizForm.title,
        description: quizForm.description || undefined,
        tag_ids: quizForm.tag_ids,
        is_active: quizForm.is_active
      };

      let savedQuiz;
      if (editingQuiz) {
        savedQuiz = await quizAPI.updateQuiz(editingQuiz.id, data);

        // Handle questions and answers for existing quiz
        await syncQuestionsAndAnswers(editingQuiz.id);
      } else {
        savedQuiz = await quizAPI.createQuiz(data);

        // Add questions and answers for new quiz
        await syncQuestionsAndAnswers(savedQuiz.id);
      }

      setShowQuizModal(false);
      fetchQuizzes();
    } catch (err) {
      alert(`Error saving quiz: ${err.message}`);
    }
  };

  const syncQuestionsAndAnswers = async (quizId) => {
    try {
      // If editing, delete existing questions first
      if (editingQuiz && editingQuiz.questions) {
        for (const q of editingQuiz.questions) {
          await quizAPI.deleteQuestion(q.id);
        }
      }

      // Create all questions with their answers in single requests
      for (let i = 0; i < quizForm.questions.length; i++) {
        const question = quizForm.questions[i];

        // Prepare answers array
        const answers = (question.answers || []).map((answer, j) => ({
          answer_text: answer.answer_text,
          is_correct: answer.is_correct,
          ...(answer.explanation && { explanation: answer.explanation }),
          order_index: j + 1
        }));

        // Create question with answers
        await quizAPI.addQuestion(quizId, {
          question_text: question.question_text,
          points: parseInt(question.points),
          order_index: i + 1,
          answers: answers
        });
      }
    } catch (err) {
      console.error('Error syncing questions and answers:', err);
      throw err;
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;

    try {
      await quizAPI.deleteQuiz(deletingQuiz.id);
      setShowDeleteModal(false);
      setDeletingQuiz(null);
      fetchQuizzes();
    } catch (err) {
      alert(`Error deleting quiz: ${err.message}`);
    }
  };

  const handleToggleActive = async (quiz) => {
    // Optimistically update local state
    setQuizzes(prevQuizzes =>
      prevQuizzes.map(q =>
        q.id === quiz.id ? { ...q, is_active: !q.is_active } : q
      )
    );

    try {
      await quizAPI.updateQuiz(quiz.id, { is_active: !quiz.is_active });
    } catch (err) {
      // Revert on error
      setQuizzes(prevQuizzes =>
        prevQuizzes.map(q =>
          q.id === quiz.id ? { ...q, is_active: !q.is_active } : q
        )
      );
      alert(`Error updating quiz: ${err.message}`);
    }
  };

  const handleAddQuestion = () => {
    const newQuestions = [
      ...quizForm.questions,
      {
        question_text: '',
        points: 10,
        answers: []
      }
    ];
    setQuizForm({
      ...quizForm,
      questions: newQuestions
    });
    // Auto-expand the newly added question
    setExpandedQuestions([...expandedQuestions, newQuestions.length - 1]);
  };

  const handleBulkUploadSuccess = async () => {
    // Refresh the quiz to get updated questions
    if (editingQuiz) {
      const fullQuiz = await quizAPI.getQuiz(editingQuiz.id);
      setQuizForm({
        ...quizForm,
        questions: fullQuiz.questions || []
      });
      setEditingQuiz(fullQuiz);
    }
    setShowBulkUpload(false);
  };

  const handleBulkQuizUploadSuccess = () => {
    // Refresh the quiz list and close bulk upload section
    setShowBulkQuizUpload(false);
    fetchQuizzes();
  };

  const toggleQuestionExpanded = (index) => {
    if (expandedQuestions.includes(index)) {
      setExpandedQuestions(expandedQuestions.filter(i => i !== index));
    } else {
      setExpandedQuestions([...expandedQuestions, index]);
    }
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleAddAnswer = (questionIndex) => {
    const updatedQuestions = [...quizForm.questions];
    if (!updatedQuestions[questionIndex].answers) {
      updatedQuestions[questionIndex].answers = [];
    }
    updatedQuestions[questionIndex].answers.push({
      answer_text: '',
      is_correct: false,
      explanation: ''
    });
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleUpdateAnswer = (questionIndex, answerIndex, field, value) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex].answers[answerIndex] = {
      ...updatedQuestions[questionIndex].answers[answerIndex],
      [field]: value
    };
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleDeleteAnswer = (questionIndex, answerIndex) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex].answers = updatedQuestions[questionIndex].answers.filter(
      (_, i) => i !== answerIndex
    );
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const getTagNames = (tagIds) => {
    if (!tagIds || tagIds.length === 0) return 'No tags';
    const names = tagIds.map(id => {
      const tag = quizTags.find(t => t.id === id);
      return tag ? tag.name : 'Unknown';
    });
    return names.join(', ');
  };

  const getTags = (tagIds) => {
    if (!tagIds || tagIds.length === 0) return [];
    return tagIds.map(id => quizTags.find(t => t.id === id)).filter(Boolean);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotalPoints = (questions) => {
    return questions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);
  };

  const determineQuestionType = (answers) => {
    const correctCount = (answers || []).filter(a => a.is_correct).length;
    return correctCount >= 2 ? 'multi_select' : 'single_select';
  };

  const getQuestionTypeBadge = (questionType) => {
    if (questionType === 'single_select') {
      return 'bg-blue-50 text-blue-700';
    } else if (questionType === 'multi_select') {
      return 'bg-indigo-50 text-indigo-700';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Bulk delete selection handlers
  const handleSelectAllQuizzes = (e) => {
    if (e.target.checked) {
      setSelectedQuizIds(quizzes.map(quiz => quiz.id));
    } else {
      setSelectedQuizIds([]);
    }
  };

  const handleSelectQuiz = (quizId) => {
    if (selectedQuizIds.includes(quizId)) {
      setSelectedQuizIds(selectedQuizIds.filter(id => id !== quizId));
    } else {
      setSelectedQuizIds([...selectedQuizIds, quizId]);
    }
  };

  const handleClearQuizSelection = () => {
    setSelectedQuizIds([]);
  };

  const handleOpenBulkDelete = () => {
    setBulkDeleteResult(null);
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteQuizzes = async () => {
    if (selectedQuizIds.length > 100) {
      alert('Maximum 100 quizzes can be deleted at once');
      return;
    }

    try {
      const result = await quizAPI.bulkDeleteQuizzes({
        quiz_ids: selectedQuizIds
      });
      setBulkDeleteResult(result);

      // If all successful, clear selection and close modal after delay
      if (result.failed === 0) {
        setTimeout(() => {
          setShowBulkDeleteModal(false);
          setSelectedQuizIds([]);
          fetchQuizzes();
        }, 2000);
      } else {
        // If some failed, just refresh the list
        fetchQuizzes();
      }
    } catch (err) {
      alert(`Bulk delete failed: ${err.message}`);
    }
  };

  const getSelectedQuizzes = () => {
    return quizzes.filter(quiz => selectedQuizIds.includes(quiz.id));
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Quizzes Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage quizzes, questions, and answers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Quizzes</div>
            <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {total}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Quizzes</div>
            <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {quizzes.filter(q => q.is_active).length}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Questions</div>
            <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0)}
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <select
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="">All Tags</option>
              {quizTags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateQuiz}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Create Quiz
            </button>
            <button
              onClick={() => setShowBulkQuizUpload(!showBulkQuizUpload)}
              className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              {showBulkQuizUpload ? 'Hide' : '📤'} Bulk Upload Quizzes
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Quiz Upload Section */}
      {showBulkQuizUpload && (
        <div className="px-6 pb-6">
          <BulkQuizUpload
            darkMode={darkMode}
            onSuccess={handleBulkQuizUploadSuccess}
          />
        </div>
      )}

      {/* Quizzes Table */}
      <div className="px-6 pb-6">
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-12">Error: {error}</div>
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedQuizIds.length > 0 && (
                <div className="px-6 pt-4">
                  <div className={`p-4 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {selectedQuizIds.length} quiz{selectedQuizIds.length !== 1 ? 'zes' : ''} selected
                      </span>
                      {selectedQuizIds.length > 100 && (
                        <span className="text-sm text-red-600 font-medium">
                          Warning: Maximum 100 quizzes can be deleted at once
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenBulkDelete}
                        disabled={selectedQuizIds.length > 100}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedQuizIds.length > 100
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Bulk Delete
                      </button>
                      <button
                        onClick={handleClearQuizSelection}
                        className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        <input
                          type="checkbox"
                          checked={quizzes.length > 0 && selectedQuizIds.length === quizzes.length}
                          onChange={handleSelectAllQuizzes}
                          className="rounded"
                        />
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Title
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Description
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Tags
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Questions
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Total Points
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Created
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                    {quizzes.map(quiz => (
                      <tr
                        key={quiz.id}
                        className={selectedQuizIds.includes(quiz.id) ? (darkMode ? 'bg-zenible-primary bg-opacity-10' : 'bg-blue-50') : ''}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedQuizIds.includes(quiz.id)}
                            onChange={() => handleSelectQuiz(quiz.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {quiz.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {quiz.description ? (quiz.description.length > 50 ? quiz.description.substring(0, 50) + '...' : quiz.description) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {(quiz.tags && quiz.tags.length > 0) ? (
                              quiz.tags.map(tag => (
                                <div key={tag.id} className={`flex items-center gap-1 px-2 py-1 rounded-md ${darkMode ? 'bg-zenible-dark-border' : 'bg-gray-100 border border-gray-300'}`}>
                                  <svg className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon)} />
                                  </svg>
                                  <span className={`text-xs font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>{tag.name}</span>
                                </div>
                              ))
                            ) : (
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>No tags</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text' : 'bg-gray-100 text-gray-700'}`}>
                            {quiz.question_count || 0} questions
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {quiz.total_points || 0} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(quiz)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              quiz.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                quiz.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            {formatDate(quiz.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditQuiz(quiz)}
                              className="text-zenible-primary hover:opacity-80"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCloneQuiz(quiz)}
                              className="text-zenible-primary hover:opacity-80"
                            >
                              Clone
                            </button>
                            <button
                              onClick={() => {
                                setDeletingQuiz(quiz);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`px-6 py-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Page {page} of {totalPages} ({total} total)
                    </span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(parseInt(e.target.value));
                        setPage(1);
                      }}
                      className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                    >
                      <option value="10">10 per page</option>
                      <option value="20">20 per page</option>
                      <option value="50">50 per page</option>
                      <option value="100">100 per page</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 text-sm rounded ${
                        page === 1
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-zenible-primary text-white hover:bg-opacity-90'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 text-sm rounded ${
                        page === totalPages
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-zenible-primary text-white hover:bg-opacity-90'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className={`w-full max-w-4xl mx-4 my-8 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
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
                      {quizTags.map(tag => {
                        const isSelected = quizForm.tag_ids.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setQuizForm({ ...quizForm, tag_ids: quizForm.tag_ids.filter(id => id !== tag.id) });
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon)} />
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
                      onClick={handleAddQuestion}
                      className="px-3 py-1 bg-zenible-primary text-white text-sm rounded-lg hover:bg-opacity-90"
                    >
                      + Add Question
                    </button>
                    {editingQuiz && (
                      <button
                        onClick={() => setShowBulkUpload(!showBulkUpload)}
                        className={`px-3 py-1 text-sm rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                      >
                        {showBulkUpload ? 'Hide' : '📤'} Bulk Upload
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk Upload Section */}
                {showBulkUpload && editingQuiz && (
                  <BulkQuestionUpload
                    quizId={editingQuiz.id}
                    darkMode={darkMode}
                    onSuccess={handleBulkUploadSuccess}
                  />
                )}

                {quizForm.questions.map((question, qIndex) => (
                  <div key={qIndex} className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="space-y-3">
                      {/* Question Header - Clickable for expand/collapse */}
                      <div className="flex items-start justify-between">
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => toggleQuestionExpanded(qIndex)}
                        >
                          <svg
                            className={`w-5 h-5 transition-transform flex-shrink-0 ${expandedQuestions.includes(qIndex) ? 'rotate-90' : ''} ${darkMode ? 'text-zenible-dark-text' : 'text-gray-600'}`}
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
                            onClick={() => handleDeleteQuestion(qIndex)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Question Content - Conditionally rendered based on expanded state */}
                      {expandedQuestions.includes(qIndex) && (
                        <>
                          {/* Question Text */}
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                              Question Text *
                            </label>
                            <textarea
                              value={question.question_text}
                              onChange={(e) => handleUpdateQuestion(qIndex, 'question_text', e.target.value)}
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
                              onChange={(e) => handleUpdateQuestion(qIndex, 'points', e.target.value)}
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
                                onClick={() => handleAddAnswer(qIndex)}
                                className="px-2 py-1 bg-zenible-primary text-white text-xs rounded hover:bg-opacity-90"
                              >
                                + Add Answer
                              </button>
                            </div>

                            {(question.answers || []).map((answer, aIndex) => (
                              <div key={aIndex} className={`p-3 rounded border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-300'}`}>
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={answer.is_correct}
                                        onChange={(e) => handleUpdateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)}
                                        className="rounded"
                                      />
                                      <input
                                        type="text"
                                        value={answer.answer_text}
                                        onChange={(e) => handleUpdateAnswer(qIndex, aIndex, 'answer_text', e.target.value)}
                                        placeholder="Answer text..."
                                        className={`flex-1 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-gray-50 border-gray-200'}`}
                                      />
                                      {answer.is_correct && (
                                        <span className="text-zenible-primary text-xs font-medium">✓ Correct</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteAnswer(qIndex, aIndex)}
                                      className="ml-2 text-red-600 hover:text-red-900 text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={answer.explanation || ''}
                                    onChange={(e) => handleUpdateAnswer(qIndex, aIndex, 'explanation', e.target.value)}
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
                ))}
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleSaveQuiz}
                disabled={
                  !quizForm.title ||
                  quizForm.questions.length === 0 ||
                  quizForm.questions.some(q =>
                    !q.answers ||
                    q.answers.length < 2 ||
                    !q.answers.some(a => a.is_correct)
                  )
                }
                className={`px-4 py-2 rounded-lg ${
                  quizForm.title &&
                  quizForm.questions.length > 0 &&
                  !quizForm.questions.some(q =>
                    !q.answers ||
                    q.answers.length < 2 ||
                    !q.answers.some(a => a.is_correct)
                  )
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete the quiz "{deletingQuiz.title}"?
              </p>
              <p className={`mt-2 text-sm text-yellow-600`}>
                This will delete all associated questions and answers. This action cannot be undone.
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleDeleteQuiz}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingQuiz(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Bulk Delete
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {!bulkDeleteResult ? (
                <>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900 bg-opacity-20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                      Warning: This action cannot be undone!
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      You are about to delete {selectedQuizIds.length} quiz{selectedQuizIds.length !== 1 ? 'zes' : ''}.
                      This will also delete all associated questions, answers, user attempts, and logs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      Selected Quizzes ({getSelectedQuizzes().length}):
                    </h4>
                    <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                      <ul className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                        {getSelectedQuizzes().map(quiz => (
                          <li key={quiz.id} className={`px-4 py-3 ${darkMode ? 'hover:bg-zenible-dark-border' : 'hover:bg-gray-50'}`}>
                            <div className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {quiz.title}
                            </div>
                            <div className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                              {quiz.question_count || 0} questions • {quiz.total_points || 0} points
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    bulkDeleteResult.failed === 0
                      ? (darkMode ? 'bg-green-900 bg-opacity-20 border-green-700' : 'bg-green-50 border-green-200')
                      : (darkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
                  }`}>
                    <p className={`font-medium ${
                      bulkDeleteResult.failed === 0
                        ? (darkMode ? 'text-green-400' : 'text-green-800')
                        : (darkMode ? 'text-yellow-400' : 'text-yellow-800')
                    }`}>
                      {bulkDeleteResult.failed === 0
                        ? '✓ All quizzes deleted successfully!'
                        : `⚠️ Partial success: ${bulkDeleteResult.deleted} of ${bulkDeleteResult.total} quizzes deleted`
                      }
                    </p>
                  </div>

                  {bulkDeleteResult.failed > 0 && bulkDeleteResult.errors && bulkDeleteResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        Failed Deletions ({bulkDeleteResult.errors.length}):
                      </h4>
                      <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                        <ul className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                          {bulkDeleteResult.errors.map((error, index) => (
                            <li key={index} className={`px-4 py-3 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
                              <div className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                Quiz ID: {error.quiz_id}
                              </div>
                              <div className="text-sm mt-1 text-red-600">
                                {error.error || 'Unknown error'}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              {!bulkDeleteResult ? (
                <>
                  <button
                    onClick={handleBulkDeleteQuizzes}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete {selectedQuizIds.length} Quiz{selectedQuizIds.length !== 1 ? 'zes' : ''}
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setBulkDeleteResult(null);
                    if (bulkDeleteResult.failed === 0) {
                      setSelectedQuizIds([]);
                    }
                  }}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
