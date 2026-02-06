import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import NewSidebar from '../sidebar/NewSidebar';
import PlatformSelector from './PlatformSelector';
import JobPostSection from './JobPostSection';
import ProposalInput from './ProposalInput';
import AIFeedbackSection from '../shared/AIFeedbackSection';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useProposalAnalysis } from '../../hooks/useProposalAnalysis';
import { WebSocketContext } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';
import { getCharacterTools } from '../../services/toolDiscoveryAPI';
import UsageLimitBadge from '../ui/UsageLimitBadge';

export default function ProposalWizard() {
  const { darkMode } = usePreferences();
  const { isAdmin } = useAuth();

  // State
  const [selectedPlatform, setSelectedPlatform] = useState('');
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
  const [characterTools, setCharacterTools] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [totalConversationPages, setTotalConversationPages] = useState(1);
  const [selectedHistoryConversation, setSelectedHistoryConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message pagination and filtering state
  const [messagePage, setMessagePage] = useState(1);
  const [totalMessagePages, setTotalMessagePages] = useState(1);
  const [messageFilter, setMessageFilter] = useState('');
  const [messageOrder, setMessageOrder] = useState('asc');

  // Get WebSocket context
  const {
    isConnected,
    sendMessage,
    onConversationEvent,
    conversationManager
  } = useContext(WebSocketContext);

  // Use Proposal Analysis hook
  const {
    conversationId,
    isAnalyzing: analyzing,
    isStreaming,
    streamingContent,
    analysis,
    structuredAnalysis,
    error: analysisError,
    metrics,
    messageId,
    analyzeProposal: sendAnalysis,
    generateProposal: sendGeneration,
    sendFollowUpMessage: sendFollowUp,
    reset: resetAnalysis,
    clearConversation
  } = useProposalAnalysis({
    characterId: selectedCharacterId,
    panelId: 'proposal_wizard',
    onAnalysisStarted: (data) => {
      setFeedback({
        isProcessing: true,
        score: null,
        analysis: null
      });
    },
    onAnalysisComplete: (data) => {
      // Set current feedback
      setFeedback({
        isProcessing: false,
        analysis: data.analysis,
        structured: data.analysis?.structured,
        raw: data.analysis?.raw,
        messageId: data.messageId,
        usage: data.usage,
        contentType: data.contentType
      });

      // Add to analysis history
      const newAnalysis = {
        role: 'assistant',
        type: 'analysis',
        content: data.analysis?.raw,
        structured: data.analysis?.structured,
        messageId: data.messageId,
        usage: data.usage,
        timestamp: new Date().toISOString()
      };
      setAnalysisHistory(prev => {
        const newHistory = [...prev, newAnalysis];
        return newHistory;
      });
    },
    onStreamingChunk: (data) => {
      // Optional: handle streaming chunks if needed
    },
    onError: (error) => {
      console.error('[ProposalWizard] Analysis error:', error);
      setFeedback({
        isProcessing: false,
        error: error.error || 'An error occurred during analysis'
      });
    }
  });

  // Setup follow-up message event handlers
  useEffect(() => {
    if (!conversationId || !onConversationEvent) return;

    const unsubscribers = [];

    // Handle follow-up message chunks
    unsubscribers.push(
      onConversationEvent(conversationId, 'chunk', (data) => {
        // Only handle non-tool responses (regular messages)
        if (!data.toolName) {
          setIsFollowUpStreaming(true);
          setFollowUpStreamingContent(data.fullContent || '');
        }
      })
    );

    // Handle follow-up message completion
    unsubscribers.push(
      onConversationEvent(conversationId, 'complete', (data) => {
        // Only handle non-tool responses (regular messages)
        if (!data.toolName) {
          setIsFollowUpStreaming(false);
          setFollowUpStreamingContent('');

          // Add completed message to follow-up messages
          setFollowUpMessages(prev => [...prev, {
            role: 'assistant',
            content: data.fullResponse,
            timestamp: new Date().toISOString(),
            messageId: data.messageId,
            usage: data.usage
          }]);
        }
      })
    );

    // Handle errors
    unsubscribers.push(
      onConversationEvent(conversationId, 'error', (data) => {
        console.error('[ProposalWizard] Follow-up error:', data);
        setIsFollowUpStreaming(false);
        setFollowUpStreamingContent('');
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [conversationId, onConversationEvent]);

  // Load user features
  useEffect(() => {
    const loadUserFeatures = async () => {
      try {
        const features = await userAPI.getCurrentUserFeatures();
        setUserFeatures(features);
        const isEnabled = features?.proposal_wizard?.enabled ?? true;
        setFeatureEnabled(isEnabled);
      } catch (error) {
        console.error('Failed to load user features:', error);
        setFeatureEnabled(true);
      }
    };

    loadUserFeatures();
  }, []);

  // Load AI characters
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoadingCharacters(true);

        // Get user features to see which characters are available for proposal wizard
        const userFeatures = await userAPI.getCurrentUserFeatures();
        const allowedCharacterNames = userFeatures?.system_features?.proposal_wizard_model || [];

        // Get all characters
        const characters = await aiCharacterAPI.getUserCharacters();

        // Filter characters based on what's allowed for proposal wizard
        // If no specific characters are defined, show all characters
        let proposalCharacters = characters;
        if (allowedCharacterNames.length > 0) {
          proposalCharacters = characters.filter(char =>
            allowedCharacterNames.includes(char.internal_name) ||
            allowedCharacterNames.includes(char.name.toLowerCase())
          );
        }

        setAvailableCharacters(proposalCharacters);

        if (proposalCharacters.length > 0 && !selectedCharacterId) {
          const defaultChar = proposalCharacters[0];
          setSelectedCharacterId(defaultChar.id);
          setSelectedCharacterName(defaultChar.name);
          setSelectedCharacterAvatar(defaultChar.avatar_url);
          setSelectedCharacterDescription(defaultChar.description || '');
        }
      } catch (error) {
        console.error('Failed to load AI characters:', error);

        // Fallback: if features endpoint fails, just load all characters
        try {
          const characters = await aiCharacterAPI.getUserCharacters();
          setAvailableCharacters(characters);

          if (characters.length > 0 && !selectedCharacterId) {
            const defaultChar = characters[0];
            setSelectedCharacterId(defaultChar.id);
            setSelectedCharacterName(defaultChar.name);
            setSelectedCharacterAvatar(defaultChar.avatar_url);
            setSelectedCharacterDescription(defaultChar.description);
          }
        } catch (fallbackError) {
          console.error('Failed to load characters even in fallback:', fallbackError);
          setAvailableCharacters([]);
        }
      } finally {
        setLoadingCharacters(false);
      }
    };

    loadCharacters();
  }, []);

  // Load character tools when character is selected
  useEffect(() => {
    const loadTools = async () => {
      if (!selectedCharacterId) return;

      try {
        const tools = await getCharacterTools(selectedCharacterId);
        setCharacterTools(tools);

        // Check if character has both required tools
        const hasAnalyzeTool = tools.available_tools?.some(
          tool => tool.name === 'analyze_proposal' && tool.is_enabled
        );
        const hasGenerateTool = tools.available_tools?.some(
          tool => tool.name === 'generate_proposal' && tool.is_enabled
        );

        if (!hasAnalyzeTool) {
          console.warn('[ProposalWizard] Character does not have analyze_proposal tool');
        }
        if (!hasGenerateTool) {
          console.warn('[ProposalWizard] Character does not have generate_proposal tool');
        }
      } catch (error) {
        console.error('[ProposalWizard] Failed to load character tools:', error);
      }
    };

    loadTools();
  }, [selectedCharacterId]);

  // Handle character selection
  const handleCharacterSelect = (character) => {
    setSelectedCharacterId(character.id);
    setSelectedCharacterName(character.name);
    setSelectedCharacterAvatar(character.avatar_url);
    setSelectedCharacterDescription(character.description || '');

    // Clear conversation when switching characters
    if (conversationId) {
      clearConversation();
      setFollowUpMessages([]);
      setFeedback(null);
    }
  };

  // Handle proposal analysis
  const handleAnalyze = async () => {
    if (!jobPost || !selectedCharacterId) {
      return;
    }

    if (!isConnected) {
      setFeedback({
        isProcessing: false,
        error: 'Not connected to server. Please refresh the page.'
      });
      return;
    }

    try {
      // Clear previous analysis (keep follow-up messages - they're part of conversation)
      setFeedback(null);
      setFollowUpStreamingContent('');

      // Conditional tool selection based on proposal content
      let convId;
      if (proposal && proposal.trim()) {
        // Analyze existing proposal
        convId = await sendAnalysis(
          jobPost,
          proposal,
          selectedPlatform || 'upwork'
        );
      } else {
        // Generate new proposal
        convId = await sendGeneration(
          jobPost,
          selectedPlatform || 'upwork'
        );
      }
    } catch (error) {
      setFeedback({
        isProcessing: false,
        error: 'Failed to process request. Please try again.'
      });
    }
  };

  // Handle follow-up message sending
  const handleSendFollowUpMessage = async (message) => {
    if (!conversationId || !selectedCharacterId) {
      throw new Error('Cannot send message - missing required data');
    }

    if (!isConnected) {
      throw new Error('Not connected to server');
    }

    try {
      // Send message using the hook
      // Note: User message is added to conversationHistory in AIFeedbackSection
      await sendFollowUp(message);
    } catch (error) {
      throw error;
    }
  };

  // Handle start again - reset all state
  const handleStartAgain = () => {
    // Reset all input state
    setJobPost('');
    setProposal('');
    setSelectedPlatform('');

    // Reset feedback and analysis state
    setFeedback(null);
    setFollowUpMessages([]);
    setFollowUpStreamingContent('');
    setIsFollowUpStreaming(false);
    setAnalysisHistory([]);

    // Reset conversation
    resetAnalysis();
  };

  // Load conversation history
  const loadConversations = async (page = 1) => {
    try {
      setLoadingConversations(true);
      const response = await userAPI.getUserConversations(
        'proposal_wizard',
        page,
        10
      );
      setConversations(response.items || []);
      setTotalConversationPages(response.total_pages || 1);
      setConversationPage(page);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages for selected conversation
  const loadConversationMessages = async (conversationId, page = 1) => {
    try {
      setLoadingMessages(true);
      const response = await userAPI.getConversationMessages(
        conversationId,
        page,
        20,
        messageFilter,
        messageOrder
      );
      setConversationMessages(response.items || []);
      setTotalMessagePages(response.total_pages || 1);
      setMessagePage(page);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle history modal open
  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    loadConversations(1);
  };

  // Handle conversation selection
  const handleSelectConversation = async (conv) => {
    setSelectedHistoryConversation(conv);
    setMessagePage(1);
    setMessageFilter('');
    setMessageOrder('asc');
    await loadConversationMessages(conv.id, 1);
  };

  // Handle loading conversation from history
  const handleLoadConversation = () => {
    if (selectedHistoryConversation && conversationMessages.length > 0) {
      // Find the initial job post and proposal from the messages
      const firstUserMessage = conversationMessages.find(msg => msg.role === 'user');
      const firstAnalysis = conversationMessages.find(msg =>
        msg.role === 'assistant' && msg.message_type === 'proposal_analysis'
      );

      if (firstUserMessage?.metadata?.job_post) {
        setJobPost(firstUserMessage.metadata.job_post);
      }
      if (firstUserMessage?.metadata?.proposal) {
        setProposal(firstUserMessage.metadata.proposal);
      }
      if (firstUserMessage?.metadata?.platform) {
        setSelectedPlatform(firstUserMessage.metadata.platform);
      }

      // Load the conversation messages as follow-ups
      const formattedMessages = conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        messageId: msg.id
      }));
      setFollowUpMessages(formattedMessages);

      // Close modal
      setShowHistoryModal(false);
    }
  };

  // Export conversation
  const handleExportConversation = async () => {
    if (!conversationId) return;

    try {
      const blob = await userAPI.exportConversation(conversationId, 'markdown');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-analysis-${conversationId}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting conversation:', error);
    }
  };

  return (
    <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        {/* Header */}
        <div className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 ${
          darkMode
            ? 'bg-[#1e1e1e] border-[#333333]'
            : 'bg-white border-neutral-200'
        }`}>
          <h1 className={`text-lg sm:text-xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Proposal Wizard
          </h1>

          <div className="flex items-center gap-2">
            {/* Usage Limit Badge */}
            <UsageLimitBadge
              characterId={selectedCharacterId}
              variant="compact"
              showUpgradeLink={true}
              darkMode={darkMode}
            />

            {/* Character Selector Dropdown */}
            {loadingCharacters ? (
              <div className={`text-sm px-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading...
              </div>
            ) : availableCharacters.length > 0 && (
              <select
                value={selectedCharacterId || ''}
                onChange={(e) => handleCharacterSelect(e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-zenible-primary'
                    : 'bg-gray-100 border-gray-200 text-gray-700 focus:border-zenible-primary'
                } focus:outline-none focus:ring-2 focus:ring-zenible-primary/20`}
              >
                {!selectedCharacterId && <option value="">Select AI...</option>}
                {availableCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            )}

            {conversationId && (
              <button
                onClick={handleExportConversation}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Export
              </button>
            )}
            <button
              onClick={handleOpenHistory}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Personalize AI Banner */}
        <div className="px-4 sm:px-6 pt-4">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row gap-4 p-4 sm:p-6">
            {/* Left Column - Input */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4 overflow-y-auto">
              <PlatformSelector
                darkMode={darkMode}
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                characterId={selectedCharacterId}
              />

              <JobPostSection
                darkMode={darkMode}
                jobPost={jobPost}
                setJobPost={setJobPost}
              />

              <ProposalInput
                darkMode={darkMode}
                proposal={proposal}
                setProposal={setProposal}
                jobPost={jobPost}
                analyzing={analyzing}
                onAnalyze={handleAnalyze}
                onStartAgain={handleStartAgain}
                hasResults={feedback && !feedback.isProcessing && !analyzing}
                isPanelReady={isConnected}
                isConnected={isConnected}
              />
            </div>

            {/* Right Column - AI Feedback */}
            <div className="w-full lg:w-1/2 h-full min-h-0 lg:min-h-[400px]">
              <AIFeedbackSection
                darkMode={darkMode}
                feedback={feedback}
                analyzing={analyzing}
                isProcessing={feedback?.isProcessing}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                structuredAnalysis={structuredAnalysis}
                rawAnalysis={analysis?.raw}
                metrics={metrics}
                usage={feedback?.usage}
                conversationId={conversationId}
                messageId={messageId}
                onCancel={resetAnalysis}
                onSendMessage={handleSendFollowUpMessage}
                characterId={selectedCharacterId}
                characterName={selectedCharacterName}
                characterAvatarUrl={selectedCharacterAvatar}
                characterDescription={selectedCharacterDescription}
                followUpMessages={followUpMessages}
                isFollowUpStreaming={isFollowUpStreaming}
                followUpStreamingContent={followUpStreamingContent}
                completionQuestions={
                  characterTools?.available_tools
                    ?.find(t => t.name === 'analyze_proposal')
                    ?.completion_questions || []
                }
                isAdmin={isAdmin}
                analysisHistory={analysisHistory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl flex flex-col ${
            darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              darkMode ? 'border-[#333333]' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Conversation History
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 ${
                  darkMode ? 'hover:bg-gray-700' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Conversations List */}
              <div className={`w-1/3 border-r overflow-y-auto ${
                darkMode ? 'border-[#333333]' : 'border-gray-200'
              }`}>
                {loadingConversations ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No conversations yet</div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 cursor-pointer border-b transition-colors ${
                        selectedHistoryConversation?.id === conv.id
                          ? darkMode
                            ? 'bg-gray-700'
                            : 'bg-gray-100'
                          : darkMode
                            ? 'hover:bg-gray-800'
                            : 'hover:bg-gray-50'
                      } ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}
                    >
                      <div className={`font-medium text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                      <div className={`text-xs mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {conv.message_count} messages
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination */}
                {totalConversationPages > 1 && (
                  <div className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => loadConversations(conversationPage - 1)}
                      disabled={conversationPage === 1}
                      className={`px-3 py-1 text-sm rounded ${
                        conversationPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      {conversationPage} / {totalConversationPages}
                    </span>
                    <button
                      onClick={() => loadConversations(conversationPage + 1)}
                      disabled={conversationPage === totalConversationPages}
                      className={`px-3 py-1 text-sm rounded ${
                        conversationPage === totalConversationPages
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 flex flex-col">
                {selectedHistoryConversation ? (
                  <>
                    {/* Message Filters */}
                    <div className={`p-4 border-b flex gap-2 ${
                      darkMode ? 'border-[#333333]' : 'border-gray-200'
                    }`}>
                      <select
                        value={messageFilter}
                        onChange={(e) => {
                          setMessageFilter(e.target.value);
                          loadConversationMessages(selectedHistoryConversation.id, 1);
                        }}
                        className={`px-3 py-1 text-sm rounded ${
                          darkMode
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="">All Messages</option>
                        <option value="user">User Only</option>
                        <option value="assistant">AI Only</option>
                      </select>
                      <select
                        value={messageOrder}
                        onChange={(e) => {
                          setMessageOrder(e.target.value);
                          loadConversationMessages(selectedHistoryConversation.id, 1);
                        }}
                        className={`px-3 py-1 text-sm rounded ${
                          darkMode
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="asc">Oldest First</option>
                        <option value="desc">Newest First</option>
                      </select>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {loadingMessages ? (
                        <div className="text-center">Loading messages...</div>
                      ) : conversationMessages.length === 0 ? (
                        <div className="text-center text-gray-500">No messages</div>
                      ) : (
                        <div className="space-y-4">
                          {conversationMessages.map((msg, idx) => (
                            <div key={msg.id || idx} className={`flex ${
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}>
                              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? darkMode
                                    ? 'bg-zenible-primary text-white'
                                    : 'bg-zenible-primary text-white'
                                  : darkMode
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-100 text-gray-900'
                              }`}>
                                <div className="text-sm">
                                  {msg.content.length > 500 ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {msg.content.substring(0, 500) + '...'}
                                    </ReactMarkdown>
                                  ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {msg.content}
                                    </ReactMarkdown>
                                  )}
                                </div>
                                <div className={`text-xs mt-1 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {new Date(msg.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Pagination */}
                      {totalMessagePages > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                          <button
                            onClick={() => loadConversationMessages(
                              selectedHistoryConversation.id,
                              messagePage - 1
                            )}
                            disabled={messagePage === 1}
                            className={`px-3 py-1 text-sm rounded ${
                              messagePage === 1
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm">
                            {messagePage} / {totalMessagePages}
                          </span>
                          <button
                            onClick={() => loadConversationMessages(
                              selectedHistoryConversation.id,
                              messagePage + 1
                            )}
                            disabled={messagePage === totalMessagePages}
                            className={`px-3 py-1 text-sm rounded ${
                              messagePage === totalMessagePages
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Load Button */}
                    <div className={`p-4 border-t ${
                      darkMode ? 'border-[#333333]' : 'border-gray-200'
                    }`}>
                      <button
                        onClick={handleLoadConversation}
                        className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Load This Conversation
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a conversation to view messages
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