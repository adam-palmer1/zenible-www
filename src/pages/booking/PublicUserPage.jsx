import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import publicBookingAPI from '../../services/api/public/booking';

const PublicUserPage = () => {
  const { username } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await publicBookingAPI.getUserPage(username);
        setPageData(data);
      } catch (err) {
        console.error('Error fetching user page:', err);
        if (err.status === 404) {
          setError('User not found');
        } else if (err.status === 403) {
          setError('Booking page is not available');
        } else {
          setError(err.message || 'Failed to load booking page');
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPageData();
    }
  }, [username]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error === 'User not found' ? 'Page Not Found' : 'Unavailable'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error === 'User not found'
              ? "The booking page you're looking for doesn't exist."
              : error}
          </p>
          <a
            href={import.meta.env.VITE_HOME_URL || '/'}
            className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const { host, call_types } = pageData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Host Info */}
        <div className="text-center mb-10">
          {host.avatar_url ? (
            <img
              src={host.avatar_url}
              alt={host.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-zenible-primary text-white flex items-center justify-center text-3xl font-bold">
              {host.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {host.name}
          </h1>
          {host.bio && (
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {host.bio}
            </p>
          )}
        </div>

        {/* Call Types */}
        {call_types.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No booking options available at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Schedule a call
            </h2>
            {call_types.map((callType) => (
              <Link
                key={callType.id}
                to={`/book/${username}/${callType.shortcode}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-zenible-primary dark:hover:border-zenible-primary transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {callType.color && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: callType.color }}
                        />
                      )}
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-zenible-primary transition-colors">
                        {callType.name}
                      </h3>
                    </div>
                    {callType.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {callType.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      <span>{callType.duration_minutes} minutes</span>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-zenible-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Powered by{' '}
            <a href={import.meta.env.VITE_HOME_URL || '/'} className="hover:text-zenible-primary transition-colors">
              Zenible
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicUserPage;
