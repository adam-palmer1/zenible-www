import React, { useState, useEffect } from 'react';
import RegistrationProgress from './RegistrationProgress';
import starBackground from '../../assets/icons/live-qa/star-background.svg';
import star from '../../assets/icons/live-qa/star.svg';
import calendarIcon from '../../assets/icons/live-qa/calendar-icon.svg';
import clockIcon from '../../assets/icons/live-qa/clock-icon.svg';
import planAPI from '../../services/planAPI';

interface EventCardProps {
  event: any;
  darkMode: boolean;
  onRegisterClick: () => void;
  onUnregisterClick: () => void;
}

function EventCardInner({ event, darkMode, onRegisterClick, onUnregisterClick }: EventCardProps) {
  // State for required plan information
  const [requiredPlan, setRequiredPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // State for clipboard copy feedback
  const [copied, setCopied] = useState(false);

  // Format date (example: "Friday, Sep 26, 11:21 AM")
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

  // Truncate description
  const truncateDescription = (text: string, maxLength = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Determine event status based on datetime and duration
  const getEventStatus = () => {
    const now = new Date();
    const eventDateTime = new Date(event.start_datetime);
    const eventEndTime = new Date(eventDateTime.getTime() + event.duration_minutes * 60000);

    if (now >= eventDateTime && now <= eventEndTime) {
      return 'live';
    }
    if (now > eventEndTime && event.replay_url) {
      return 'recorded';
    }
    return 'upcoming';
  };

  const status = getEventStatus();

  // Get status badge color
  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'live':
        return darkMode
          ? 'bg-red-900/20 border-red-700 text-red-400'
          : 'bg-red-50 border-red-200 text-red-600';
      case 'recorded':
        return darkMode
          ? 'bg-gray-700 border-gray-600 text-gray-300'
          : 'bg-gray-100 border-gray-200 text-gray-600';
      case 'upcoming':
      default:
        return darkMode
          ? 'bg-violet-900/30 border-violet-700 text-violet-400'
          : 'bg-violet-50 border-[#ddd6ff] text-[#8e51ff]';
    }
  };

  // Get status text
  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get first host (API returns array of hosts)
  const primaryHost = event.hosts && event.hosts.length > 0 ? event.hosts[0] : null;

  // Get first letter of host's name for avatar initials
  const getHostInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Fetch required plan details
  const fetchRequiredPlan = async (planId: string) => {
    if (!planId || requiredPlan?.id === planId) return;

    setPlanLoading(true);
    try {
      const plan = await planAPI.getPublicPlanDetails(planId);
      setRequiredPlan(plan);
    } catch (error) {
      console.error('Failed to fetch required plan:', error);
      setRequiredPlan(null);
    } finally {
      setPlanLoading(false);
    }
  };

  // Effect to fetch plan details when we might show plan upgrade button
  useEffect(() => {
    if (!event.can_subscribe && !event.is_user_registered && event.required_plan_id) {
      // Check if this is likely a plan restriction
      const hasObviousReason = !event.is_active ||
                               status !== 'upcoming' ||
                               event.registered_count >= event.guest_limit;
      const isPlanRelated = event.required_plan_id || !hasObviousReason;

      if (isPlanRelated) {
        fetchRequiredPlan(event.required_plan_id);
      }
    }
  }, [event.required_plan_id, event.can_subscribe, event.is_user_registered, event.is_active, status, event.registered_count, event.guest_limit]);

  return (
    <div
      className={`border border-solid rounded-xl flex flex-col h-auto min-h-[440px] sm:h-[440px] w-full sm:max-w-[367px] transition-shadow hover:shadow-lg ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      }`}
    >
      {/* Top Section - Status, Rating, Title, Description */}
      <div className="flex flex-col gap-2 p-4">
        {/* Status Badge and Rating */}
        <div className="flex items-start justify-between">
          {/* Status and Registered Badges */}
          <div className="flex gap-2 items-center">
            <div
              className={`border border-solid box-border flex items-center justify-center px-1.5 py-0.5 rounded-md h-5 ${getStatusBadgeStyle()}`}
            >
              <span className="font-['Inter'] font-medium text-[10px] leading-[14px] text-center whitespace-nowrap">
                {getStatusText()}
              </span>
            </div>
            {event.is_user_registered && (
              <div
                className={`border border-solid box-border flex items-center justify-center px-1.5 py-0.5 rounded-md h-5 ${
                  darkMode
                    ? 'bg-green-900/20 border-green-700 text-green-400'
                    : 'bg-green-50 border-green-200 text-green-600'
                }`}
              >
                <span className="font-['Inter'] font-medium text-[10px] leading-[14px] text-center whitespace-nowrap">
                  Registered
                </span>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex gap-1.5 items-center h-5">
            {/* Star Icon */}
            <div className="relative" style={{ width: '16.2px', height: '16.2px' }}>
              <img src={starBackground} alt="" className="absolute inset-0" style={{ width: '16.2px', height: '15.8px', top: '0.4px' }} />
              <img src={star} alt="" className="absolute left-0 top-0" style={{ width: '13.5px', height: '18px' }} />
            </div>
            <span
              className={`font-['Inter'] font-normal text-[14px] leading-[22px] ${
                darkMode ? 'text-gray-400' : 'text-zinc-500'
              }`}
            >
              {event.rating || '0.0'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex">
          <h3
            className={`font-['Inter'] font-medium text-[16px] leading-[24px] ${
              darkMode ? 'text-gray-100' : 'text-zinc-950'
            }`}
          >
            {event.title}
          </h3>
        </div>

        {/* Description */}
        <p
          className={`font-['Inter'] font-normal text-[14px] leading-[22px] ${
            darkMode ? 'text-gray-400' : 'text-zinc-500'
          }`}
        >
          {truncateDescription(event.description)}
        </p>
      </div>

      {/* Middle Section - Host, Date/Time, Progress, Tags */}
      <div className="flex flex-col gap-2 px-4 pb-4">
        {/* Host Card */}
        {primaryHost && (
          <div
            className={`border border-solid rounded-lg flex gap-3 items-center p-2 ${
              darkMode
                ? 'bg-gray-700 border-gray-600'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0 rounded-full overflow-hidden" style={{ width: '40px', height: '40px' }}>
              {primaryHost.image_url ? (
                <img
                  src={primaryHost.image_url}
                  alt={primaryHost.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Replace the image with initials fallback using safe DOM methods
                    const parent = (e.target as HTMLElement).parentNode as HTMLElement;
                    while (parent.firstChild) {
                      parent.removeChild(parent.firstChild);
                    }
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'w-full h-full bg-gray-400 flex items-center justify-center';
                    const span = document.createElement('span');
                    span.className = 'text-white font-medium text-sm';
                    span.textContent = getHostInitial(primaryHost.name);
                    fallbackDiv.appendChild(span);
                    parent.appendChild(fallbackDiv);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {getHostInitial(primaryHost.name)}
                  </span>
                </div>
              )}
            </div>

            {/* Host Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-['Inter'] font-medium text-[14px] leading-[22px] truncate ${
                  darkMode ? 'text-gray-100' : 'text-zinc-950'
                }`}
              >
                {primaryHost.name}
              </p>
              <p
                className={`font-['Inter'] font-normal text-[12px] leading-[20px] truncate ${
                  darkMode ? 'text-gray-400' : 'text-zinc-500'
                }`}
              >
                {primaryHost.byline || 'Expert'}
              </p>
            </div>
          </div>
        )}

        {/* Date and Duration */}
        <div className="flex gap-2">
          {/* Date */}
          <div
            className={`flex-1 border border-solid rounded-lg flex gap-3 items-center p-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-neutral-200'
            }`}
          >
            <div className="bg-[#dff2fe] flex items-center justify-center p-1 rounded shrink-0" style={{ width: '22px', height: '22px' }}>
              <img src={calendarIcon} alt="Date" className="w-2 h-2" />
            </div>
            <span
              className={`font-['Inter'] font-normal text-[14px] leading-[22px] truncate ${
                darkMode ? 'text-gray-400' : 'text-zinc-500'
              }`}
            >
              {formatDate(event.start_datetime)}
            </span>
          </div>

          {/* Duration */}
          <div
            className={`border border-solid rounded-lg flex gap-3 items-center p-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-neutral-200'
            }`}
            style={{ width: '100px' }}
          >
            <div className="bg-green-100 flex items-center justify-center p-1 rounded shrink-0" style={{ width: '22px', height: '22px' }}>
              <img src={clockIcon} alt="Duration" className="w-2 h-2" />
            </div>
            <span
              className={`font-['Inter'] font-normal text-[14px] leading-[22px] ${
                darkMode ? 'text-gray-400' : 'text-zinc-500'
              }`}
            >
              {event.duration_minutes}m
            </span>
          </div>
        </div>

        {/* Registration Progress */}
        <RegistrationProgress
          current={event.registered_count}
          max={event.guest_limit}
          darkMode={darkMode}
        />

        {/* Topic Tags */}
        <div className="flex gap-2 flex-wrap">
          {event.tags.map((tag: string, index: number) => (
            <div
              key={index}
              className={`border border-solid box-border flex items-center justify-center px-1.5 py-0.5 rounded-md h-6 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-zinc-100 border-neutral-200 text-zinc-500'
              }`}
            >
              <span className="font-['Inter'] font-medium text-[12px] leading-[20px] text-center whitespace-nowrap">
                {tag}
              </span>
            </div>
          ))}
        </div>

        {/* Join Link Section (for registered users with event_url) */}
        {event.is_user_registered && event.event_url && (
          <div className="mt-2">
            <label className={`block text-[12px] font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Join Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={event.event_url}
                readOnly
                className={`flex-1 px-3 py-2 text-[14px] rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                } cursor-default`}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(event.event_url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy link:', err);
                  }
                }}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  copied
                    ? darkMode
                      ? 'bg-violet-700 border-violet-600 text-violet-300'
                      : 'bg-violet-100 border-violet-300 text-violet-600'
                    : darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
                title={copied ? 'Link copied!' : 'Copy join link to clipboard'}
              >
                {copied ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - Action Buttons */}
      <div className="flex gap-3 px-4 pb-4 pt-2">
        {/* For registered users, show both Join Event (if available) and Unregister buttons */}
        {event.is_user_registered ? (
          <>
            {/* Join Event Button (if event_url is available) */}
            {event.event_url && (
              <button
                onClick={() => window.open(event.event_url, '_blank')}
                className="flex-1 bg-[#8e51ff] hover:bg-violet-600 text-white rounded-lg flex items-center justify-center h-10 px-3 py-2.5 transition-colors"
              >
                <span className="font-['Inter'] font-medium text-[16px] leading-[24px] whitespace-nowrap">
                  {status === 'live' ? 'Join Live Event' : status === 'recorded' ? 'Watch Recording' : 'Join Event'}
                </span>
              </button>
            )}

            {/* Unregister Button */}
            <button
              onClick={onUnregisterClick}
              className={`${event.event_url ? 'flex-1' : 'flex-1'} border border-solid rounded-lg flex items-center justify-center h-10 px-3 py-2.5 transition-colors ${
                darkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-neutral-200 bg-white text-zinc-950 hover:bg-gray-50'
              }`}
            >
              <span className="font-['Inter'] font-medium text-[16px] leading-[24px] whitespace-nowrap">
                Unregister
              </span>
            </button>
          </>
        ) : (
          /* For non-registered users, show registration or upgrade options */
          <>
            {event.can_subscribe ? (
              <button
                onClick={onRegisterClick}
                className="flex-1 bg-[#8e51ff] hover:bg-violet-600 text-white rounded-lg flex items-center justify-center h-10 px-3 py-2.5 transition-colors"
              >
                <span className="font-['Inter'] font-medium text-[16px] leading-[24px] whitespace-nowrap">
                  Register Now
                </span>
              </button>
            ) : (
              <>
                {/* Determine if this is likely a plan restriction vs other reasons */}
                {(() => {
                  // Check for obvious non-plan reasons first
                  const hasObviousReason = !event.is_active ||
                                          status !== 'upcoming' ||
                                          event.registered_count >= event.guest_limit;

                  // If there's a required_plan_id OR no obvious reason, assume it's plan-related
                  const isPlanRelated = event.required_plan_id || !hasObviousReason;

                  return isPlanRelated ? (
                    <button
                      disabled
                      className={`flex-1 rounded-lg flex items-center justify-center h-10 px-3 py-2.5 cursor-not-allowed ${
                        darkMode
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                      title={planLoading ? 'Loading plan information...' : requiredPlan ? `Upgrade to ${requiredPlan.name} plan to register for this event` : 'Plan upgrade required to register'}
                    >
                      <span className="font-['Inter'] font-medium text-[16px] leading-[24px] whitespace-nowrap">
                        {planLoading ? 'Loading...' : requiredPlan ? `Upgrade to Register (${requiredPlan.name})` : 'Upgrade to Register'}
                      </span>
                    </button>
                  ) : (
                    /* Generic disabled state for other reasons */
                    <button
                      disabled
                      className={`flex-1 rounded-lg flex items-center justify-center h-10 px-3 py-2.5 cursor-not-allowed ${
                        darkMode
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                      title={
                        !event.is_active ? 'Event is inactive' :
                        status !== 'upcoming' ? 'Registration closed - event has started or ended' :
                        event.registered_count >= event.guest_limit ? 'Event is full' :
                        'Registration closed'
                      }
                    >
                      <span className="font-['Inter'] font-medium text-[16px] leading-[24px] whitespace-nowrap">
                        {
                          !event.is_active ? 'Inactive' :
                          status !== 'upcoming' ? 'Registration Closed' :
                          event.registered_count >= event.guest_limit ? 'Full' :
                          'Registration Closed'
                        }
                      </span>
                    </button>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const EventCard = React.memo(EventCardInner);
export default EventCard;
