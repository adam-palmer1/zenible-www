import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import meetingIntelligenceAPI from '../services/api/crm/meetingIntelligence';
import type { PublicRecording } from '../types/meetingIntelligence';

const PublicRecordingPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [recording, setRecording] = useState<PublicRecording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareCode) return;
    const fetchRecording = async () => {
      try {
        setLoading(true);
        const data = await meetingIntelligenceAPI.getPublicRecording(shareCode);
        setRecording(data as PublicRecording);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Recording not found or link has expired');
      } finally {
        setLoading(false);
      }
    };
    fetchRecording();
  }, [shareCode]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Recording Not Found</h1>
          <p className="text-gray-500">
            {error || 'This recording link may have expired or been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {recording.meeting_title || 'Meeting Recording'}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {recording.start_time && <span>{formatDate(recording.start_time)}</span>}
              {recording.duration_ms != null && <span>{formatDuration(recording.duration_ms)}</span>}
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Shared via <span className="font-medium text-purple-600">Zenible</span>
          </div>
        </div>
      </div>

      {/* Video player */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-black rounded-lg overflow-hidden shadow-lg">
          <video
            controls
            autoPlay={false}
            className="w-full"
            src={recording.video_url}
          >
            Your browser does not support the video element.
          </video>
        </div>
      </div>
    </div>
  );
};

export default PublicRecordingPage;
