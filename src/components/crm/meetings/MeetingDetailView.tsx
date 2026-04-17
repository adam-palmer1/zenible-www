import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
import ConfirmationModal from '../../common/ConfirmationModal';
import contactsAPI from '../../../services/api/crm/contacts';
import type { MeetingDetail, LinkedContactInfo } from '../../../types/meetingIntelligence';

type DetailTab = 'summary' | 'transcript' | 'recording' | 'intelligence';

const SPEAKER_COLORS = [
  'text-blue-500', 'text-emerald-500', 'text-purple-500', 'text-orange-500',
  'text-pink-500', 'text-cyan-500', 'text-yellow-500', 'text-red-500',
];

interface Props {
  meetingId: string;
  onBack: () => void;
}

const MeetingDetailView: React.FC<Props> = ({ meetingId, onBack }) => {
  const { darkMode } = usePreferences();
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('summary');

  // Contact linking state
  const [linkedContacts, setLinkedContacts] = useState<LinkedContactInfo[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState<Array<{ id: string; first_name: string; last_name: string; is_client: boolean; is_vendor: boolean }>>([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const contactSearchRef = useRef<HTMLDivElement>(null);

  // Recording state (must be before any early returns)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [showDeleteRecordingConfirm, setShowDeleteRecordingConfirm] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const [meetingData, contactsData] = await Promise.all([
          meetingIntelligenceAPI.getMeeting(meetingId) as Promise<MeetingDetail>,
          meetingIntelligenceAPI.getMeetingContacts(meetingId) as Promise<LinkedContactInfo[]>,
        ]);
        setDetail(meetingData);
        setLinkedContacts(contactsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load meeting');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [meetingId]);

  // Click outside to close contact search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contactSearchRef.current && !contactSearchRef.current.contains(e.target as Node)) {
        setShowContactSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced contact search
  useEffect(() => {
    if (!contactSearch.trim()) {
      setContactResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingContacts(true);
        const result = await contactsAPI.list({ search: contactSearch.trim(), page_size: '10' });
        const items = (result as { items: Array<{ id: string; first_name: string; last_name: string; is_client: boolean; is_vendor: boolean }> }).items || [];
        // Filter out already linked contacts
        const linkedIds = new Set(linkedContacts.map(lc => lc.contact_id));
        setContactResults(items.filter(c => !linkedIds.has(c.id)));
      } catch {
        // Silently fail
      } finally {
        setSearchingContacts(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch, linkedContacts]);

  const handleLinkContact = async (contactId: string) => {
    try {
      const result = await meetingIntelligenceAPI.linkContacts(meetingId, [contactId]) as LinkedContactInfo[];
      setLinkedContacts(result);
      setContactSearch('');
      setContactResults([]);
      setShowContactSearch(false);
    } catch {
      // Silently fail
    }
  };

  const handleUnlinkContact = async (contactId: string) => {
    try {
      await meetingIntelligenceAPI.unlinkContact(meetingId, contactId);
      setLinkedContacts(prev => prev.filter(c => c.contact_id !== contactId));
    } catch {
      // Silently fail
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
  };

  const formatTimestamp = (ms: number) => {
    // timestamp_ms is a Unix epoch in ms; render as offset from the meeting's
    // first transcript so "0:00" is the start of the call.
    const base = detail?.transcripts?.[0]?.timestamp_ms ?? ms;
    const seconds = Math.max(0, Math.floor((ms - base) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string) => {
    if (!detail) return SPEAKER_COLORS[0];
    const idx = detail.speakers.findIndex(s => s.channel_label === speaker);
    return SPEAKER_COLORS[idx >= 0 ? idx % SPEAKER_COLORS.length : 0];
  };

  const getSpeakerName = (transcript: MeetingDetail['transcripts'][0]) => {
    return transcript.speaker_display_name || transcript.speaker;
  };

  const getContactTypeLabel = (type: string) => {
    if (type === 'client') return 'Client';
    if (type === 'vendor') return 'Vendor';
    return 'Contact';
  };

  const getContactTypeBadgeClass = (type: string) => {
    if (type === 'client') return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700';
    if (type === 'vendor') return darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700';
    return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
          ← Back to History
        </button>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
          {error || 'Meeting not found'}
        </div>
      </div>
    );
  }

  const handleLoadRecording = async () => {
    setVideoLoading(true);
    try {
      const result = await meetingIntelligenceAPI.getRecordingUrl(meetingId);
      setVideoUrl(result.url);
    } catch (err: any) {
      setError(err.message || 'Failed to load recording');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleShareRecording = async () => {
    try {
      const result = await meetingIntelligenceAPI.createShareLink(meetingId);
      setShareUrl(result.share_url);
      await navigator.clipboard.writeText(result.share_url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    }
  };

  const handleDeleteRecording = async () => {
    try {
      await meetingIntelligenceAPI.deleteRecording(meetingId);
      setVideoUrl(null);
      if (detail) {
        setDetail({ ...detail, has_video_recording: false, video_duration_ms: null, video_size_bytes: null });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete recording');
    }
  };

  const handleAnalyze = async () => {
    if (!detail) return;
    setAnalyzing(true);
    try {
      const result = await meetingIntelligenceAPI.analyzeMeeting(meetingId) as {
        overview?: string;
        keyPoints?: string[];
        actionItems?: string[];
        sentiment?: string;
        topics?: string[];
      };
      setDetail({ ...detail, summary_json: result });
    } catch (err: any) {
      setError(err.message || 'Failed to analyze meeting');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'transcript', label: 'Transcript' },
    ...(detail?.has_video_recording ? [{ id: 'recording' as DetailTab, label: 'Recording' }] : []),
    { id: 'intelligence', label: 'Meeting Intelligence' },
  ];

  // Group consecutive same-speaker transcripts
  const groupedTranscripts: Array<{
    speaker: string;
    speakerName: string;
    entries: MeetingDetail['transcripts'];
  }> = [];
  for (const t of detail.transcripts) {
    const last = groupedTranscripts[groupedTranscripts.length - 1];
    if (last && last.speaker === t.speaker) {
      last.entries.push(t);
    } else {
      groupedTranscripts.push({
        speaker: t.speaker,
        speakerName: getSpeakerName(t),
        entries: [t],
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onBack} className={`text-sm flex items-center gap-1 ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
        ← Back to History
      </button>

      {/* Meeting header */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {detail.title || 'Untitled Meeting'}
        </h2>
        <div className={`flex flex-wrap items-center gap-3 mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          <span>{formatTime(detail.start_time)}</span>
          {detail.duration_ms != null && detail.duration_ms > 0 && (
            <span>{formatDuration(detail.duration_ms)}</span>
          )}
          {detail.is_processed && (
            <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
              Processed
            </span>
          )}
        </div>

        {/* Speakers */}
        {detail.speakers.length > 0 && (
          <div className={`flex flex-wrap gap-2 mt-3 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            <span className="font-medium">Speakers:</span>
            {detail.speakers.map((s, i) => (
              <span key={s.id} className={SPEAKER_COLORS[i % SPEAKER_COLORS.length]}>
                {s.display_name || s.person_name || s.channel_label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Linked Contacts */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Linked Contacts</h3>
          <button
            onClick={() => setShowContactSearch(!showContactSearch)}
            className="text-xs px-2 py-1 rounded bg-zenible-primary text-white hover:opacity-90"
          >
            + Link Contact
          </button>
        </div>

        {/* Contact search */}
        {showContactSearch && (
          <div ref={contactSearchRef} className="relative mb-3">
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts..."
              autoFocus
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            {(contactResults.length > 0 || searchingContacts) && (
              <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-48 overflow-y-auto ${
                darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
              }`}>
                {searchingContacts ? (
                  <div className={`px-3 py-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Searching...</div>
                ) : (
                  contactResults.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleLinkContact(contact.id)}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        darkMode ? 'hover:bg-zenible-dark-border text-white' : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <span>{contact.first_name} {contact.last_name}</span>
                      <span className={`ml-2 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                        {contact.is_client ? 'Client' : contact.is_vendor ? 'Vendor' : 'Contact'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Linked contact chips */}
        {linkedContacts.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>No contacts linked</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkedContacts.map((contact) => (
              <span
                key={contact.contact_id}
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getContactTypeBadgeClass(contact.type)}`}
              >
                {contact.name}
                <span className="opacity-60">({getContactTypeLabel(contact.type)})</span>
                <button
                  onClick={() => handleUnlinkContact(contact.contact_id)}
                  className="ml-0.5 hover:opacity-70"
                  title="Unlink contact"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Detail tabs */}
      <div className={`flex gap-1 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-zenible-primary text-zenible-primary'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {detail.summary_json?.overview && (
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Overview</h3>
              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                {detail.summary_json.overview}
              </p>
            </div>
          )}

          {detail.summary_json?.keyPoints && detail.summary_json.keyPoints.length > 0 && (
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Points</h3>
              <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                {detail.summary_json.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {detail.summary_json?.actionItems && detail.summary_json.actionItems.length > 0 && (
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Action Items</h3>
              <ul className="space-y-1">
                {detail.summary_json.actionItems.map((item, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    <input type="checkbox" className="mt-0.5 rounded" disabled />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!detail.summary_json?.overview && !detail.summary_json?.keyPoints?.length && !detail.summary_json?.actionItems?.length && (
            <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              <p>No summary available for this meeting</p>
            </div>
          )}
        </div>
      )}

      {/* Transcript tab */}
      {activeTab === 'transcript' && (
        <div className={`rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          {groupedTranscripts.length > 0 && (
            <div className={`flex justify-end px-3 pt-3`}>
              <a
                href={`${import.meta.env.VITE_API_URL || ''}/api/v1/crm/meeting-intelligence/meetings/${meetingId}/transcript.txt`}
                download
                className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                  darkMode
                    ? 'bg-zenible-dark-border text-zenible-dark-text-secondary hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('access_token');
                  fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/crm/meeting-intelligence/meetings/${meetingId}/transcript.txt`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then(r => r.blob())
                    .then(blob => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'transcript.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    });
                }}
              >
                Download .txt
              </a>
            </div>
          )}
          {groupedTranscripts.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              <p>No transcript available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {groupedTranscripts.map((group, gi) => (
                <div key={gi} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${getSpeakerColor(group.speaker)}`}>
                      {group.speakerName}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                      {formatTimestamp(group.entries[0].timestamp_ms)}
                    </span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-700'}`}>
                    {group.entries.map(e => e.content).join(' ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recording tab */}
      {activeTab === 'recording' && detail?.has_video_recording && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Video Recording</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareRecording}
                className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                  darkMode ? 'bg-zenible-primary/20 text-zenible-primary hover:bg-zenible-primary/30' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                {shareCopied ? 'Link Copied!' : 'Share'}
              </button>
              <button
                onClick={() => setShowDeleteRecordingConfirm(true)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                  darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className={`flex gap-4 mb-4 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            {detail.video_duration_ms != null && (
              <span>Duration: {formatDuration(detail.video_duration_ms)}</span>
            )}
            {detail.video_size_bytes != null && (
              <span>Size: {formatFileSize(detail.video_size_bytes)}</span>
            )}
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className={`mb-4 p-2 rounded text-xs break-all ${darkMode ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary' : 'bg-gray-50 text-gray-600'}`}>
              {shareUrl}
            </div>
          )}

          {/* Video player */}
          {videoUrl ? (
            <video
              controls
              className="w-full rounded-lg"
              src={videoUrl}
            >
              Your browser does not support the video element.
            </video>
          ) : (
            <div className="flex justify-center py-8">
              <button
                onClick={handleLoadRecording}
                disabled={videoLoading}
                className="px-4 py-2 rounded-lg bg-zenible-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {videoLoading ? (
                  <>
                    <span className="inline-flex h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Play Recording
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Meeting Intelligence tab */}
      {activeTab === 'intelligence' && (
        <div className="space-y-4">
          {/* Analyzing spinner */}
          {detail.summary_json?._analyzing && (
            <div className={`text-center py-12 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-center mb-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary" />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analyzing Meeting...</h3>
              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                AI is processing the transcript. This may take a minute.
              </p>
            </div>
          )}

          {/* Analysis failed (LLM error, empty output, parse failure, etc.) */}
          {detail.summary_json?._analysis_failed && (
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>
                AI analysis failed
              </h3>
              <p className={`text-sm mb-3 ${darkMode ? 'text-amber-100/80' : 'text-amber-800'}`}>
                {detail.summary_json.message || 'The analysis could not be completed.'}
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 rounded-lg bg-zenible-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <span className="inline-flex h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Re-analyzing...
                  </>
                ) : 'Try again'}
              </button>
            </div>
          )}

          {/* Plan does not grant access to the meeting analyst character */}
          {detail.summary_json?._plan_access_denied && (
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>
                AI meeting analysis not included on your plan
              </h3>
              <p className={`text-sm mb-3 ${darkMode ? 'text-amber-100/80' : 'text-amber-800'}`}>
                {detail.summary_json.message || 'The AI analyst for meeting insights is not available on your current plan. The transcript is saved.'}
              </p>
              <a
                href="/settings/billing"
                className="inline-flex items-center text-sm font-medium text-zenible-primary hover:underline"
              >
                Upgrade your plan →
              </a>
            </div>
          )}

          {/* AI message quota exhausted */}
          {detail.summary_json?._quota_exceeded && (() => {
            const ut = detail.summary_json.usage_type;
            const isDaily = ut === 'ai_character_messages_daily';
            const isCharMonthly = ut === 'ai_character_messages';
            const title = isDaily
              ? 'Daily AI message limit reached'
              : isCharMonthly
                ? 'Monthly character-message limit reached'
                : 'No AI message credits remaining';
            const resetHint = isDaily
              ? 'Your daily limit resets at 00:00 UTC.'
              : 'Your limit will reset at the start of the next billing period, or you can upgrade your plan.';
            return (
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>
                  {title}
                </h3>
                <p className={`text-sm mb-3 ${darkMode ? 'text-amber-100/80' : 'text-amber-800'}`}>
                  You've used all of this quota
                  {typeof detail.summary_json.current === 'number' && typeof detail.summary_json.limit === 'number'
                    ? ` (${detail.summary_json.current}/${detail.summary_json.limit})`
                    : ''}.
                  The transcript is saved, but AI insights for this meeting weren't generated.
                  {' '}{resetHint}
                </p>
                <a
                  href="/settings/billing"
                  className="inline-flex items-center text-sm font-medium text-zenible-primary hover:underline"
                >
                  Upgrade your plan →
                </a>
              </div>
            );
          })()}

          {/* No analysis yet */}
          {!detail.summary_json && (
            <div className={`text-center py-12 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
              <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                No AI analysis available for this meeting yet.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 rounded-lg bg-zenible-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <span className="inline-flex h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : 'Analyze Meeting'}
              </button>
            </div>
          )}

          {/* Analysis content */}
          {detail.summary_json && !detail.summary_json._analyzing && !detail.summary_json._quota_exceeded && !detail.summary_json._analysis_failed && !detail.summary_json._plan_access_denied && (
            <>
              {/* Re-analyze button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                    darkMode
                      ? 'bg-zenible-dark-border text-zenible-dark-text-secondary hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50 inline-flex items-center gap-1`}
                >
                  {analyzing ? (
                    <>
                      <span className="inline-flex h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Re-analyzing...
                    </>
                  ) : 'Re-analyze'}
                </button>
              </div>

              {/* Sentiment & Topics */}
              {(detail.summary_json.sentiment || (detail.summary_json.topics && detail.summary_json.topics.length > 0)) && (
                <div className={`flex flex-wrap items-center gap-2`}>
                  {detail.summary_json.sentiment && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      detail.summary_json.sentiment === 'positive'
                        ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700')
                        : detail.summary_json.sentiment === 'negative'
                          ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {detail.summary_json.sentiment.charAt(0).toUpperCase() + detail.summary_json.sentiment.slice(1)}
                    </span>
                  )}
                  {detail.summary_json.topics?.map((topic, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                      darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              {detail.summary_json.overview && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Overview</h3>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {detail.summary_json.overview}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {detail.summary_json.keyPoints && detail.summary_json.keyPoints.length > 0 && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Points</h3>
                  <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {detail.summary_json.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {detail.summary_json.actionItems && detail.summary_json.actionItems.length > 0 && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Action Items</h3>
                  <ul className="space-y-2">
                    {detail.summary_json.actionItems.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                        <input type="checkbox" className="mt-0.5 rounded" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={showDeleteRecordingConfirm}
        onClose={() => setShowDeleteRecordingConfirm(false)}
        onConfirm={handleDeleteRecording}
        title="Delete Recording"
        message="Are you sure you want to delete this recording?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default MeetingDetailView;
