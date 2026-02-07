import React, { useEffect, useState, useRef } from 'react';

interface CircularScoreIndicatorProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  darkMode?: boolean;
  animationDuration?: number;
}

export default function CircularScoreIndicator({
  score,
  size = 120,
  strokeWidth = 8,
  darkMode = false,
  animationDuration = 1500
}: CircularScoreIndicatorProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Calculate circle dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 1.5; // 3/4 circle (270 degrees)
  const center = size / 2;

  // Calculate stroke dash offset for the progress
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  const getScoreColor = (scoreValue: number): string => {
    if (scoreValue >= 80) return '#10b981'; // green
    if (scoreValue >= 60) return '#f59e0b'; // yellow/amber
    return '#ef4444'; // red
  };

  const progressColor = getScoreColor(score);

  useEffect(() => {
    // Show component with fade-in
    setIsVisible(true);

    // Animate score from 0 to actual value
    const startTime = Date.now();
    const startScore = 0;
    const endScore = score || 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const currentScore = startScore + (endScore - startScore) * easeOutQuart;
      setAnimatedScore(currentScore);
      setDisplayScore(Math.round(currentScore));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation after a brief delay for fade-in effect
    const timer = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animationDuration]);

  return (
    <div
      className={`flex flex-col items-center gap-3 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle (3/4 circle) */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-45"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={darkMode ? '#374151' : '#e5e7eb'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: `drop-shadow(0 0 6px ${progressColor}40)`
            }}
          />

          {/* Start cap */}
          <circle
            cx={center - radius}
            cy={center}
            r={strokeWidth / 2}
            fill={progressColor}
            opacity={animatedScore > 0 ? 1 : 0}
            style={{ transition: 'opacity 0.3s ease-out' }}
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0.5">
            <span
              className={`font-bold text-3xl transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
              style={{ color: displayScore > 0 ? progressColor : undefined }}
            >
              {displayScore}
            </span>
            <span className={`text-lg font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              %
            </span>
          </div>
          <span className={`text-xs font-medium ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Score
          </span>
        </div>
      </div>

      {/* Score label */}
      <div className={`text-center px-3 py-1.5 rounded-full ${
        score >= 80
          ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
          : score >= 60
            ? darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
            : darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
      }`}>
        <span className="text-xs font-semibold">
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
        </span>
      </div>
    </div>
  );
}
