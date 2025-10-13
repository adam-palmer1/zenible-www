import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import coursesAPI from '../../services/coursesAPI';
import NewSidebar from '../sidebar/NewSidebar';
import CourseModulesSidebar from './CourseModulesSidebar';
import VideoPlayer from './VideoPlayer';
import LessonTranscript from './LessonTranscript';
import KeyTakeaways from './KeyTakeaways';
import ExpertChat from './ExpertChat';

const CoursesComponent = ({ courseCategory = null }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = usePreferences();

  const [courseData, setCourseData] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transform backend module/resource structure to match existing component interfaces
  const transformModuleData = (modules, moduleProgress = [], resourceProgress = []) => {
    return modules.map(module => {
      const moduleProgressData = moduleProgress.find(mp => mp.module_id === module.id);
      const moduleResources = module.resources || [];

      // Transform resources to lessons format
      const lessons = moduleResources.map(resource => {
        const resourceProgressData = resourceProgress.find(rp => rp.resource_id === resource.id);
        return {
          id: resource.id,
          title: resource.title,
          duration: formatDuration(resource.duration_minutes),
          completed: resourceProgressData?.status === 'completed',
          resource_type: resource.resource_type,
          content_url: resource.content_url,
          content_text: resource.content_text,
          progress_percentage: resourceProgressData?.completion_percentage || 0,
          last_position_seconds: resourceProgressData?.last_position_seconds || 0
        };
      });

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        progress: moduleProgressData?.completion_percentage || 0,
        lessons: lessons,
        order_index: module.order_index
      };
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0:00";
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchCourseData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let targetCourseId = courseId;

      // If no courseId but we have a category, find the first course in that category
      if (!targetCourseId && courseCategory) {
        const coursesResponse = await coursesAPI.listCourses({
          category: courseCategory,
          per_page: 1
        });

        if (coursesResponse.courses && coursesResponse.courses.length > 0) {
          targetCourseId = coursesResponse.courses[0].id;
          // Navigate to the course URL to update the URL
          navigate(`/freelancer-academy/courses/${targetCourseId}`, { replace: true });
        } else {
          throw new Error(`No courses found in category: ${courseCategory}`);
        }
      }

      if (!targetCourseId) {
        throw new Error('No course ID provided');
      }

      // Fetch course details with progress
      const response = await coursesAPI.getCourse(targetCourseId);

      const transformedModules = transformModuleData(
        response.course.modules || [],
        response.module_progress || [],
        response.resource_progress || []
      );

      setCourseData({
        ...response.course,
        modules: transformedModules
      });
      setCourseProgress(response.course_progress);

      // Auto-select first module and resource
      if (transformedModules.length > 0) {
        const firstModule = transformedModules[0];
        setSelectedModule(firstModule);

        // Select next resource to continue from, or first resource
        if (response.next_resource) {
          const nextResource = findResourceInModules(transformedModules, response.next_resource.id);
          if (nextResource) {
            setSelectedResource(nextResource);
            setVideoProgress(nextResource.last_position_seconds || 0);
          }
        } else if (firstModule.lessons.length > 0) {
          setSelectedResource(firstModule.lessons[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error);
      setError(error.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const findResourceInModules = (modules, resourceId) => {
    for (const module of modules) {
      const resource = module.lessons.find(lesson => lesson.id === resourceId);
      if (resource) return resource;
    }
    return null;
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId, courseCategory, user]);

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    if (module.lessons.length > 0) {
      setSelectedResource(module.lessons[0]);
    }
  };

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
    setVideoProgress(resource.last_position_seconds || 0);
    setIsVideoPlaying(false);
  };

  const updateResourceProgress = async (progressPercentage, lastPositionSeconds = null) => {
    if (!selectedResource || !courseData) return;

    try {
      const params = new URLSearchParams({
        completion_percentage: Math.round(progressPercentage).toString(),
        ...(lastPositionSeconds !== null && { last_position_seconds: Math.round(lastPositionSeconds).toString() })
      });

      // Use the correct API endpoint structure from the backend documentation
      const response = await fetch(
        `/api/v1/courses/${courseData.id}/resources/${selectedResource.id}/progress?${params}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Update local state to reflect progress
      setSelectedResource(prev => ({
        ...prev,
        progress_percentage: progressPercentage,
        ...(lastPositionSeconds !== null && { last_position_seconds: lastPositionSeconds }),
        completed: progressPercentage >= 100
      }));

      // If resource is completed, refresh course data to update module progress
      if (progressPercentage >= 100) {
        setTimeout(() => {
          fetchCourseData();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleProgressChange = (newProgress) => {
    setVideoProgress(newProgress);

    // Calculate progress percentage based on video duration
    if (selectedResource && selectedResource.resource_type === 'video') {
      const duration = parseDuration(selectedResource.duration);
      if (duration > 0) {
        const progressPercentage = (newProgress / duration) * 100;

        // Update progress every 10% or when video is completed
        if (progressPercentage >= 100 || progressPercentage % 10 < 1) {
          updateResourceProgress(progressPercentage, newProgress);
        }
      }
    }
  };

  const parseDuration = (durationStr) => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
  };

  if (loading) {
    return (
      <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        <NewSidebar />
        <div className="flex-1 flex flex-col min-w-0 ml-[280px]">
          <div className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 ${
            darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-gray-200'
          }`}>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-48"></div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading course...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        <NewSidebar />
        <div className="flex-1 flex flex-col min-w-0 ml-[280px]">
          <div className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 ${
            darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-gray-200'
          }`}>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Course Error
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Failed to Load Course</h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
              <button
                onClick={fetchCourseData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        <NewSidebar />
        <div className="flex-1 flex flex-col min-w-0 ml-[280px]">
          <div className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 ${
            darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-gray-200'
          }`}>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Course
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>No course data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Standard App Navigation Sidebar */}
      <NewSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-[280px]">
        {/* Header */}
        <div className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 ${
          darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => navigate('/freelancer-academy/my-learning')}
                className={`hover:underline ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                My Learning
              </button>
              <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>/</span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {courseData.title}
              </span>
            </nav>
          </div>

          {/* Course Progress Badge */}
          {courseProgress && (
            <div className="flex items-center space-x-2">
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {courseProgress.completion_percentage || 0}% Complete
              </div>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${courseProgress.completion_percentage || 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Course Modules */}
          <div className={`w-80 border-r overflow-y-auto ${
            darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-gray-200'
          }`}>
            <CourseModulesSidebar
              modules={courseData.modules}
              selectedModule={selectedModule}
              selectedLesson={selectedResource}
              onModuleSelect={handleModuleSelect}
              onLessonSelect={handleResourceSelect}
              courseTitle={courseData.title}
              courseProgress={courseProgress}
              darkMode={darkMode}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Video Player Section */}
            <div className="bg-black" style={{ height: '400px' }}>
              <VideoPlayer
                lesson={selectedResource}
                isPlaying={isVideoPlaying}
                onPlayStateChange={setIsVideoPlaying}
                onProgressChange={handleProgressChange}
                courseId={courseData.id}
              />
            </div>

            {/* Lesson Content */}
            <div className="flex-1 overflow-y-auto">
              <LessonTranscript
                lesson={selectedResource}
                currentTime={videoProgress}
                courseId={courseData.id}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className={`w-80 border-l flex flex-col ${
            darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-gray-200'
          }`}>
            {/* Key Takeaways Section */}
            <div className="flex-1 overflow-y-auto">
              <KeyTakeaways lesson={selectedResource} />
            </div>

            {/* Expert Chat Section */}
            <div className={`h-96 border-t ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
              <ExpertChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesComponent;