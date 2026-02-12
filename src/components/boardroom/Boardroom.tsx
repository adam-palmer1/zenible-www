import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AppLayout from '../layout/AppLayout';
import ExpertSidebar from './ExpertSidebar';
import BoardroomArea from './BoardroomArea';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import { usePreferences } from '../../contexts/PreferencesContext';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import { useMobile } from '../../hooks/useMobile';
import { Menu } from 'lucide-react';

export default function Boardroom() {
  const { darkMode } = usePreferences();
  const isMobile = useMobile();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [selectedExperts, setSelectedExperts] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoadingCharacters(true);
      const data = await aiCharacterAPI.getUserCharacters({
        per_page: '50' // Get more characters for variety
      });

      setCharacters(data || []);
    } catch (error) {
      console.error('[Boardroom] Failed to load characters:', error);
      setCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  };

  // Handle expert drop
  const handleExpertDrop = (expert: any) => {
    // Check if expert is already selected
    const isAlreadySelected = selectedExperts.some(e => e.id === expert.id);

    if (!isAlreadySelected) {
      setSelectedExperts(prev => [...prev, expert]);
    }
  };

  // Handle expert removal
  const handleExpertRemove = (expertId: string) => {
    setSelectedExperts(prev => prev.filter(e => e.id !== expertId));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <AppLayout pageTitle="Boardroom">
        {/* Personalize AI Banner */}
        <div className="px-4 pt-4">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        <div className="flex-1 flex p-4 gap-3.5 relative">
          {/* Mobile: Toggle button for sidebar */}
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`fixed bottom-6 left-6 z-30 p-4 rounded-full shadow-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                  : 'bg-white text-gray-900 hover:bg-gray-50 border border-neutral-200'
              }`}
              aria-label="Open experts sidebar"
            >
              <Menu size={24} />
            </button>
          )}

          {/* Expert Sidebar */}
          <ExpertSidebar
            characters={characters}
            loadingCharacters={loadingCharacters}
            darkMode={darkMode}
            isOpen={isMobile ? isSidebarOpen : true}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Boardroom Drop Area */}
          <BoardroomArea
            selectedExperts={selectedExperts}
            onExpertDrop={handleExpertDrop}
            onExpertRemove={handleExpertRemove}
            darkMode={darkMode}
          />
        </div>
      </AppLayout>
    </DndProvider>
  );
}
