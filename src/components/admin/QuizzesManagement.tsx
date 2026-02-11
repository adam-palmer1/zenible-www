import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import quizAPI from '../../services/quizAPI';
import BulkQuizUpload from './BulkQuizUpload';
import { useModalState } from '../../hooks/useModalState';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { Quiz, QuizAnswer, QuizFormState, QuizQuestion, QuizTag, BulkDeleteResult } from './quizzes-management/types';
import QuizStatsCards from './quizzes-management/QuizStatsCards';
import QuizFilters from './quizzes-management/QuizFilters';
import QuizTable from './quizzes-management/QuizTable';
import QuizFormModal from './quizzes-management/QuizFormModal';
import DeleteQuizModal from './quizzes-management/DeleteQuizModal';
import BulkDeleteModal from './quizzes-management/BulkDeleteModal';

export default function QuizzesManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  // Main state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizTags, setQuizTags] = useState<QuizTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Modal states
  const quizModal = useModalState();
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const deleteConfirmation = useDeleteConfirmation<Quiz>();
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);
  const [showBulkQuizUpload, setShowBulkQuizUpload] = useState<boolean>(false);

  // Bulk delete states
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const bulkDeleteModal = useModalState();
  const [bulkDeleteResult, setBulkDeleteResult] = useState<BulkDeleteResult | null>(null);

  // Form state
  const [quizForm, setQuizForm] = useState<QuizFormState>({
    title: '',
    description: '',
    tag_ids: [],
    is_active: true,
    questions: []
  });

  // Question/Answer editing
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

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
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(tagFilter && { tag_id: tagFilter }),
        ...(activeFilter !== '' && { is_active: activeFilter })
      };

      const response = await quizAPI.getQuizzes(params) as Record<string, unknown>;
      // Handle both direct array response and paginated object response
      const quizzesArray = Array.isArray(response) ? response : ((response.quizzes || response.items || []) as Quiz[]);
      setQuizzes(quizzesArray);
      setTotal(Array.isArray(response) ? response.length : ((response.total as number) || 0));
      setTotalPages(Array.isArray(response) ? 1 : ((response.total_pages as number) || 1));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizTags = async () => {
    try {
      const response = await quizAPI.getQuizTags({ is_active: 'true' }) as Record<string, unknown>;
      // Handle both direct array response and paginated object response
      const tagsArray = Array.isArray(response) ? response : ((response.tags || response.items || []) as QuizTag[]);
      setQuizTags(tagsArray);
    } catch (err: unknown) {
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
    quizModal.open();
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    try {
      // Fetch full quiz details with questions and answers
      const fullQuiz = await quizAPI.getQuiz(quiz.id) as Quiz;

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
      quizModal.open();
    } catch (err: unknown) {
      alert(`Error loading quiz: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCloneQuiz = async (quiz: Quiz) => {
    try {
      const fullQuiz = await quizAPI.getQuiz(quiz.id) as Quiz;

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
        questions: (fullQuiz.questions || []).map((q: QuizQuestion) => ({
          ...q,
          id: undefined, // Remove ID so it creates new
          answers: (q.answers || []).map((a: QuizAnswer) => ({
            ...a,
            id: undefined // Remove ID so it creates new
          }))
        }))
      });
      quizModal.open();
    } catch (err: unknown) {
      alert(`Error cloning quiz: ${err instanceof Error ? err.message : String(err)}`);
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
        const hasCorrectAnswer = question.answers.some((a: QuizAnswer) => a.is_correct);
        if (!hasCorrectAnswer) {
          alert(`Question ${i + 1} must have at least one correct answer`);
          return;
        }

        // Check all answers have text
        const emptyAnswers = question.answers.filter((a: QuizAnswer) => !a.answer_text || a.answer_text.trim() === '');
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

      let savedQuiz: Quiz;
      if (editingQuiz) {
        savedQuiz = await quizAPI.updateQuiz(editingQuiz.id, data) as Quiz;

        // Handle questions and answers for existing quiz
        await syncQuestionsAndAnswers(editingQuiz.id);
      } else {
        savedQuiz = await quizAPI.createQuiz(data) as Quiz;

        // Add questions and answers for new quiz
        await syncQuestionsAndAnswers(savedQuiz.id);
      }

      quizModal.close();
      fetchQuizzes();
    } catch (err: unknown) {
      alert(`Error saving quiz: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const syncQuestionsAndAnswers = async (quizId: string) => {
    try {
      // Build maps for comparison
      const originalQuestions = editingQuiz?.questions || [];
      const originalQMap = new Map(originalQuestions.map((q: QuizQuestion) => [q.id, q]));
      const currentQIds = new Set(
        quizForm.questions.filter((q: QuizQuestion) => q.id).map((q: QuizQuestion) => q.id)
      );

      // STEP 1: DELETE questions that were removed (exist in original but not in current)
      for (const originalQ of originalQuestions) {
        if (originalQ.id && !currentQIds.has(originalQ.id)) {
          await quizAPI.deleteQuestion(originalQ.id);
        }
      }

      // STEP 2: UPDATE or CREATE questions
      for (let i = 0; i < quizForm.questions.length; i++) {
        const question = quizForm.questions[i];

        // Prepare answers array
        const answers = (question.answers || []).map((answer: QuizAnswer, j: number) => ({
          answer_text: answer.answer_text,
          is_correct: answer.is_correct,
          ...(answer.explanation && { explanation: answer.explanation }),
          order_index: j + 1
        }));

        const questionData = {
          question_text: question.question_text,
          points: typeof question.points === 'string' ? parseInt(question.points) : question.points,
          order_index: i + 1,
          answers: answers
        };

        if (question.id && originalQMap.has(question.id)) {
          // UPDATE existing question (has ID and existed in original)
          await quizAPI.updateQuestion(question.id, questionData);
        } else {
          // CREATE new question (no ID or new question)
          await quizAPI.addQuestion(quizId, questionData);
        }
      }
    } catch (err: unknown) {
      console.error('Error syncing questions and answers:', err);
      throw err;
    }
  };

  const handleDeleteQuiz = async () => {
    await deleteConfirmation.confirmDelete(async (quiz) => {
      try {
        await quizAPI.deleteQuiz(quiz.id);
        fetchQuizzes();
      } catch (err: unknown) {
        alert(`Error deleting quiz: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    });
  };

  const handleToggleActive = async (quiz: Quiz) => {
    // Optimistically update local state
    setQuizzes(prevQuizzes =>
      prevQuizzes.map((q: Quiz) =>
        q.id === quiz.id ? { ...q, is_active: !q.is_active } : q
      )
    );

    try {
      await quizAPI.updateQuiz(quiz.id, { is_active: !quiz.is_active });
    } catch (err: unknown) {
      // Revert on error
      setQuizzes(prevQuizzes =>
        prevQuizzes.map((q: Quiz) =>
          q.id === quiz.id ? { ...q, is_active: !q.is_active } : q
        )
      );
      alert(`Error updating quiz: ${err instanceof Error ? err.message : String(err)}`);
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
      const fullQuiz = await quizAPI.getQuiz(editingQuiz.id) as Quiz;
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

  const toggleQuestionExpanded = (index: number) => {
    if (expandedQuestions.includes(index)) {
      setExpandedQuestions(expandedQuestions.filter((i: number) => i !== index));
    } else {
      setExpandedQuestions([...expandedQuestions, index]);
    }
  };

  const handleUpdateQuestion = (index: number, field: string, value: string | number | boolean) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = quizForm.questions.filter((_: QuizQuestion, i: number) => i !== index);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleAddAnswer = (questionIndex: number) => {
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

  const handleUpdateAnswer = (questionIndex: number, answerIndex: number, field: string, value: string | boolean) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex].answers[answerIndex] = {
      ...updatedQuestions[questionIndex].answers[answerIndex],
      [field]: value
    };
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleDeleteAnswer = (questionIndex: number, answerIndex: number) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex].answers = updatedQuestions[questionIndex].answers.filter(
      (_: QuizAnswer, i: number) => i !== answerIndex
    );
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  // Bulk delete selection handlers
  const handleSelectAllQuizzes = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuizIds(quizzes.map((quiz: Quiz) => quiz.id));
    } else {
      setSelectedQuizIds([]);
    }
  };

  const handleSelectQuiz = (quizId: string) => {
    if (selectedQuizIds.includes(quizId)) {
      setSelectedQuizIds(selectedQuizIds.filter((id: string) => id !== quizId));
    } else {
      setSelectedQuizIds([...selectedQuizIds, quizId]);
    }
  };

  const handleClearQuizSelection = () => {
    setSelectedQuizIds([]);
  };

  const handleOpenBulkDelete = () => {
    setBulkDeleteResult(null);
    bulkDeleteModal.open();
  };

  const handleBulkDeleteQuizzes = async () => {
    if (selectedQuizIds.length > 100) {
      alert('Maximum 100 quizzes can be deleted at once');
      return;
    }

    try {
      const result = await quizAPI.bulkDeleteQuizzes({
        quiz_ids: selectedQuizIds
      }) as BulkDeleteResult;
      setBulkDeleteResult(result);

      // If all successful, clear selection and close modal after delay
      if (result.failed === 0) {
        setTimeout(() => {
          bulkDeleteModal.close();
          setSelectedQuizIds([]);
          fetchQuizzes();
        }, 2000);
      } else {
        // If some failed, just refresh the list
        fetchQuizzes();
      }
    } catch (err: unknown) {
      alert(`Bulk delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const getSelectedQuizzes = () => {
    return quizzes.filter((quiz: Quiz) => selectedQuizIds.includes(quiz.id));
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Quizzes Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage quizzes, questions, and answers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <QuizStatsCards darkMode={darkMode} total={total} quizzes={quizzes} />

        {/* Filters and Actions */}
        <QuizFilters
          darkMode={darkMode}
          search={search}
          setSearch={setSearch}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          setPage={setPage}
          quizTags={quizTags}
          onCreateQuiz={handleCreateQuiz}
          showBulkQuizUpload={showBulkQuizUpload}
          onToggleBulkQuizUpload={() => setShowBulkQuizUpload(!showBulkQuizUpload)}
        />
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
        <QuizTable
          darkMode={darkMode}
          loading={loading}
          error={error}
          quizzes={quizzes}
          selectedQuizIds={selectedQuizIds}
          page={page}
          perPage={perPage}
          totalPages={totalPages}
          total={total}
          setPage={setPage}
          setPerPage={setPerPage}
          onSelectAllQuizzes={handleSelectAllQuizzes}
          onSelectQuiz={handleSelectQuiz}
          onClearQuizSelection={handleClearQuizSelection}
          onOpenBulkDelete={handleOpenBulkDelete}
          onEditQuiz={handleEditQuiz}
          onCloneQuiz={handleCloneQuiz}
          onRequestDelete={deleteConfirmation.requestDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Create/Edit Quiz Modal */}
      {quizModal.isOpen && (
        <QuizFormModal
          darkMode={darkMode}
          editingQuiz={editingQuiz}
          quizForm={quizForm}
          setQuizForm={setQuizForm}
          quizTags={quizTags}
          expandedQuestions={expandedQuestions}
          showBulkUpload={showBulkUpload}
          setShowBulkUpload={setShowBulkUpload}
          onSaveQuiz={handleSaveQuiz}
          onClose={() => quizModal.close()}
          onAddQuestion={handleAddQuestion}
          onToggleQuestionExpanded={toggleQuestionExpanded}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onAddAnswer={handleAddAnswer}
          onUpdateAnswer={handleUpdateAnswer}
          onDeleteAnswer={handleDeleteAnswer}
          onBulkUploadSuccess={handleBulkUploadSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.item && (
        <DeleteQuizModal
          darkMode={darkMode}
          item={deleteConfirmation.item}
          loading={deleteConfirmation.loading}
          onConfirmDelete={handleDeleteQuiz}
          onCancelDelete={deleteConfirmation.cancelDelete}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModal.isOpen && (
        <BulkDeleteModal
          darkMode={darkMode}
          selectedQuizIds={selectedQuizIds}
          selectedQuizzes={getSelectedQuizzes()}
          bulkDeleteResult={bulkDeleteResult}
          onBulkDelete={handleBulkDeleteQuizzes}
          onClose={() => bulkDeleteModal.close()}
          onCloseWithResult={() => {
            bulkDeleteModal.close();
            setBulkDeleteResult(null);
            if (bulkDeleteResult?.failed === 0) {
              setSelectedQuizIds([]);
            }
          }}
        />
      )}
    </div>
  );
}
