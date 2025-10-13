import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewSidebar from '../sidebar/NewSidebar';
import quizAPI from '../../services/quizAPI';

export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PER_PAGE = 10;

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getAttemptHistory(page, PER_PAGE);
      setAttempts(data.attempts || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('[QuizHistoryPage] Error fetching history:', err);
      setError('Failed to load quiz history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✓' };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: '⚠️' };
      case 'abandoned':
        return { label: 'Abandoned', color: 'bg-gray-100 text-gray-800', icon: '⊗' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: '' };
    }
  };

  const handleViewResults = (attemptId) => {
    navigate(`/freelancer-academy/quizzes/${attemptId}/results`);
  };

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  const hasMore = attempts.length < total;

  if (error) {
    return (
      <div className="flex h-screen bg-white">
        <NewSidebar />
        <div className="flex-1 ml-[280px] flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-[500px]">
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

  return (
    <div className="flex h-screen bg-white">
      <NewSidebar />

      <div className="flex-1 ml-[280px] overflow-auto">
        {/* Top Bar */}
        <div className="h-[64px] border-b border-neutral-200 flex items-center justify-between px-[24px]">
          <h1 className="font-['Inter'] font-semibold text-[24px] text-zinc-950 leading-[32px]">
            My Quiz History
          </h1>
          <button
            onClick={() => navigate('/freelancer-academy/quizzes')}
            className="bg-[#8e51ff] text-white px-[16px] py-[8px] rounded-[8px] font-['Inter'] font-medium text-[14px] hover:bg-violet-600 transition-colors"
          >
            Take New Quiz
          </button>
        </div>

        {/* Content */}
        <div className="max-w-[1000px] mx-auto px-[24px] py-[32px]">
          {loading && attempts.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="font-['Inter'] font-normal text-[16px] text-zinc-500">
                Loading history...
              </p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
              <p className="font-['Inter'] font-normal text-[16px] text-zinc-500 mb-4">
                No quiz attempts yet. Start taking quizzes to see your history!
              </p>
              <button
                onClick={() => navigate('/freelancer-academy/quizzes')}
                className="bg-[#8e51ff] text-white px-6 py-2 rounded-lg hover:bg-violet-600 transition-colors"
              >
                Browse Quizzes
              </button>
            </div>
          ) : (
            <>
              {/* Attempt Cards */}
              <div className="space-y-[16px]">
                {attempts.map((attempt) => {
                  const statusBadge = getStatusBadge(attempt.status);
                  const percentage = attempt.total_points > 0 ? (attempt.score / attempt.total_points) * 100 : 0;

                  return (
                    <div
                      key={attempt.id}
                      className="bg-white border border-neutral-200 rounded-[12px] p-[24px] hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-[16px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-[12px] mb-[8px]">
                            <h3 className="font-['Inter'] font-semibold text-[18px] text-zinc-950">
                              Quiz Attempt
                            </h3>
                            <span
                              className={`px-[12px] py-[4px] rounded-[6px] text-[12px] font-['Inter'] font-medium ${statusBadge.color}`}
                            >
                              {statusBadge.icon} {statusBadge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-[16px] text-[14px] text-zinc-500">
                            <span>
                              Started: {new Date(attempt.started_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            {attempt.completed_at && (
                              <span>
                                • Completed: {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {attempt.status === 'completed' && (
                          <button
                            onClick={() => handleViewResults(attempt.id)}
                            className="border border-[#8e51ff] text-[#8e51ff] px-[16px] py-[8px] rounded-[8px] font-['Inter'] font-medium text-[14px] hover:bg-violet-50 transition-colors"
                          >
                            View Results
                          </button>
                        )}
                      </div>

                      {/* Score Display (if completed) */}
                      {attempt.status === 'completed' && (
                        <div className="bg-neutral-50 border border-neutral-200 rounded-[8px] p-[16px]">
                          <div className="flex items-center justify-between mb-[8px]">
                            <span className="font-['Inter'] font-medium text-[14px] text-zinc-700">
                              Score: {attempt.score}/{attempt.total_points}
                            </span>
                            <span className="font-['Inter'] font-semibold text-[16px] text-[#8e51ff]">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-[8px] overflow-hidden">
                            <div
                              className="bg-[#8e51ff] h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* In Progress Note */}
                      {attempt.status === 'in_progress' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-[12px]">
                          <p className="font-['Inter'] font-normal text-[14px] text-blue-700">
                            This quiz is still in progress.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-[32px]">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="bg-white border border-neutral-200 text-zinc-950 px-[24px] py-[12px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                  <p className="font-['Inter'] font-normal text-[14px] text-zinc-500 mt-[12px]">
                    Showing {attempts.length} of {total}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
