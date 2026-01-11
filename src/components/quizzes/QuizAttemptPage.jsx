import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import NewSidebar from '../sidebar/NewSidebar';
import QuizHeader from './QuizHeader';
import QuestionCard from './QuestionCard';
import AnswerFeedback from './AnswerFeedback';
import QuitConfirmationModal from './QuitConfirmationModal';
import quizAPI from '../../services/quizAPI';

export default function QuizAttemptPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState(location.state?.attemptData || null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQuitModal, setShowQuitModal] = useState(false);

  useEffect(() => {
    // If attemptData was passed via location state, use it
    if (attemptData) {
      setCurrentQuestion(attemptData.first_question);
      setTotalQuestions(attemptData.total_questions);
      setTotalPoints(attemptData.first_question?.points || 0);
      setExpiresAt(attemptData.expires_at);
      setQuestionNumber(1);
    } else {
      // Otherwise, we might need to fetch the attempt (shouldn't happen in normal flow)
      setError('No quiz attempt found. Please start a quiz from the quiz selection page.');
    }
  }, [attemptData]);

  const handleAnswerSelect = (answerId) => {
    if (currentQuestion.question_type === 'single_select') {
      setSelectedAnswers([answerId]);
    } else {
      // Multi-select
      if (selectedAnswers.includes(answerId)) {
        setSelectedAnswers(selectedAnswers.filter((id) => id !== answerId));
      } else {
        setSelectedAnswers([...selectedAnswers, answerId]);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) return;

    try {
      setLoading(true);
      const response = await quizAPI.submitAnswer(attemptId, {
        selected_answer_ids: selectedAnswers,
      });

      setFeedback(response);

      // Update score
      if (response.is_correct) {
        setScore(score + response.points_earned);
      }
    } catch (err) {
      console.error('[QuizAttemptPage] Error submitting answer:', err);
      if (err.message.includes('400')) {
        setError('Quiz has expired or this question has already been answered.');
      } else {
        setError('Failed to submit answer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!feedback) return;

    if (feedback.quiz_completed) {
      // Navigate to results page
      navigate(`/freelancer-academy/quizzes/${attemptId}/results`);
    } else {
      // Move to next question
      setCurrentQuestion(feedback.next_question);
      setTotalPoints(totalPoints + (feedback.next_question?.points || 0));
      setSelectedAnswers([]);
      setFeedback(null);
      setQuestionNumber(questionNumber + 1);
    }
  };

  const handleQuit = () => {
    // Show confirmation modal
    setShowQuitModal(true);
  };

  const handleConfirmQuit = () => {
    // Navigate back to quizzes page
    navigate('/freelancer-academy/quizzes');
  };

  const handleCancelQuit = () => {
    // Close modal
    setShowQuitModal(false);
  };

  if (error) {
    return (
      <div className="flex h-screen bg-white">
        <NewSidebar />
        <div className="flex-1 flex items-center justify-center transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-[500px]">
            <h2 className="font-['Inter'] font-semibold text-[20px] text-red-800 mb-2">
              Error
            </h2>
            <p className="font-['Inter'] font-normal text-[16px] text-red-600">
              {error}
            </p>
            <button
              onClick={() => navigate('/freelancer-academy/quizzes')}
              className="mt-4 bg-[#8e51ff] text-white px-6 py-2 rounded-lg hover:bg-violet-600 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen bg-white">
        <NewSidebar />
        <div className="flex-1 flex items-center justify-center transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
          <p className="font-['Inter'] font-normal text-[16px] text-zinc-500">
            Loading quiz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <NewSidebar />

      <div className="flex-1 overflow-auto transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        <QuizHeader
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          score={score}
          totalPoints={totalPoints}
          expiresAt={expiresAt}
        />

        <div className="py-[32px]">
          {!feedback ? (
            <QuestionCard
              question={currentQuestion}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
              onSubmit={handleSubmit}
              canSubmit={selectedAnswers.length > 0 && !loading}
            />
          ) : (
            <AnswerFeedback
              isCorrect={feedback.is_correct}
              pointsEarned={feedback.points_earned}
              correctAnswers={feedback.correct_answers}
              onNext={handleNext}
              onQuit={handleQuit}
            />
          )}
        </div>
      </div>

      {/* Quit Confirmation Modal */}
      {showQuitModal && (
        <QuitConfirmationModal
          onConfirm={handleConfirmQuit}
          onCancel={handleCancelQuit}
        />
      )}
    </div>
  );
}
