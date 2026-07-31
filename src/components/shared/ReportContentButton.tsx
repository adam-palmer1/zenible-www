import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';

const REPORT_REASONS = [
  { value: 'illegal_content', label: 'Illegal content' },
  { value: 'copyright_infringement', label: 'Copyright / IP infringement' },
  { value: 'privacy_or_consent', label: 'Privacy violation / featured without consent' },
  { value: 'harmful_or_abusive', label: 'Harmful or abusive content' },
  { value: 'other', label: 'Other' },
];

interface ReportContentButtonProps {
  /** URL or identifier of the content being reported (defaults to current page URL) */
  contentUrl?: string;
  className?: string;
}

/**
 * "Report content" link + modal. Posts to the public /reports/content
 * endpoint (no auth required) so visitors of public share pages can
 * report suspicious, illegal, or infringing content.
 */
const ReportContentButton: React.FC<ReportContentButtonProps> = ({ contentUrl, className }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          content_url: contentUrl || window.location.href,
          details: details.trim(),
          reporter_email: email.trim() || null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'Failed to submit report');
      }
      setResult('success');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit report');
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'text-xs text-gray-400 hover:text-gray-600 underline'}
      >
        Report content
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            {result === 'success' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Report submitted</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Thank you. Your report has been received and will be reviewed by our
                  compliance team.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-zenible-primary text-white hover:opacity-90"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Report content</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Report suspicious, illegal, or infringing content. Reports go directly to
                  our compliance team.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                  maxLength={5000}
                  rows={4}
                  placeholder="Describe the issue…"
                  className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your email <span className="text-gray-400 font-normal">(optional, for follow-up)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {result === 'error' && (
                  <p className="text-sm text-red-600 mb-3">{errorMessage}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !details.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-zenible-primary text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportContentButton;
