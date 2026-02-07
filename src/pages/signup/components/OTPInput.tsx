import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
  value?: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

/**
 * OTPInput Component
 * 5-digit OTP input with auto-focus, paste support
 */
const OTPInput: React.FC<OTPInputProps> = ({ value = '', onChange, length = 5, disabled = false }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into individual digits
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  // Focus first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex(d => !d);
    if (firstEmptyIndex >= 0 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]!.focus();
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Handle paste
    if (inputValue.length > 1) {
      const pastedValue = inputValue.replace(/[^0-9]/g, '').slice(0, length);
      onChange(pastedValue);

      // Focus last filled input or last input
      const focusIndex = Math.min(pastedValue.length, length - 1);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex]!.focus();
      }
      return;
    }

    // Single character input
    const digit = inputValue.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(''));

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current input is empty, go to previous and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
      e.preventDefault();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    onChange(pastedData);

    // Focus appropriate input after paste
    const focusIndex = Math.min(pastedData.length, length - 1);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]!.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="flex gap-[12px] items-center justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={length} // Allow paste of full code
          value={digits[index]}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={`
            w-[44px] h-[44px]
            text-center font-inter font-medium text-[18px]
            text-zinc-950 dark:text-[#ededf0]
            bg-white dark:bg-[#161b26]
            border-[1.5px] border-neutral-200 dark:border-[#1f242f]
            rounded-[10px]
            outline-none
            focus:border-[#8e51ff] dark:focus:border-[#a684ff]
            focus:ring-2 focus:ring-[#8e51ff]/20 dark:focus:ring-[#a684ff]/20
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  );
};

export default OTPInput;
