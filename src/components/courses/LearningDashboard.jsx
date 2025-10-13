import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import coursesAPI from '../../services/coursesAPI';

const ProgressCourseCard = ({ course, enrollment }) => {
  const navigate = useNavigate();
  const progressPercentage = enrollment?.completion_percentage || 0;
  const difficultyColors = coursesAPI.getDifficultyColor(course.difficulty_level);
  const statusColors = coursesAPI.getStatusColor(enrollment?.status || 'not_started');

  const handleContinue = () => {
    navigate(`/freelancer-academy/courses/${course.id}`);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {course.thumbnail_url && (
        <div className="aspect-video bg-gray-200 relative">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          {progressPercentage > 0 && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black bg-opacity-50 rounded-full p-1">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors.bg} ${difficultyColors.text} ${difficultyColors.border} border`}>
            {course.difficulty_level}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
            {getStatusText(enrollment?.status)}
          </span>
          {enrollment?.last_accessed_at && (
            <span className="text-xs text-gray-500">
              Last accessed {new Date(enrollment.last_accessed_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {course.instructor_name && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {course.instructor_name}
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {course.total_modules} modules
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {progressPercentage > 0 ? 'Continue Learning' : 'Start Course'}
        </button>
      </div>
    </div>
  );
};

const RecommendedCourseCard = ({ course, onEnroll }) => {
  const navigate = useNavigate();
  const difficultyColors = coursesAPI.getDifficultyColor(course.difficulty_level);

  const handleEnroll = async () => {
    if (!course.can_access) {
      // TODO: Show upgrade plan modal
      return;
    }

    try {
      await coursesAPI.enrollCourse(course.id);
      onEnroll(course.id);
      navigate(`/freelancer-academy/courses/${course.id}`);
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {course.thumbnail_url && (
        <div className="aspect-video bg-gray-200">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors.bg} ${difficultyColors.text} ${difficultyColors.border} border`}>
            {course.difficulty_level}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.short_description || course.description}</p>

        <div className="space-y-2 mb-4">
          {course.instructor_name && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {course.instructor_name}
            </div>
          )}

          {course.estimated_duration_hours && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {coursesAPI.formatDuration(course.estimated_duration_hours)}
            </div>
          )}
        </div>

        {course.can_access ? (
          <button
            onClick={handleEnroll}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Enroll Now
          </button>
        ) : (
          <button className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
            Upgrade Required
          </button>
        )}
      </div>
    </div>
  );
};

const LearningDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLearningPath = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await coursesAPI.getMyEnrollments();
      // TODO: Replace with actual my-learning endpoint when available
      setLearningPath({
        enrolled_courses: response.courses || [],
        recommended_courses: [],
        in_progress_courses: response.courses?.filter(course =>
          course.enrollment?.status === 'in_progress'
        ) || [],
        completed_courses: response.courses?.filter(course =>
          course.enrollment?.status === 'completed'
        ) || []
      });
    } catch (error) {
      console.error('Failed to fetch learning path:', error);
      setError('Failed to load your learning progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningPath();
  }, [user]);

  const handleEnrollSuccess = () => {
    fetchLearningPath(); // Refresh data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="space-y-8">
              {[...Array(3)].map((_, sectionIndex) => (
                <div key={sectionIndex}>
                  <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, cardIndex) => (
                      <div key={cardIndex} className="bg-white rounded-lg shadow-md p-6">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                        <div className="h-20 bg-gray-300 rounded mb-4"></div>
                        <div className="h-8 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Learning Progress</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLearningPath}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasInProgressCourses = learningPath?.in_progress_courses?.length > 0;
  const hasCompletedCourses = learningPath?.completed_courses?.length > 0;
  const hasRecommendedCourses = learningPath?.recommended_courses?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning</h1>
              <p className="text-gray-600">Track your progress and continue your learning journey</p>
            </div>
            <button
              onClick={() => navigate('/freelancer-academy/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Learning Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{learningPath?.enrolled_courses?.length || 0}</p>
                <p className="text-sm text-gray-600">Enrolled Courses</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{learningPath?.completed_courses?.length || 0}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{learningPath?.in_progress_courses?.length || 0}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Learning Section */}
        {hasInProgressCourses && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningPath.in_progress_courses.map((course) => (
                <ProgressCourseCard
                  key={course.id}
                  course={course}
                  enrollment={course.enrollment}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommended Courses Section */}
        {hasRecommendedCourses && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningPath.recommended_courses.map((course) => (
                <RecommendedCourseCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnrollSuccess}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Courses Section */}
        {hasCompletedCourses && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningPath.completed_courses.map((course) => (
                <ProgressCourseCard
                  key={course.id}
                  course={course}
                  enrollment={course.enrollment}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!hasInProgressCourses && !hasCompletedCourses && !hasRecommendedCourses && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Start Your Learning Journey</h3>
            <p className="text-gray-600 mb-6">You haven't enrolled in any courses yet. Explore our course library to get started.</p>
            <button
              onClick={() => navigate('/freelancer-academy/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-base font-medium transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningDashboard;