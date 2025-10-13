import React, { useState, useEffect } from 'react';

export default function TimerCountdown({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsWarning(true);
        return true; // Signal to stop interval
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setIsWarning(minutes < 5);
        return false;
      }
    };

    // Initial update
    const shouldStop = updateTimer();
    if (shouldStop) return;

    const interval = setInterval(() => {
      const shouldStop = updateTimer();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div
      className={`flex items-center gap-[8px] px-[12px] py-[6px] rounded-[8px] ${
        isWarning
          ? 'bg-red-50 text-red-600 animate-pulse'
          : 'bg-neutral-50 text-zinc-950'
      }`}
    >
      <span className="text-[16px]">⏱️</span>
      <p className="font-['Inter'] font-medium text-[14px]">
        {timeLeft}
      </p>
    </div>
  );
}
