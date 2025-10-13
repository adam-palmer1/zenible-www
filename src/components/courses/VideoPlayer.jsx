import React, { useState, useRef, useEffect } from 'react';
import playIcon from '../../assets/courses/play-icon.svg';
import pauseIcon from '../../assets/courses/pause-icon.svg';

const VideoPlayer = ({ lesson, isPlaying, onPlayStateChange, onProgressChange }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Convert duration string to seconds
  const parseDuration = (durationStr) => {
    if (!durationStr) return 0;
    const [minutes, seconds] = durationStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Format time for display
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (lesson) {
      setDuration(parseDuration(lesson.duration));
      setCurrentTime(0);
      onProgressChange(0);
    }
  }, [lesson, onProgressChange]);

  const togglePlayPause = () => {
    onPlayStateChange(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressPercent = clickX / rect.width;
    const newTime = progressPercent * duration;
    setCurrentTime(newTime);
    onProgressChange(newTime);
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Simulate video progress when playing
  useEffect(() => {
    let interval;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          onProgressChange(newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, onProgressChange]);

  if (!lesson) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Select a lesson to start watching</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full bg-black group cursor-pointer"
      onMouseMove={showControlsTemporarily}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(true)}
      onClick={togglePlayPause}
    >
      {/* Video Placeholder - In real implementation, this would be a video element */}
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h3 className="text-2xl font-semibold mb-2">{lesson.title}</h3>
          <p className="text-gray-300">Duration: {lesson.duration}</p>
        </div>
      </div>

      {/* Play/Pause Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="w-20 h-20 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
            onClick={togglePlayPause}
          >
            <img src={playIcon} alt="Play" className="w-8 h-8 ml-1" />
          </button>
        </div>
      )}

      {/* Video Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress Bar */}
        <div
          className="w-full bg-white bg-opacity-30 rounded-full h-1 mb-4 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-200"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          ></div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-4">
            <button
              className="text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              <img
                src={isPlaying ? pauseIcon : playIcon}
                alt={isPlaying ? 'Pause' : 'Play'}
                className="w-6 h-6"
              />
            </button>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.795L5.8 14.8a1 1 0 00-.633-.226H3a1 1 0 01-1-1V6.4a1 1 0 011-1h2.167a1 1 0 00.633-.226l2.583-1.995a1 1 0 011.617.795zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 accent-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Fullscreen Button */}
            <button
              className="text-white hover:text-gray-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Title Overlay */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black bg-opacity-50 rounded-lg p-3 backdrop-blur-sm">
          <h4 className="text-white font-medium">{lesson.title}</h4>
          {lesson.completed && (
            <div className="flex items-center mt-1">
              <svg className="w-4 h-4 text-green-400 mr-1" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
              <span className="text-green-400 text-sm">Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;