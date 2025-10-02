import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NewSidebar from '../sidebar/NewSidebar';
import PlatformSelector from './PlatformSelector';
import JobPostSection from './JobPostSection';
import ProposalInput from './ProposalInput';
import AIFeedbackSection from './AIFeedbackSection';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useProposalAnalysis } from '../../hooks/useProposalAnalysis';
import { useWebSocketConnection } from '../../hooks/useWebSocketConnection';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';

export default function ProposalWizard() {
  const componentIdRef = useRef(`ProposalWizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    console.log('[ProposalWizard] COMPONENT MOUNTED:', {
      componentId: componentIdRef.current,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('[ProposalWizard] COMPONENT UNMOUNTING:', {
        componentId: componentIdRef.current,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack
      });
    };
  }, []);

  const { darkMode } = usePreferences();
  const [selectedPlatform, setSelectedPlatform] = useState(''); // Will be set by PlatformSelector
  const [proposal, setProposal] = useState('');
  const [jobPost, setJobPost] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState(null);
  const [selectedCharacterDescription, setSelectedCharacterDescription] = useState('');
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [userFeatures, setUserFeatures] = useState(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [followUpMessages, setFollowUpMessages] = useState([]);
  const [isFollowUpStreaming, setIsFollowUpStreaming] = useState(false);
  const [followUpStreamingContent, setFollowUpStreamingContent] = useState('');

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [totalConversationPages, setTotalConversationPages] = useState(1);
  const [selectedHistoryConversation, setSelectedHistoryConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Generate conversation ID using proper UUID format
  const conversationIdRef = useRef(uuidv4());

  // Get WebSocket connection for sending follow-up messages
  const { sendMessage, streamingManager, joinPanel, leavePanel } = useWebSocketConnection();

  // Use Proposal Analysis hook for proposal analysis
  const {
    isConnected,
    isPanelReady,
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
    reset: resetAnalysis,
    cancelAnalysis
  } = useProposalAnalysis({
    conversationId: conversationIdRef.current,
    characterId: selectedCharacterId,
    panelId: 'proposal_wizard',
    onAnalysisStarted: (data) => {
      setFeedback({
        isProcessing: true,
        score: null,
        analysis: null
      });
    },
    onStreamingStarted: (data) => {
      // Hide the typing indicator when streaming begins
      setFeedback(prev => ({
        ...prev,
        isProcessing: false
      }));
    },
    onStreamingChunk: (data) => {
      // Chunk received - UI will update automatically
    },
    onAnalysisComplete: (data) => {
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
      setFeedback({
        error: error.error || 'Analysis failed'
      });
    }
  });

  // Fetch user features on mount
  useEffect(() => {
    fetchUserFeatures();
  }, []);

  // Setup event listeners for follow-up conversation messages
  useEffect(() => {
    if (!streamingManager) return;

    const panelId = 'proposal_wizard';
    const unsubscribers = [];

    // Listen for AI processing start
    const processingSub = streamingManager.onPanelEvent(panelId, 'processing', (data) => {
      console.log('[ProposalWizard] Follow-up processing started:', data);
      setIsFollowUpStreaming(true);
      setFollowUpStreamingContent('');
    });
    unsubscribers.push(processingSub);

    // Listen for streaming start
    const streamingStartSub = streamingManager.onPanelEvent(panelId, 'streaming_start', (data) => {
      console.log('[ProposalWizard] Follow-up streaming started:', data);
      setIsFollowUpStreaming(true);
      setFollowUpStreamingContent('');
    });
    unsubscribers.push(streamingStartSub);

    // Listen for streaming chunks
    const chunkSub = streamingManager.onPanelEvent(panelId, 'chunk', (data) => {
      console.log('[ProposalWizard] Follow-up chunk received:', data.chunk);
      setFollowUpStreamingContent(data.content || '');
    });
    unsubscribers.push(chunkSub);

    // Listen for streaming complete
    const completeSub = streamingManager.onPanelEvent(panelId, 'streaming_complete', (data) => {
      console.log('[ProposalWizard] Follow-up streaming complete:', data);
      setIsFollowUpStreaming(false);

      // Add AI message to history
      setFollowUpMessages(prev => [...prev, {
        role: 'assistant',
        content: data.fullResponse || data.content || '',
        messageId: data.messageId,
        timestamp: data.timestamp || new Date().toISOString()
      }]);

      setFollowUpStreamingContent('');
    });
    unsubscribers.push(completeSub);

    // Listen for errors
    const errorSub = streamingManager.onPanelEvent(panelId, 'ai_error', (data) => {
      console.error('[ProposalWizard] Follow-up error:', data);
      setIsFollowUpStreaming(false);
      setFollowUpStreamingContent('');
    });
    unsubscribers.push(errorSub);

    console.log('[ProposalWizard] Event listeners registered for follow-up messages');

    // Cleanup
    return () => {
      console.log('[ProposalWizard] Cleaning up follow-up message event listeners');
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [streamingManager]);

  // Fetch conversations when history modal opens
  useEffect(() => {
    if (showHistoryModal) {
      fetchConversations();
    }
  }, [showHistoryModal]);

  // Helper function to get character avatar URL from user features
  const getCharacterAvatarUrl = (characterId) => {
    if (!userFeatures?.character_access || !characterId) {
      return null;
    }

    const character = userFeatures.character_access.find(char => char.character_id === characterId);
    return character?.character_avatar_url || null;
  };

  const fetchUserFeatures = async () => {
    try {
      const features = await userAPI.getUserFeatures();
      setUserFeatures(features);

      // After getting features, fetch available characters
      await fetchCharacters(features);
    } catch (error) {
      // Still try to fetch characters even if features fail
      fetchCharacters();
    }
  };

  // Update avatar when userFeatures or selectedCharacterId changes
  useEffect(() => {
    if (userFeatures && selectedCharacterId) {
      const avatarUrl = getCharacterAvatarUrl(selectedCharacterId);
      setSelectedCharacterAvatar(avatarUrl);
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
        setSelectedCharacterId(defaultChar.id);
        setSelectedCharacterName(defaultChar.name || 'AI Assistant');
        setSelectedCharacterDescription(defaultChar.description || '');

        // Use passed features or fall back to state
        const currentFeatures = features || userFeatures;
        if (currentFeatures?.character_access) {
          const character = currentFeatures.character_access.find(char => char.character_id === defaultChar.id);
          const avatarUrl = character?.character_avatar_url || null;
          setSelectedCharacterAvatar(avatarUrl);
        } else {
          setSelectedCharacterAvatar(null);
        }
      } else {
        setFeedback({ error: 'No AI characters available for proposal analysis' });
      }
    } catch (error) {
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
      setSelectedCharacterDescription(character.description || '');
      setSelectedCharacterAvatar(getCharacterAvatarUrl(characterId));
    }
  };

  const handleAnalyze = async () => {
    console.log('[ProposalWizard] handleAnalyze CALLED:', {
      componentId: componentIdRef.current,
      hasProposal: !!proposal.trim(),
      selectedPlatform,
      isConnected,
      isPanelReady,
      selectedCharacterId,
      conversationId: conversationIdRef.current
    });

    if (!proposal.trim()) {
      console.log('[ProposalWizard] Analyze failed: No proposal');
      setFeedback({ error: 'Please enter a proposal to analyze' });
      return;
    }

    if (!selectedPlatform) {
      console.log('[ProposalWizard] Analyze failed: No platform');
      setFeedback({ error: 'Please select a platform' });
      return;
    }

    if (!isConnected) {
      console.log('[ProposalWizard] Analyze failed: Not connected');
      setFeedback({ error: 'Connecting to AI service... Please try again in a moment.' });
      // Try to reinitialize connection
      window.location.reload();
      return;
    }

    if (!selectedCharacterId) {
      console.log('[ProposalWizard] Analyze failed: No character selected');
      setFeedback({ error: 'Please select an AI character' });
      return;
    }

    console.log('[ProposalWizard] All validations passed, sending analysis...');

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

    console.log('[ProposalWizard] sendAnalysis returned trackingId:', {
      trackingId,
      analysisError
    });

    if (!trackingId) {
      setFeedback({
        error: analysisError || 'Failed to analyze proposal. Please try again.'
      });
    }
  };

  // Fetch user conversations for history modal
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const params = {
        page: conversationPage,
        per_page: 20,
        order_by: 'created_at',
        order_dir: 'desc'
      };

      const response = await userAPI.getUserConversations(params);
      setConversations(response.conversations || response.items || []);
      setTotalConversationPages(response.total_pages || Math.ceil((response.total || 0) / 20) || 1);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load conversation messages
  const loadConversationMessages = async (conversation) => {
    setSelectedHistoryConversation(conversation);
    setLoadingMessages(true);
    setConversationMessages([]);

    try {
      const details = await userAPI.getUserConversation(conversation.id);
      setConversationMessages(details.messages || []);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Export conversation
  const exportConversation = async (conversationId, format) => {
    try {
      await userAPI.exportUserConversation(conversationId, format);
    } catch (error) {
      console.error('Error exporting conversation:', error);
    }
  };

  const handleSendFollowUpMessage = async (message) => {
    if (!sendMessage || !selectedCharacterId || !conversationIdRef.current) {
      console.error('[ProposalWizard] Cannot send message - missing data:', {
        hasSendMessage: !!sendMessage,
        characterId: selectedCharacterId,
        conversationId: conversationIdRef.current
      });
      throw new Error('Cannot send message - missing required data');
    }

    try {
      // Ensure panel is ready before sending message
      if (!isPanelReady && streamingManager && joinPanel) {
        console.log('[ProposalWizard] Panel not ready, joining panel first...');
        try {
          await joinPanel('proposal_wizard', conversationIdRef.current);
          console.log('[ProposalWizard] Panel joined successfully');
        } catch (joinError) {
          console.error('[ProposalWizard] Failed to join panel:', joinError);
          // Continue anyway - panel might already exist
        }
      }

      console.log('[ProposalWizard] Sending follow-up message:', {
        message,
        characterId: selectedCharacterId,
        conversationId: conversationIdRef.current,
        panelId: 'proposal_wizard',
        isPanelReady
      });

      // Send follow-up message using WebSocket
      // This uses the start_ai_conversation event via sendMessage
      const trackingId = sendMessage(
        'proposal_wizard', // panelId
        message,
        {
          characterId: selectedCharacterId,
          conversationId: conversationIdRef.current,
          messageType: 'follow_up'
        }
      );

      console.log('[ProposalWizard] Message sent, tracking ID:', trackingId);

      if (!trackingId) {
        console.error('[ProposalWizard] Failed to get tracking ID - panel may not exist');
      }

      return trackingId;
    } catch (error) {
      console.error('[ProposalWizard] Error sending message:', error);
      throw error;
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

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* History Button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  darkMode
                    ? 'bg-[#2a2a2a] border-[#444] text-white hover:bg-[#3a3a3a]'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
                title="View conversation history"
              >
                History
              </button>

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
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <PlatformSelector
          darkMode={darkMode}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          characterId={selectedCharacterId}
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
                  isPanelReady={isPanelReady}
                  isConnected={isConnected}
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
                  onCancel={isStreaming ? cancelAnalysis : resetAnalysis}
                  onSendMessage={handleSendFollowUpMessage}
                  characterId={selectedCharacterId}
                  characterName={selectedCharacterName}
                  characterAvatarUrl={selectedCharacterAvatar}
                  characterDescription={selectedCharacterDescription}
                  followUpMessages={followUpMessages}
                  isFollowUpStreaming={isFollowUpStreaming}
                  followUpStreamingContent={followUpStreamingContent}
                />
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-6xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Conversation History
              </h2>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedHistoryConversation(null);
                  setConversationMessages([]);
                }}
                className={`text-2xl font-light ${darkMode ? 'text-zenible-dark-text hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ×
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Conversation List */}
              <div className={`w-1/3 border-r overflow-auto ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      Your Conversations
                    </h3>
                    <button
                      onClick={fetchConversations}
                      className={`px-2 py-1 text-xs rounded ${
                        darkMode
                          ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingConversations ? (
                    <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-500'}`}>
                      Loading conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-500'}`}>
                      No conversations found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => loadConversationMessages(conversation)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedHistoryConversation?.id === conversation.id
                              ? (darkMode ? 'bg-[#3a3a3a]' : 'bg-blue-50')
                              : (darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50')
                          }`}
                        >
                          <div className={`font-medium text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {conversation.character_name || 'AI Assistant'}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {conversation.platform && `${conversation.platform} • `}
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {conversation.message_count || 0} messages
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalConversationPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
                      <button
                        onClick={() => {
                          setConversationPage(prev => Math.max(1, prev - 1));
                          fetchConversations();
                        }}
                        disabled={conversationPage <= 1}
                        className={`px-3 py-1 text-sm rounded ${
                          conversationPage <= 1
                            ? (darkMode ? 'text-gray-600' : 'text-gray-400')
                            : (darkMode ? 'text-white hover:bg-[#2a2a2a]' : 'text-gray-700 hover:bg-gray-100')
                        }`}
                      >
                        Previous
                      </button>
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-600'}`}>
                        Page {conversationPage} of {totalConversationPages}
                      </span>
                      <button
                        onClick={() => {
                          setConversationPage(prev => Math.min(totalConversationPages, prev + 1));
                          fetchConversations();
                        }}
                        disabled={conversationPage >= totalConversationPages}
                        className={`px-3 py-1 text-sm rounded ${
                          conversationPage >= totalConversationPages
                            ? (darkMode ? 'text-gray-600' : 'text-gray-400')
                            : (darkMode ? 'text-white hover:bg-[#2a2a2a]' : 'text-gray-700 hover:bg-gray-100')
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Details */}
              <div className="flex-1 flex flex-col">
                {selectedHistoryConversation ? (
                  <>
                    {/* Conversation Header */}
                    <div className={`p-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {selectedHistoryConversation.character_name || 'AI Assistant'}
                          </h4>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedHistoryConversation.platform && `${selectedHistoryConversation.platform} • `}
                            {new Date(selectedHistoryConversation.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => exportConversation(selectedHistoryConversation.id, 'json')}
                            className={`px-2 py-1 text-xs rounded ${
                              darkMode
                                ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Export JSON
                          </button>
                          <button
                            onClick={() => exportConversation(selectedHistoryConversation.id, 'txt')}
                            className={`px-2 py-1 text-xs rounded ${
                              darkMode
                                ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Export TXT
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-auto p-4">
                      {loadingMessages ? (
                        <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-500'}`}>
                          Loading messages...
                        </div>
                      ) : conversationMessages.length === 0 ? (
                        <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-500'}`}>
                          No messages found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {conversationMessages.map((message, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg ${
                                message.role === 'user'
                                  ? (darkMode ? 'bg-blue-600/20 ml-8' : 'bg-blue-50 ml-8')
                                  : (darkMode ? 'bg-[#2a2a2a] mr-8' : 'bg-gray-50 mr-8')
                              }`}
                            >
                              <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {message.role === 'user' ? 'You' : selectedHistoryConversation.character_name || 'AI Assistant'}
                                {message.timestamp && (
                                  <span className="ml-2">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={`flex-1 flex items-center justify-center ${darkMode ? 'text-zenible-dark-text' : 'text-gray-500'}`}>
                    <div className="text-center">
                      <div className="text-lg mb-2">Select a conversation</div>
                      <div className="text-sm">Choose a conversation from the list to view its messages</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}