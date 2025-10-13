import React from 'react';

const CourseModulesSidebar = ({
  modules,
  selectedModule,
  selectedLesson,
  onModuleSelect,
  onLessonSelect,
  courseTitle,
  courseProgress,
  darkMode = false
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
        <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{courseTitle || 'Course Modules'}</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Progress through each module to complete the course</p>
        {courseProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Overall Progress</span>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{courseProgress.completion_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${courseProgress.completion_percentage || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module) => (
          <div key={module.id} className="border-b border-gray-100">
            {/* Module Header */}
            <div
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedModule?.id === module.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
              }`}
              onClick={() => onModuleSelect(module)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{module.title}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${module.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{module.progress}%</span>
                  </div>
                </div>
                <div className="ml-4">
                  {module.progress === 100 ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lessons List - Show when module is selected */}
            {selectedModule?.id === module.id && (
              <div className="bg-gray-50">
                {module.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-l-4 ${
                      selectedLesson?.id === lesson.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent'
                    }`}
                    onClick={() => onLessonSelect(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {lesson.completed ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs text-gray-500">{index + 1}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            selectedLesson?.id === lesson.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0z"/>
                              <path d="M8 3.5a.5.5 0 0 1 .5.5v4l3 1.5a.5.5 0 0 1-.5.866l-3.5-1.75A.5.5 0 0 1 7 8V4a.5.5 0 0 1 1-.5z"/>
                            </svg>
                            <span className="text-xs text-gray-500">{lesson.duration}</span>
                          </div>
                        </div>
                      </div>
                      {selectedLesson?.id === lesson.id && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {modules.reduce((acc, module) => acc + module.lessons.filter(l => l.completed).length, 0)} of{' '}
            {modules.reduce((acc, module) => acc + module.lessons.length, 0)} lessons completed
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (modules.reduce((acc, module) => acc + module.lessons.filter(l => l.completed).length, 0) /
                    modules.reduce((acc, module) => acc + module.lessons.length, 0)) * 100
                }%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModulesSidebar;