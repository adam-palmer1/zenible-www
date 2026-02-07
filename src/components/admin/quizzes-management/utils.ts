import { QuizAnswer, QuizQuestion } from './types';

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};

export const calculateTotalPoints = (questions: QuizQuestion[]) => {
  return questions.reduce((sum: number, q: QuizQuestion) => sum + (typeof q.points === 'string' ? parseInt(q.points) : q.points) || 0, 0);
};

export const determineQuestionType = (answers: QuizAnswer[]) => {
  const correctCount = (answers || []).filter((a: QuizAnswer) => a.is_correct).length;
  return correctCount >= 2 ? 'multi_select' : 'single_select';
};

export const getQuestionTypeBadge = (questionType: string) => {
  if (questionType === 'single_select') {
    return 'bg-blue-50 text-blue-700';
  } else if (questionType === 'multi_select') {
    return 'bg-indigo-50 text-indigo-700';
  }
  return 'bg-gray-100 text-gray-800';
};
