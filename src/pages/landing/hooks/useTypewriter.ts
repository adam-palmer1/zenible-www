import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
}

type Phase = 'typing' | 'pausing' | 'deleting' | 'waiting';

export function useTypewriter({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 50,
  pauseAfterType = 2000,
  pauseAfterDelete = 500,
}: UseTypewriterOptions) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    switch (phase) {
      case 'typing': {
        if (text.length < currentPhrase.length) {
          timeoutRef.current = setTimeout(() => {
            setText(currentPhrase.slice(0, text.length + 1));
          }, typingSpeed);
        } else {
          // Fully typed — transition to pausing
          timeoutRef.current = setTimeout(() => {
            setPhase('deleting');
          }, pauseAfterType);
        }
        break;
      }
      case 'deleting': {
        if (text.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setText(currentPhrase.slice(0, text.length - 1));
          }, deletingSpeed);
        } else {
          // Fully deleted — transition to waiting then next phrase
          timeoutRef.current = setTimeout(() => {
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
            setPhase('typing');
          }, pauseAfterDelete);
        }
        break;
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, phraseIndex, phase, phrases, typingSpeed, deletingSpeed, pauseAfterType, pauseAfterDelete]);

  return { text, isDeleting: phase === 'deleting' };
}
