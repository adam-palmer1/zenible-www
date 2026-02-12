import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import quizAPI from '../../services/quizAPI';

export default function QuizResultsPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getQuizResult(attemptId as string);
      setResult(data);
    } catch (err: any) {
      console.error('[QuizResultsPage] Error fetching result:', err);
      setError('Failed to load quiz results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) {
      return { label: 'Excellent', color: 'text-[#8e51ff]', bgColor: 'bg-violet-50', barColor: 'bg-[#8e51ff]' };
    }
    if (percentage >= 70) {
      return { label: 'Good', color: 'text-[#8e51ff]', bgColor: 'bg-violet-50', barColor: 'bg-[#8e51ff]' };
    }
    if (percentage >= 50) {
      return { label: 'Fair', color: 'text-amber-600', bgColor: 'bg-amber-50', barColor: 'bg-amber-500' };
    }
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50', barColor: 'bg-red-500' };
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Results">
        <div className="flex-1 flex items-center justify-center">
          <p className="font-['Inter'] font-normal text-[16px] text-zinc-500">
            Loading results...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error || !result) {
    return (
      <AppLayout pageTitle="Results">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-[500px]">
            <p className="font-['Inter'] font-normal text-[16px] text-red-600">
              {error || 'No results found'}
            </p>
            <button
              onClick={() => navigate('/freelancer-academy/quizzes')}
              className="mt-4 bg-[#8e51ff] text-white px-6 py-2 rounded-lg hover:bg-violet-600 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const grade = getGrade(result.percentage);

  return (
    <AppLayout pageTitle="Results">
      {/* Top Bar */}
        <div className="h-[64px] border-b border-neutral-200 flex items-center px-[24px]">
          <h1 className="font-['Inter'] font-semibold text-[24px] text-zinc-950 leading-[32px]">
            Quiz Results
          </h1>
        </div>

        {/* Results Content */}
        <div className="max-w-[800px] mx-auto px-[24px] py-[48px]">
          {/* Header */}
          <div className="text-center mb-[48px]">
            <div className="text-[64px] mb-[16px]">🎉</div>
            <h2 className="font-['Inter'] font-bold text-[32px] text-zinc-950 mb-[8px]">
              Quiz Completed!
            </h2>
          </div>

          {/* Score Display */}
          <div className={`${grade.bgColor} border-2 ${
            grade.color === 'text-[#8e51ff]' ? 'border-[#8e51ff]' :
            grade.color === 'text-amber-600' ? 'border-amber-600' :
            'border-red-600'
          } rounded-[16px] p-[32px] mb-[32px]`}>
            <div className="text-center mb-[24px]">
              <div className="font-['Inter'] font-bold text-[48px] text-zinc-950 mb-[8px]">
                {result.score} / {result.total_points}
              </div>
              <div className={`font-['Inter'] font-semibold text-[32px] ${grade.color} mb-[8px]`}>
                {result.percentage.toFixed(1)}%
              </div>
              <div className={`inline-block px-[20px] py-[8px] rounded-[8px] ${grade.bgColor} ${grade.color} font-['Inter'] font-semibold text-[18px]`}>
                {grade.label}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-200 rounded-full h-[16px] overflow-hidden">
              <div
                className={`${grade.barColor} h-full transition-all duration-1000 ease-out`}
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px] mb-[48px]">
            <div className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-[24px]">
              <p className="font-['Inter'] font-normal text-[14px] text-zinc-500 mb-[8px]">
                Questions Correct
              </p>
              <p className="font-['Inter'] font-bold text-[28px] text-zinc-950">
                {result.questions_correct} / {result.questions_answered}
              </p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-[24px]">
              <p className="font-['Inter'] font-normal text-[14px] text-zinc-500 mb-[8px]">
                Completed
              </p>
              <p className="font-['Inter'] font-semibold text-[16px] text-zinc-950">
                {new Date(result.completed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-[16px]">
            <button
              onClick={() => navigate('/freelancer-academy/quizzes')}
              className="flex-1 bg-[#8e51ff] text-white py-[14px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-violet-600 transition-colors"
            >
              Take Another Quiz
            </button>
            <button
              onClick={() => navigate('/freelancer-academy/quizzes/history')}
              className="flex-1 border border-neutral-200 bg-white text-zinc-950 py-[14px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-gray-50 transition-colors"
            >
              View History
            </button>
          </div>
        </div>
    </AppLayout>
  );
}
