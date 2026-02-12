import NetworkErrorOverlay from './NetworkErrorOverlay';

/**
 * QA-accessible page at /network-error that renders the branded
 * network error overlay without requiring an actual offline state.
 */
export default function NetworkErrorPage() {
  return (
    <NetworkErrorOverlay
      onTryAgain={() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/dashboard';
        }
      }}
    />
  );
}
