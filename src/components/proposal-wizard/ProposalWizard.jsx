import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NewSidebar from '../sidebar/NewSidebar';
import PlatformSelector from './PlatformSelector';
import JobPostSection from './JobPostSection';
import ProposalInput from './ProposalInput';
import AIFeedbackSection from './AIFeedbackSection';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useProposalAnalysis } from '../../hooks/useProposalAnalysis';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';

export default function ProposalWizard() {
  const { darkMode } = usePreferences();
  const [selectedPlatform, setSelectedPlatform] = useState('upwork');
  const [proposal, setProposal] = useState('');
  const [jobPost, setJobPost] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState(null);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [userFeatures, setUserFeatures] = useState(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);

  // Generate conversation ID using proper UUID format
  const conversationIdRef = useRef(uuidv4());

  // Use Proposal Analysis hook for proposal analysis
  const {
    isConnected,
    isAnalyzing: analyzing,
    isStreaming,
    streamingContent,
    analysis,
    structuredAnalysis,
    rawAnalysis,
    error: analysisError,
    metrics,
    usage,
    messageId,
    analyzeProposal: sendAnalysis,
    reset: resetAnalysis
  } = useProposalAnalysis({
    conversationId: conversationIdRef.current,
    characterId: selectedCharacterId,
    panelId: 'proposal_wizard',
    onAnalysisStarted: (data) => {
      console.log('Proposal analysis started:', data);
      setFeedback({
        isProcessing: true,
        score: null,
        analysis: null
      });
    },
    onStreamingStarted: (data) => {
      // Streaming started - UI will update automatically
    },
    onStreamingChunk: (data) => {
      // Chunk received - UI will update automatically
    },
    onAnalysisComplete: (data) => {
      console.log('Proposal analysis complete:', data);
      // Set feedback with structured analysis
      setFeedback({
        isProcessing: false,
        analysis: data.analysis,
        raw: data.analysis?.raw,
        structured: data.analysis?.structured,
        score: data.analysis?.structured?.score,
        usage: data.usage
      });
    },
    onError: (error) => {
      console.error('Proposal analysis error:', error);
      setFeedback({
        error: error.error || 'Analysis failed'
      });
    }
  });

  // Debug streaming state changes
  useEffect(() => {
    console.log('[ProposalWizard] Streaming state changed - isStreaming:', isStreaming, 'streamingContent length:', streamingContent?.length, 'analyzing:', analyzing);
    console.log('[ProposalWizard] streamingContent preview:', streamingContent?.substring(0, 200));
  }, [isStreaming, streamingContent, analyzing]);

  // Fetch user features on mount
  useEffect(() => {
    console.log('[ProposalWizard] Using conversation ID:', conversationIdRef.current);
    fetchUserFeatures();
  }, []);

  // Helper function to get character avatar URL from user features
  const getCharacterAvatarUrl = (characterId) => {
    console.log('[ProposalWizard] getCharacterAvatarUrl called with:', characterId);
    console.log('[ProposalWizard] userFeatures available:', !!userFeatures);
    console.log('[ProposalWizard] character_access:', userFeatures?.character_access);

    if (!userFeatures?.character_access || !characterId) {
      console.log('[ProposalWizard] Missing userFeatures or characterId');
      console.log('[ProposalWizard] userFeatures exists:', !!userFeatures);
      console.log('[ProposalWizard] character_access exists:', !!userFeatures?.character_access);
      console.log('[ProposalWizard] characterId:', characterId);
      return null;
    }

    console.log('[ProposalWizard] Looking for character with ID:', characterId);
    console.log('[ProposalWizard] Available characters:', userFeatures.character_access.map(char => ({
      id: char.character_id,
      name: char.character_name,
      hasAvatar: !!char.character_avatar_url
    })));

    const character = userFeatures.character_access.find(char => char.character_id === characterId);
    console.log('[ProposalWizard] Found character:', character);
    console.log('[ProposalWizard] Avatar URL:', character?.character_avatar_url);

    return character?.character_avatar_url || null;
  };

  const fetchUserFeatures = async () => {
    try {
      const features = await userAPI.getUserFeatures();
      console.log('User features response:', features);
      setUserFeatures(features);

      // After getting features, fetch available characters
      await fetchCharacters(features);
    } catch (error) {
      console.error('Failed to fetch user features:', error);
      // Still try to fetch characters even if features fail
      fetchCharacters();
    }
  };

  // Update avatar when userFeatures or selectedCharacterId changes
  useEffect(() => {
    console.log('[ProposalWizard] useEffect triggered - userFeatures:', !!userFeatures, 'selectedCharacterId:', selectedCharacterId);

    if (userFeatures && selectedCharacterId) {
      console.log('[ProposalWizard] Both userFeatures and selectedCharacterId available, updating avatar...');
      const avatarUrl = getCharacterAvatarUrl(selectedCharacterId);
      console.log('[ProposalWizard] Updating avatar URL from useEffect:', avatarUrl);
      setSelectedCharacterAvatar(avatarUrl);
    } else {
      console.log('[ProposalWizard] Missing userFeatures or selectedCharacterId - userFeatures:', !!userFeatures, 'selectedCharacterId:', selectedCharacterId);
    }
  }, [userFeatures, selectedCharacterId]);

  const fetchCharacters = async (features = null) => {
    try {
      setLoadingCharacters(true);
      const characters = await aiCharacterAPI.getProposalAnalysisCharacters();

      if (characters && characters.length > 0) {
        setAvailableCharacters(characters);
        // Select the first character by default
        const defaultChar = characters[0];
        console.log('[ProposalWizard] Selecting default character:', defaultChar);
        console.log('[ProposalWizard] Default character ID:', defaultChar.id);

        setSelectedCharacterId(defaultChar.id);
        setSelectedCharacterName(defaultChar.name || 'AI Assistant');

        // Use passed features or fall back to state
        const currentFeatures = features || userFeatures;
        if (currentFeatures?.character_access) {
          const character = currentFeatures.character_access.find(char => char.character_id === defaultChar.id);
          const avatarUrl = character?.character_avatar_url || null;
          console.log('[ProposalWizard] Setting avatar URL to:', avatarUrl);
          setSelectedCharacterAvatar(avatarUrl);
        } else {
          console.log('[ProposalWizard] No features available yet, avatar will be set by useEffect');
          setSelectedCharacterAvatar(null);
        }
      } else {
        setFeedback({ error: 'No AI characters available for proposal analysis' });
      }
    } catch (error) {
      console.error('Failed to fetch AI characters:', error);
      setFeedback({ error: 'Failed to load AI characters' });
    } finally {
      setLoadingCharacters(false);
    }
  };

  // Update character name and avatar when selection changes
  const handleCharacterChange = (characterId) => {
    setSelectedCharacterId(characterId);
    const character = availableCharacters.find(c => c.id === characterId);
    if (character) {
      setSelectedCharacterName(character.name || 'AI Assistant');
      setSelectedCharacterAvatar(getCharacterAvatarUrl(characterId));
    }
  };

  const handleAnalyze = async () => {
    if (!proposal.trim()) {
      setFeedback({ error: 'Please enter a proposal to analyze' });
      return;
    }


    if (!isConnected) {
      setFeedback({ error: 'Connecting to AI service... Please try again in a moment.' });
      // Try to reinitialize connection
      window.location.reload();
      return;
    }

    if (!selectedCharacterId) {
      setFeedback({ error: 'Please select an AI character' });
      return;
    }

    // Reset previous state
    resetAnalysis();
    setFeedback({
      isProcessing: true,
      score: null,
      analysis: null
    });

    // Send proposal for analysis
    const trackingId = sendAnalysis(
      jobPost || 'No job post provided',
      proposal,
      selectedPlatform,
      {
        timestamp: new Date().toISOString()
      }
    );

    if (!trackingId) {
      setFeedback({
        error: analysisError || 'Failed to analyze proposal. Please try again.'
      });
    }
  };

  return (
    <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`h-16 border-b ${
          darkMode
            ? 'bg-[#1a1a1a] border-[#333333]'
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between h-full px-4">
            <h1 className={`font-inter font-semibold text-xl sm:text-2xl ${
              darkMode ? 'text-white' : 'text-zinc-950'
            }`}>Proposal Wizard</h1>

            {/* Connection Status and Character Selector */}
            <div className="flex items-center gap-4">
              {/* Character Selector */}
              {!loadingCharacters && availableCharacters.length > 0 && (
                <select
                  value={selectedCharacterId || ''}
                  onChange={(e) => handleCharacterChange(e.target.value)}
                  className={`px-3 py-1 text-sm rounded-md border ${
                    darkMode
                      ? 'bg-[#2a2a2a] border-[#444] text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  disabled={analyzing}
                >
                  <option value="">Select AI Assistant</option>
                  {availableCharacters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`} />
                <span className={`text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <PlatformSelector
          darkMode={darkMode}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
        />

        {/* Content Section - Responsive grid */}
        <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
          <div className="p-2 sm:p-4 h-full">
            {/* Show error if feature is disabled */}
            {!featureEnabled && !loadingCharacters && (
              <div className={`p-6 rounded-lg text-center max-w-2xl mx-auto mt-8 ${
                darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                <h3 className="text-xl font-semibold mb-3">Feature Not Available</h3>
                <p className="text-base">The Proposal Wizard feature is not enabled for your account.</p>
                <p className="mt-2 text-sm opacity-80">Please contact support or upgrade your plan to access this feature.</p>
              </div>
            )}

            {/* Show content only if feature is enabled */}
            {featureEnabled && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 w-full h-full">
              {/* Left Column - Job Post & Proposal */}
              <div className="flex flex-col gap-2 sm:gap-4 w-full h-full min-h-0">
                <JobPostSection
                  darkMode={darkMode}
                  onJobPostChange={setJobPost}
                />
                <ProposalInput
                  darkMode={darkMode}
                  proposal={proposal}
                  setProposal={setProposal}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                />
              </div>

              {/* Right Column - AI Feedback */}
              <div className="w-full h-full min-h-0 lg:min-h-[400px]">
                <AIFeedbackSection
                  darkMode={darkMode}
                  feedback={feedback}
                  analyzing={analyzing}
                  isProcessing={feedback?.isProcessing}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                  structuredAnalysis={structuredAnalysis}
                  rawAnalysis={rawAnalysis}
                  metrics={metrics}
                  usage={usage}
                  conversationId={conversationIdRef.current}
                  messageId={messageId}
                  onCancel={resetAnalysis}
                  characterName={selectedCharacterName}
                  characterAvatarUrl={selectedCharacterAvatar}
                />
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}