import React from 'react';

interface ProgressBarProps {
  steps?: string[];
  currentStep?: number;
}

/**
 * Progress Bar component for multi-step forms
 */
const ProgressBar: React.FC<ProgressBarProps> = ({ steps = [], currentStep = 0 }) => {
  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative w-full h-1 bg-[#f4f4f5] rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-zenible-primary transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-between mt-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`text-sm font-medium ${
              index === currentStep
                ? 'text-zenible-primary'
                : index < currentStep
                  ? 'text-gray-900'
                  : 'text-gray-400'
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
