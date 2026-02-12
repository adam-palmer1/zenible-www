import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';

interface SidebarContextValue {
  /* Desktop collapse */
  isCollapsed: boolean;
  toggleCollapse: () => void;

  /* Mobile drawer */
  isMobile: boolean;
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => setIsCollapsed((p) => !p), []);
  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((p) => !p), []);

  // Set --sidebar-width CSS variable
  useEffect(() => {
    const width = isMobile ? '0px' : isCollapsed ? '64px' : '280px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [isMobile, isCollapsed]);

  // Auto-close mobile drawer when crossing to desktop
  useEffect(() => {
    if (!isMobile) setIsMobileOpen(false);
  }, [isMobile]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) setIsMobileOpen(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        isMobile,
        isMobileOpen,
        openMobile,
        closeMobile,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
