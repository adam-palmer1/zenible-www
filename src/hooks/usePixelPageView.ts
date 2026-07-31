import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function usePixelPageView() {
  const location = useLocation();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // The base Meta Pixel snippet in index.html already fires the initial
    // PageView. Skip the first render so we don't double-count it.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [location.pathname, location.search]);
}
