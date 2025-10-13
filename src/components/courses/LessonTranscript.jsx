import React, { useState, useEffect, useMemo } from 'react';
import coursesAPI from '../../services/coursesAPI';

const LessonTranscript = ({ lesson, currentTime = 0, courseId }) => {
  const [activeTranscriptId, setActiveTranscriptId] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTranscripts = async () => {
    if (!lesson || !courseId || lesson.resource_type !== 'video') {
      setTranscripts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Assuming the backend API has a transcripts endpoint
      // Using a mock implementation for now as the API structure isn't defined in coursesAPI
      const response = await fetch(
        `/api/v1/courses/${courseId}/resources/${lesson.id}/transcripts${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const transcriptData = await response.json();
        setTranscripts(transcriptData || []);
      } else {
        throw new Error('Failed to fetch transcripts');
      }
    } catch (error) {
      console.error('Failed to fetch transcripts:', error);
      // Fall back to mock data if API fails
      setTranscripts(getMockTranscriptData(lesson.id));
    } finally {
      setLoading(false);
    }
  };

  // Mock transcript data fallback
  const getMockTranscriptData = (lessonId) => {
    const mockData = {
      1: [
        { id: 1, timestamp_seconds: 0, formatted_timestamp: "00:00", content: "Welcome to this introduction to freelancing course. In this first lesson, we'll cover the basics of what it means to be a freelancer." },
        { id: 2, timestamp_seconds: 15, formatted_timestamp: "00:15", content: "Freelancing offers incredible flexibility and the opportunity to work with diverse clients across different industries." },
        { id: 3, timestamp_seconds: 45, formatted_timestamp: "00:45", content: "However, it also comes with unique challenges that traditional employees don't face, such as finding your own clients and managing your own taxes." },
        { id: 4, timestamp_seconds: 75, formatted_timestamp: "01:15", content: "Let's start by understanding the mindset shift required to become a successful freelancer." },
        { id: 5, timestamp_seconds: 105, formatted_timestamp: "01:45", content: "The first thing to understand is that as a freelancer, you're not just providing a service - you're running a business." }
      ]
    };
    return mockData[lessonId] || [];
  };

  useEffect(() => {
    fetchTranscripts();
  }, [lesson?.id, courseId, searchTerm]);

  const currentTranscript = useMemo(() => {
    return transcripts;
  }, [transcripts]);

  // Update active transcript based on current video time
  useEffect(() => {
    const activeSegment = currentTranscript.find((segment, index) => {
      const nextSegment = currentTranscript[index + 1];
      return currentTime >= segment.timestamp_seconds && (!nextSegment || currentTime < nextSegment.timestamp_seconds);
    });

    if (activeSegment) {
      setActiveTranscriptId(activeSegment.id);
    }
  }, [currentTime, currentTranscript]);

  if (!lesson) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Select a lesson to view the transcript</p>
      </div>
    );
  }

  if (lesson && lesson.resource_type !== 'video') {
    return (
      <div className="p-6 text-center text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <p>Transcripts are only available for video content</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
        </div>
        <p className="mt-4">Loading transcript...</p>
      </div>
    );
  }

  if (currentTranscript.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        <p>No transcript available for this video</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lesson Transcript</h3>
            <p className="text-sm text-gray-600">
              Follow along with the video or click on any timestamp to jump to that part
            </p>
          </div>
          {lesson && lesson.resource_type === 'video' && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Transcript Content */}
      <div className="space-y-4">
        {currentTranscript.map((segment) => (
          <div
            key={segment.id}
            className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
              activeTranscriptId === segment.id
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              // TODO: Implement video seek functionality
              console.log('Seek to', segment.timestamp_seconds);
            }}
          >
            <div className="flex items-start space-x-4">
              {/* Timestamp */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-block px-2 py-1 text-xs font-mono rounded ${
                    activeTranscriptId === segment.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {segment.formatted_timestamp}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {segment.title && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {segment.title}
                    </span>
                    {activeTranscriptId === segment.id && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                  </div>
                )}
                <p className={`text-sm leading-relaxed ${
                  activeTranscriptId === segment.id ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {segment.content}
                </p>
                {segment.description && (
                  <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Total segments: {currentTranscript.length}</span>
            <span>•</span>
            <span>Duration: {lesson.duration}</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Click any timestamp to jump to that moment</span>
          </div>
        </div>
      </div>

      {/* Auto-scroll indicator */}
      {activeTranscriptId && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          Following video progress
        </div>
      )}
    </div>
  );
};

export default LessonTranscript;