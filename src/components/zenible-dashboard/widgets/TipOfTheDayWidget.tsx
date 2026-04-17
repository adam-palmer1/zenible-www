import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { LightBulbIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';
import Modal from '../../ui/modal/Modal';

interface TipData {
  content: string;
  category?: string;
}

interface Character {
  name?: string;
  avatar_url?: string;
  description?: string;
}

interface TipOfTheDayWidgetProps {
  settings?: Record<string, any>;
}

interface TipBodyProps {
  tipData: TipData;
  character: Character | null;
  quoteStyle?: React.CSSProperties;
  quoteRef?: React.Ref<HTMLQuoteElement>;
  nameAccessory?: React.ReactNode;
  showDescription?: boolean;
}

const TipBody = ({
  tipData,
  character,
  quoteStyle,
  quoteRef,
  nameAccessory,
  showDescription = false,
}: TipBodyProps) => (
  <div className="flex items-start gap-4 h-full">
    <div className="flex-shrink-0 flex flex-col items-center">
      {character?.avatar_url ? (
        <img
          src={character.avatar_url}
          alt={character.name || 'Tip character'}
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <LightBulbIcon className="w-6 h-6 text-amber-600" />
        </div>
      )}
      {character?.name && (
        <span className="text-xs font-medium text-gray-700 text-center mt-1 flex items-center gap-0.5">
          {character.name}
          {nameAccessory}
        </span>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <blockquote
        ref={quoteRef}
        className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-gray-300 pl-3"
        style={quoteStyle}
      >
        &ldquo;{tipData.content}&rdquo;
      </blockquote>
      {showDescription && character?.description && (
        <p className="mt-2 text-xs text-gray-400 leading-relaxed ml-[14px]">
          {character.description}
        </p>
      )}
      {tipData.category && (
        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-50 rounded">
          {tipData.category}
        </span>
      )}
    </div>
  </div>
);

/**
 * Tip of the Day Widget for Dashboard
 * Shows a daily tip with optional character avatar
 */
const TipOfTheDayWidget = ({ settings: _settings = {} }: TipOfTheDayWidgetProps) => {
  const { data, isLoading } = useDashboardWidget('tipOfTheDay');

  const tipData: TipData | null = data?.tip || null;
  const character: Character | null = data?.character || null;

  const containerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [maxLines, setMaxLines] = useState<number | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const quote = quoteRef.current;
    if (!container || !quote) return;

    const containerRect = container.getBoundingClientRect();
    const quoteRect = quote.getBoundingClientRect();
    // Space from quote's top to the bottom of the container
    const availableHeight = containerRect.bottom - quoteRect.top;
    const lineHeight = parseFloat(getComputedStyle(quote).lineHeight) || 20;
    const lines = Math.max(1, Math.floor(availableHeight / lineHeight));
    setMaxLines(lines);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, tipData?.content, character?.description]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  // After applying the clamp, determine whether content is actually truncated
  useLayoutEffect(() => {
    const quote = quoteRef.current;
    if (!quote || maxLines === null) {
      setIsTruncated(false);
      return;
    }
    setIsTruncated(quote.scrollHeight - quote.clientHeight > 1);
  }, [maxLines, tipData?.content]);

  const handleOpen = useCallback(() => {
    if (isTruncated) setIsModalOpen(true);
  }, [isTruncated]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isTruncated) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    },
    [isTruncated],
  );

  const handleToggleDescription = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowDescription(prev => {
      if (!prev && infoBtnRef.current) {
        const rect = infoBtnRef.current.getBoundingClientRect();
        setPopoverPos({ top: rect.bottom + 6, left: rect.left });
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!showDescription) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        infoBtnRef.current && !infoBtnRef.current.contains(e.target as Node)
      ) {
        setShowDescription(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDescription]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!tipData) {
    return null;
  }

  const quoteStyle: React.CSSProperties = maxLines
    ? {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: maxLines,
        overflow: 'hidden',
      }
    : { overflow: 'hidden' };

  return (
    <>
      <div
        ref={containerRef}
        className={`h-full ${isTruncated ? 'cursor-pointer' : ''}`}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        role={isTruncated ? 'button' : undefined}
        tabIndex={isTruncated ? 0 : undefined}
        aria-label={isTruncated ? 'Show full tip' : undefined}
        title={isTruncated ? 'Click to read full tip' : undefined}
      >
        <TipBody
          tipData={tipData}
          character={character}
          quoteRef={quoteRef}
          quoteStyle={quoteStyle}
          nameAccessory={
            character?.description ? (
              <button
                ref={infoBtnRef}
                onClick={handleToggleDescription}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Show character description"
              >
                <InformationCircleIcon className="w-3.5 h-3.5" />
              </button>
            ) : null
          }
        />
      </div>

      {showDescription && character?.description && popoverPos && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 max-w-[240px] p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-500 leading-relaxed"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          {character.description}
        </div>,
        document.body
      )}

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Tip of the Day"
        size="lg"
      >
        <TipBody tipData={tipData} character={character} showDescription />
      </Modal>
    </>
  );
};

export default TipOfTheDayWidget;
