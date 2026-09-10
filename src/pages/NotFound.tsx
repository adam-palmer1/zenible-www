import { useEffect, useState } from 'react';
import { zenibleDark, zenibleLight } from '../assets/logos';

/**
 * Branded 404 page.
 *
 * Rendered both as the router's catch-all (`path: '*'`) and, via
 * RouteErrorBoundary, when the router throws a 404 — replacing React Router's
 * default "Unexpected Application Error!" developer screen.
 *
 * Deliberately depends on no context: as an errorElement it renders *instead
 * of* RootLayout, so the app's providers are not mounted around it. Theme is
 * read from the `dark` class on <html> for the same reason.
 */

/** Tracks the `dark` class on <html>, which PreferencesContext toggles. */
export function useIsDarkMode(): boolean {
  const [isDarkMode, setIsDarkMode] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const sync = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDarkMode;
}

interface NotFoundProps {
  /** Heading text; overridden for non-404 routing errors. */
  title?: string;
}

export default function NotFound({ title = '404 - This page could not be found.' }: NotFoundProps) {
  const isDarkMode = useIsDarkMode();

  // The marketing site, not an in-app route — so a plain anchor, not <Link>.
  const homeUrl = import.meta.env.VITE_HOME_URL || 'https://www.zenible.com';

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6 ${
        isDarkMode ? 'bg-[#0c111d]' : 'bg-[#fafafa]'
      }`}
    >
      <img
        alt="Zenible"
        src={isDarkMode ? zenibleLight : zenibleDark}
        className="h-[40px] w-auto mb-10"
      />

      <h1
        className={`font-inter font-bold text-2xl text-center text-balance max-w-md mb-8 ${
          isDarkMode ? 'text-[#ededf0]' : 'text-zinc-950'
        }`}
      >
        {title}
      </h1>

      <a
        href={homeUrl}
        className="font-inter font-medium text-base px-8 py-3 rounded-lg text-white bg-[#8e51ff] hover:bg-[#7a3ef0] active:bg-[#6b31d9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8e51ff] focus-visible:ring-offset-2"
      >
        Go Home
      </a>
    </div>
  );
}
