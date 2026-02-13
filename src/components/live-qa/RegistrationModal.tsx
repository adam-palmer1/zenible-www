import React, { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import calendarVioletIcon from '../../assets/icons/live-qa/calendar-violet-icon.svg';
import closeX1 from '../../assets/icons/live-qa/close-x-1.svg';
import closeX2 from '../../assets/icons/live-qa/close-x-2.svg';
import calendarInfoIcon from '../../assets/icons/live-qa/calendar-info-icon.svg';
import clockGreenIcon from '../../assets/icons/live-qa/clock-green-icon.svg';
import eventsAPI from '../../services/eventsAPI';

interface RegistrationModalProps {
  event: any;
  onClose: (registered?: boolean) => void;
  darkMode: boolean;
}

export default function RegistrationModal({ event, onClose, darkMode: _darkMode }: RegistrationModalProps) {
  useEscapeKey(() => onClose());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await eventsAPI.registerForEvent(event.id);
      // Close modal and notify parent of successful registration
      onClose(true);
    } catch (err: any) {
      console.error('[RegistrationModal] Error registering for event:', err);
      setError(err.message || 'Failed to register for event');
      setIsSubmitting(false);
    }
  };

  // Prevent clicks inside modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => onClose()}
    >
      <div
        className="bg-white border border-neutral-200 border-solid content-stretch flex flex-col items-start relative rounded-[12px] w-full max-w-[550px] mx-4 min-h-[300px] max-h-[500px]"
        onClick={handleModalClick}
      >
        {/* Section Header */}
        <div className="box-border content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full">
          <div className="bg-violet-50 box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[26px]">
            <div className="relative shrink-0 size-[14px]">
              <img alt="" className="block max-w-none size-full" src={calendarVioletIcon} />
            </div>
          </div>
          <p className="basis-0 font-['Inter'] font-semibold grow leading-[26px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-zinc-950">
            Register for Session
          </p>
          <button
            onClick={() => onClose()}
            className="overflow-clip relative shrink-0 size-[18px] hover:bg-gray-100 rounded transition-colors p-0.5"
          >
            <div className="relative w-full h-full">
              <img alt="" className="absolute block max-w-none size-full" src={closeX1} />
              <img alt="" className="absolute block max-w-none size-full" src={closeX2} />
            </div>
          </button>
        </div>

        {/* Section Content */}
        <div className="box-border content-stretch flex flex-col gap-[6px] items-center justify-center overflow-clip px-[16px] py-[8px] relative shrink-0 w-full">
          <div className="bg-neutral-50 border border-neutral-200 border-solid box-border content-stretch flex flex-col gap-[8px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0 w-full">
            <p className="font-['Inter'] font-medium leading-[22px] not-italic relative shrink-0 text-[14px] text-zinc-950 w-full">
              {event.title}
            </p>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative rounded-[8px] shrink-0">
                <div className="bg-[#dff2fe] box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0 size-[22px]">
                  <div className="relative shrink-0 size-[14px]">
                    <img alt="" className="block max-w-none size-full" src={calendarInfoIcon} />
                  </div>
                </div>
                <div className="font-['Inter'] font-normal leading-[22px] not-italic relative shrink-0 text-[14px] text-zinc-500">
                  {formatDate(event.start_datetime)}
                </div>
              </div>
              <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative rounded-[8px] shrink-0">
                <div className="bg-green-100 box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0 size-[22px]">
                  <div className="relative shrink-0 size-[14px]">
                    <img alt="" className="block max-w-none size-full" src={clockGreenIcon} />
                  </div>
                </div>
                <div className="font-['Inter'] font-normal leading-[22px] not-italic relative shrink-0 text-[14px] text-zinc-500">
                  {event.duration_minutes}m
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="box-border content-stretch flex flex-col gap-[16px] items-center justify-center p-[24px] relative flex-1 w-full">
          <p className="font-['Inter'] font-normal leading-[24px] not-italic text-[16px] text-zinc-600 text-center">
            Are you sure you want to register for this event?
          </p>
          {event.description && (
            <p className="font-['Inter'] font-normal leading-[22px] not-italic text-[14px] text-zinc-500 text-center">
              {event.description}
            </p>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full">
              <p className="font-['Inter'] font-normal text-[14px] text-red-600 text-center">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="box-border content-stretch flex gap-[16px] items-start p-[16px] relative shrink-0 w-full">
          <button
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="basis-0 border border-neutral-200 border-solid grow min-h-px min-w-px relative rounded-[12px] shrink-0 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[inherit] w-full">
              <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-950 whitespace-pre">
                Cancel
              </p>
            </div>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="basis-0 bg-[#8e51ff] box-border content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px overflow-clip p-[12px] relative rounded-[12px] shrink-0 hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
              {isSubmitting ? 'Registering...' : 'Confirm Registration'}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
