import React from 'react';
import { MetricsData } from './types';

interface MetricsDisplayProps {
  darkMode: boolean;
  metrics: MetricsData | null;
  usage: MetricsData | null;
  isAdmin: boolean;
}

export default function MetricsDisplay({ darkMode, metrics, usage, isAdmin }: MetricsDisplayProps) {
  const metricsData = metrics || usage;
  if (!metricsData || !isAdmin) return null;

  return (
    <div className={`text-xs mt-2 pt-2 border-t ${
      darkMode ? 'border-[#444444] text-gray-400' : 'border-gray-200 text-gray-500'
    }`}>
      {metricsData.totalTokens && <span>Tokens: {metricsData.totalTokens}</span>}
      {metricsData.tokens_used && <span>Tokens: {metricsData.tokens_used}</span>}
      {metricsData.messages_used && <span className="ml-3">Messages: {metricsData.messages_used}/{metricsData.messages_limit}</span>}
      {metricsData.durationMs && <span className="ml-3">Time: {(metricsData.durationMs / 1000).toFixed(1)}s</span>}
      {metricsData.costCents && <span className="ml-3">Cost: ${(metricsData.costCents / 100).toFixed(3)}</span>}
    </div>
  );
}
