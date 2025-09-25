import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

function SidebarLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-design-page-bg dark:bg-black px-4 md:pr-5">
      <div className="flex flex-col md:flex-row gap-5 min-h-screen">
        <div
          className={`
          fixed md:relative top-0 left-0 h-screen md:h-auto md:mt-5 z-50 w-[80%] 
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isSidebarCollapsed ? "md:w-[80px]" : "md:w-[240px]"}
        `}
        >
          <div className="h-full md:h-auto md:rounded-xl overflow-hidden">
            <Sidebar 
              onClose={() => setIsSidebarOpen(false)} 
              onToggleCollapse={setIsSidebarCollapsed}
              isCollapsed={isSidebarCollapsed}
            />
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="fixed top-4 left-4 z-40 md:hidden bg-theme-primary border border-theme-primary p-2 rounded-lg shadow-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={`w-full transition-all duration-300 md:ml-5 ${isSidebarCollapsed ? "md:w-[calc(100%-80px-20px)]" : "md:w-[82%]"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default SidebarLayout;