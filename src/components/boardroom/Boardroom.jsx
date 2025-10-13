import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import NewSidebar from '../sidebar/NewSidebar';
import ExpertSidebar from './ExpertSidebar';
import BoardroomArea from './BoardroomArea';
import { usePreferences } from '../../contexts/PreferencesContext';
import aiCharacterAPI from '../../services/aiCharacterAPI';

export default function Boardroom() {
  const { darkMode } = usePreferences();
  const [characters, setCharacters] = useState([]);
  const [, setLoadingCharacters] = useState(true);
  const [selectedExperts, setSelectedExperts] = useState([]);

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoadingCharacters(true);
      const data = await aiCharacterAPI.getUserCharacters({
        per_page: 50 // Get more characters for variety
      });

      console.log('[Boardroom] Loaded characters:', data);
      setCharacters(data || []);
    } catch (error) {
      console.error('[Boardroom] Failed to load characters:', error);
      setCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  };

  // Handle expert drop
  const handleExpertDrop = (expert) => {
    // Check if expert is already selected
    const isAlreadySelected = selectedExperts.some(e => e.id === expert.id);

    if (!isAlreadySelected) {
      setSelectedExperts(prev => [...prev, expert]);
      console.log('[Boardroom] Expert added:', expert.name || expert.character_name);
    }
  };

  // Handle expert removal
  const handleExpertRemove = (expertId) => {
    setSelectedExperts(prev => prev.filter(e => e.id !== expertId));
    console.log('[Boardroom] Expert removed:', expertId);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-neutral-50'}`}>
        {/* Main Navigation Sidebar */}
        <NewSidebar />

        {/* Main Content Area with Expert Sidebar and Boardroom */}
        <div className="flex-1 flex ml-[280px]">
          <div className="flex-1 flex p-4 gap-3.5">
            {/* Expert Sidebar */}
            <ExpertSidebar
              characters={characters}
              loadingCharacters={loadingCharacters}
              darkMode={darkMode}
            />

            {/* Boardroom Drop Area */}
            <BoardroomArea
              selectedExperts={selectedExperts}
              onExpertDrop={handleExpertDrop}
              onExpertRemove={handleExpertRemove}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
