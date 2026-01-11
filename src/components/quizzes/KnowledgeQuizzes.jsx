import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewSidebar from '../sidebar/NewSidebar';
import QuizCard from './QuizCard';
import QuizPreviewModal from './QuizPreviewModal';
import quizAPI from '../../services/quizAPI';
import bookIcon from '../../assets/icons/quizzes/book-icon.svg';

// Default icon for quizzes
const DefaultQuizIcon = () => (
  <img src={bookIcon} alt="" className="w-full h-full" />
);

export default function KnowledgeQuizzes() {
  const navigate = useNavigate();
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyQuizLimit, setDailyQuizLimit] = useState(null);
  const [quizzesAttemptedToday, setQuizzesAttemptedToday] = useState(null);
  const [quizzesRemainingToday, setQuizzesRemainingToday] = useState(null);
  const [showNoAttemptsModal, setShowNoAttemptsModal] = useState(false);

  const QUIZ_COUNT = 16;

  useEffect(() => {
    fetchRandomQuizzes();
  }, []);

  const fetchRandomQuizzes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await quizAPI.getRandomQuiz(null, QUIZ_COUNT);
      // API returns { quizzes: [...], count: N, requested: M } when quiz_count is specified
      if (data.quizzes && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes);
      } else if (Array.isArray(data)) {
        setQuizzes(data);
      } else {
        // Single quiz returned
        setQuizzes([data]);
      }

      // Extract daily quiz limit info
      if (data.daily_quiz_limit !== undefined) {
        setDailyQuizLimit(data.daily_quiz_limit);
      }
      if (data.quizzes_attempted_today !== undefined) {
        setQuizzesAttemptedToday(data.quizzes_attempted_today);
      }
      if (data.quizzes_remaining_today !== undefined) {
        setQuizzesRemainingToday(data.quizzes_remaining_today);
      }
    } catch (err) {
      console.error('[KnowledgeQuizzes] Error fetching random quizzes:', err);
      if (err.message.includes('404')) {
        setError('No quizzes available at the moment. Please check back later!');
      } else if (err.message.includes('403')) {
        setError('You need a subscription to access quizzes.');
      } else {
        setError('Failed to load quizzes. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuizClick = (quiz) => {
    // Check if user has no remaining attempts
    if (quizzesRemainingToday === 0) {
      setShowNoAttemptsModal(true);
      return;
    }

    // Check if quiz is available before showing preview
    if (quiz.is_available === false) {
      setError('This quiz requires a subscription upgrade. Please upgrade your plan to access it.');
      return;
    }
    setPreviewQuiz(quiz);
  };

  const handleStartQuiz = async () => {
    if (!previewQuiz) return;

    try {
      setLoading(true);
      const attemptData = await quizAPI.startQuizAttempt(previewQuiz.id);
      // Navigate to quiz attempt page
      navigate(`/freelancer-academy/quizzes/${attemptData.attempt_id}/take`, {
        state: { attemptData }
      });
    } catch (err) {
      console.error('[KnowledgeQuizzes] Error starting quiz:', err);
      setError('Failed to start quiz. Please try again.');
      setLoading(false);
    }
  };

  const handleTryAnother = () => {
    // Fetch a new set of random quizzes
    fetchRandomQuizzes();
    setPreviewQuiz(null);
  };

  const handleCloseModal = () => {
    setPreviewQuiz(null);
    setError(null);
  };

  return (
    <div className="flex h-screen bg-white">
      <NewSidebar />

      <div className="flex-1 overflow-auto transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        {/* Top Bar */}
        <div className="border-b border-neutral-200 flex items-center justify-between px-[24px] sticky top-0 bg-white z-10 py-[16px]">
          <div className="flex flex-col gap-[4px]">
            <h1 className="font-['Inter'] font-semibold text-[24px] text-zinc-950 leading-[32px]">
              Knowledge Quizzes
            </h1>
            {quizzesRemainingToday !== null && dailyQuizLimit !== null && (
              <p className="font-['Inter'] font-normal text-[14px] text-zinc-400">
                {quizzesRemainingToday} out of {dailyQuizLimit} quiz attempts remaining today
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/freelancer-academy/quizzes/history')}
            className="bg-white border border-neutral-200 text-zinc-950 px-[16px] py-[8px] rounded-[8px] font-['Inter'] font-medium text-[14px] hover:bg-gray-50 transition-colors"
          >
            Quiz History
          </button>
        </div>

        {/* Content Section */}
        <div className="p-[24px]">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="font-['Inter'] font-normal text-[14px] text-red-600">
                  {error}
                </p>
                {error.includes('subscription') && (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="bg-[#8e51ff] text-white px-4 py-2 rounded-lg text-[14px] font-['Inter'] font-medium hover:bg-violet-600 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="font-['Inter'] font-normal text-[16px] text-zinc-500">
                Loading quizzes...
              </p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
              <p className="font-['Inter'] font-normal text-[16px] text-zinc-500 mb-4">
                No quizzes available at the moment.
              </p>
              <button
                onClick={fetchRandomQuizzes}
                className="bg-[#8e51ff] text-white px-6 py-2 rounded-lg hover:bg-violet-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Quiz Cards Grid - 4 columns */
            <div className="grid grid-cols-4 gap-[16px]">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  icon={<DefaultQuizIcon />}
                  title={quiz.title}
                  description={quiz.description || 'Test your knowledge'}
                  questionCount={quiz.total_questions}
                  isAttempted={quiz.is_attempted || false}
                  isAvailable={quiz.is_available !== false && quizzesRemainingToday !== 0}
                  tags={quiz.tags || []}
                  onClick={() => handleQuizClick(quiz)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Preview Modal */}
      {previewQuiz && (
        <QuizPreviewModal
          quiz={previewQuiz}
          onStartQuiz={handleStartQuiz}
          onTryAnother={handleTryAnother}
          onClose={handleCloseModal}
        />
      )}

      {/* No Attempts Remaining Modal */}
      {showNoAttemptsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowNoAttemptsModal(false)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-[12px] max-w-[500px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-[24px] pb-[16px] border-b border-neutral-200">
              <h2 className="font-['Inter'] font-semibold text-[20px] text-zinc-950">
                No Quiz Attempts Remaining
              </h2>
            </div>

            {/* Content */}
            <div className="p-[24px]">
              <p className="font-['Inter'] font-normal text-[16px] text-zinc-600 leading-[24px]">
                No more quiz attempts remaining today. Come back again tomorrow or upgrade your plan to continue immediately.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-[16px] p-[24px] pt-[16px]">
              <button
                onClick={() => setShowNoAttemptsModal(false)}
                className="flex-1 border border-neutral-200 bg-white text-zinc-950 py-[12px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="flex-1 bg-[#8e51ff] text-white py-[12px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-violet-600 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
