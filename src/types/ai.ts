/**
 * AI, Conversations, Events, and Content types.
 * Convenience re-exports from OpenAPI generated types.
 */
import type { components } from './api.generated';

// ──────────────────────────────────────────────
// AI Characters
// ──────────────────────────────────────────────

export type BackendProvider = components['schemas']['BackendProvider'];
export type AICharacterResponse = components['schemas']['AICharacterResponse'];
export type AICharacterDetailResponse = components['schemas']['AICharacterDetailResponse'];
export type AICharacterCreate = components['schemas']['AICharacterCreate'];
export type AICharacterUpdate = components['schemas']['AICharacterUpdate'];
export type AICharacterList = components['schemas']['AICharacterList'];
export type AICharacterUsage = components['schemas']['AICharacterUsage'];
export type CharacterUsageStats = components['schemas']['CharacterUsageStats'];

// Character Categories
export type AICharacterCategoryResponse = components['schemas']['AICharacterCategoryResponse'];
export type AICharacterCategoryCreate = components['schemas']['AICharacterCategoryCreate'];
export type AICharacterCategoryUpdate = components['schemas']['AICharacterCategoryUpdate'];
export type AICharacterCategoryList = components['schemas']['AICharacterCategoryList'];

// Character Platforms
export type CharacterPlatformConfigResponse = components['schemas']['CharacterPlatformConfigResponse'];
export type CharacterPlatformConfigCreate = components['schemas']['CharacterPlatformConfigCreate'];
export type CharacterPlatformConfigUpdate = components['schemas']['CharacterPlatformConfigUpdate'];
export type CharacterPlatformConfigListResponse = components['schemas']['CharacterPlatformConfigListResponse'];

// Assistant Sync
export type AssistantSyncRequest = components['schemas']['AssistantSyncRequest'];
export type AssistantSyncResponse = components['schemas']['AssistantSyncResponse'];
export type ShortcodeListResponse = components['schemas']['ShortcodeListResponse'];
export type ShortcodeInfo = components['schemas']['ShortcodeInfo'];

// ──────────────────────────────────────────────
// AI Tools
// ──────────────────────────────────────────────

export type AITool = components['schemas']['AITool'];
export type AIToolCreate = components['schemas']['AIToolCreate'];
export type AIToolUpdate = components['schemas']['AIToolUpdate'];

// Character Tool Instructions
export type AICharacterToolInstructions = components['schemas']['AICharacterToolInstructions'];
export type AICharacterToolInstructionsCreate = components['schemas']['AICharacterToolInstructionsCreate'];
export type AICharacterToolInstructionsUpdate = components['schemas']['AICharacterToolInstructionsUpdate'];
export type AICharacterToolInstructionsWithQuestions = components['schemas']['AICharacterToolInstructionsWithQuestions'];
export type AICharacterToolInstructionsWithTool = components['schemas']['AICharacterToolInstructionsWithTool'];
export type CharacterToolsListResponse = components['schemas']['CharacterToolsListResponse'];

// Completion Questions
export type CompletionQuestion = components['schemas']['CompletionQuestion'];
export type CompletionQuestionBase = components['schemas']['CompletionQuestionBase'];
export type CompletionQuestionCreate = components['schemas']['CompletionQuestionCreate'];
export type CompletionQuestionUpdate = components['schemas']['CompletionQuestionUpdate'];
export type CompletionQuestionBulkCreate = components['schemas']['CompletionQuestionBulkCreate'];

// ──────────────────────────────────────────────
// Conversations & Messages
// ──────────────────────────────────────────────

export type ConversationResponse = components['schemas']['ConversationResponse'];
export type ConversationDetailResponse = components['schemas']['ConversationDetailResponse'];
export type ConversationCreate = components['schemas']['ConversationCreate'];
export type ConversationUpdate = components['schemas']['ConversationUpdate'];
export type ConversationList = components['schemas']['ConversationList'];
export type ConversationExport = components['schemas']['ConversationExport'];
export type ConversationParticipantResponse = components['schemas']['ConversationParticipantResponse'];
export type SenderType = components['schemas']['SenderType'];

export type MessageResponse = components['schemas']['MessageResponse'];
export type MessageDetailResponse = components['schemas']['MessageDetailResponse'];
export type MessageCreate = components['schemas']['MessageCreate'];
export type MessageUpdate = components['schemas']['MessageUpdate'];
export type MessageList = components['schemas']['MessageList'];
export type MessageRating = components['schemas']['MessageRating'];

// Threads
export type ThreadResponse = components['schemas']['ThreadResponse'];
export type ThreadDBResponse = components['schemas']['ThreadDBResponse'];
export type ThreadCreateRequest = components['schemas']['ThreadCreateRequest'];
export type ThreadList = components['schemas']['ThreadList'];
export type ThreadStatus = components['schemas']['ThreadStatus'];

// AI Usage
export type AIUsageSummary = components['schemas']['AIUsageSummary'];
export type AIUsageTotals = components['schemas']['AIUsageTotals'];

// Chat
export type AssistantChatRequest = components['schemas']['AssistantChatRequest'];
export type AssistantChatResponse = components['schemas']['AssistantChatResponse'];

// ──────────────────────────────────────────────
// OpenAI Models
// ──────────────────────────────────────────────

export type OpenAIModelResponse = components['schemas']['OpenAIModelResponse'];
export type OpenAIModelUpdate = components['schemas']['OpenAIModelUpdate'];
export type OpenAIModelSync = components['schemas']['OpenAIModelSync'];
export type OpenAIModelSyncResponse = components['schemas']['OpenAIModelSyncResponse'];
export type OpenAIModelList = components['schemas']['OpenAIModelList'];
export type OpenAIModelCapabilities = components['schemas']['OpenAIModelCapabilities'];
export type OpenAIModelPricing = components['schemas']['OpenAIModelPricing'];
export type AvailableModelsResponse = components['schemas']['AvailableModelsResponse'];

// ──────────────────────────────────────────────
// Platforms
// ──────────────────────────────────────────────

export type PlatformResponse = components['schemas']['PlatformResponse'];
export type PlatformCreate = components['schemas']['PlatformCreate'];
export type PlatformUpdate = components['schemas']['PlatformUpdate'];
export type PlatformListResponse = components['schemas']['PlatformListResponse'];
export type PlatformInstructionsRequest = components['schemas']['PlatformInstructionsRequest'];
export type PlatformInstructionsResponse = components['schemas']['PlatformInstructionsResponse'];

// ──────────────────────────────────────────────
// Tips
// ──────────────────────────────────────────────

export type Tip = components['schemas']['Tip'];
export type TipCreate = components['schemas']['TipCreate'];
export type TipUpdate = components['schemas']['TipUpdate'];
export type TipListResponse = components['schemas']['TipListResponse'];
export type TipWithCharacter = components['schemas']['TipWithCharacter'];
export type TipBulkCreate = components['schemas']['TipBulkCreate'];
export type TipBulkAction = components['schemas']['TipBulkAction'];
export type TipAnalytics = components['schemas']['TipAnalytics'];
export type TipAnalyticsResponse = components['schemas']['TipAnalyticsResponse'];
export type TipEngagementStats = components['schemas']['TipEngagementStats'];
export type RandomTipResponse = components['schemas']['RandomTipResponse'];

// ──────────────────────────────────────────────
// Customization Questions
// ──────────────────────────────────────────────

export type CustomizationQuestionResponse = components['schemas']['CustomizationQuestionResponse'];
export type CustomizationQuestionCreate = components['schemas']['CustomizationQuestionCreate'];
export type CustomizationQuestionUpdate = components['schemas']['CustomizationQuestionUpdate'];

// User Answers
export type UserAnswerResponse = components['schemas']['UserAnswerResponse'];
export type UserAnswerSubmit = components['schemas']['UserAnswerSubmit'];
export type UserAnswerUpdate = components['schemas']['UserAnswerUpdate'];
export type AnswerSubmission = components['schemas']['AnswerSubmission'];
export type AnswerSubmissionResponse = components['schemas']['AnswerSubmissionResponse'];
export type BulkAnswerSubmit = components['schemas']['BulkAnswerSubmit'];
export type BulkAnswerResponse = components['schemas']['BulkAnswerResponse'];

// ──────────────────────────────────────────────
// Events & Hosts
// ──────────────────────────────────────────────

export type Event = components['schemas']['Event'];
export type EventCreate = components['schemas']['EventCreate'];
export type EventUpdate = components['schemas']['EventUpdate'];
export type EventWithHosts = components['schemas']['EventWithHosts'];
export type EventListResponse = components['schemas']['EventListResponse'];
export type EventBulkAction = components['schemas']['EventBulkAction'];
export type EventAnalytics = components['schemas']['EventAnalytics'];
export type EventAnalyticsResponse = components['schemas']['EventAnalyticsResponse'];
export type EventRegistration = components['schemas']['EventRegistration'];

export type Host = components['schemas']['Host'];
export type HostCreate = components['schemas']['HostCreate'];
export type HostUpdate = components['schemas']['HostUpdate'];
export type HostListResponse = components['schemas']['HostListResponse'];
export type PublicHostInfo = components['schemas']['PublicHostInfo'];

// ──────────────────────────────────────────────
// Quizzes
// ──────────────────────────────────────────────

export type QuizResponse = components['schemas']['QuizResponse'];
export type QuizDetailResponse = components['schemas']['QuizDetailResponse'];
export type QuizCreate = components['schemas']['QuizCreate'];
export type QuizUpdate = components['schemas']['QuizUpdate'];
export type QuizListResponse = components['schemas']['QuizListResponse'];
export type QuizPreviewResponse = components['schemas']['QuizPreviewResponse'];
export type QuizWithQuestionsCreate = components['schemas']['QuizWithQuestionsCreate'];

// Quiz Questions
export type QuizQuestionResponse = components['schemas']['QuizQuestionResponse'];
export type QuizQuestionPublicResponse = components['schemas']['QuizQuestionPublicResponse'];
export type QuizQuestionCreate = components['schemas']['QuizQuestionCreate'];
export type QuizQuestionUpdate = components['schemas']['QuizQuestionUpdate'];
export type QuestionType = components['schemas']['QuestionType'];

// Quiz Answers
export type QuizAnswerResponse = components['schemas']['QuizAnswerResponse'];
export type QuizAnswerPublicResponse = components['schemas']['QuizAnswerPublicResponse'];
export type QuizAnswerCreate = components['schemas']['QuizAnswerCreate'];
export type QuizAnswerUpdate = components['schemas']['QuizAnswerUpdate'];
export type QuizAnswerWithExplanation = components['schemas']['QuizAnswerWithExplanation'];

// Quiz Attempts
export type QuizAttemptResponse = components['schemas']['QuizAttemptResponse'];
export type QuizAttemptStartResponse = components['schemas']['QuizAttemptStartResponse'];
export type QuizAttemptHistoryResponse = components['schemas']['QuizAttemptHistoryResponse'];
export type QuizResultResponse = components['schemas']['QuizResultResponse'];

// Quiz Tags
export type QuizTagResponse = components['schemas']['QuizTagResponse'];
export type QuizTagCreate = components['schemas']['QuizTagCreate'];
export type QuizTagUpdate = components['schemas']['QuizTagUpdate'];
export type QuizTagAssignment = components['schemas']['QuizTagAssignment'];
export type QuizTagPlanAssignment = components['schemas']['QuizTagPlanAssignment'];

// Bulk Operations
export type BulkQuizUpload = components['schemas']['BulkQuizUpload'];
export type BulkQuizUploadResponse = components['schemas']['BulkQuizUploadResponse'];
export type BulkQuestionUpload = components['schemas']['BulkQuestionUpload'];
export type BulkQuestionUploadResponse = components['schemas']['BulkQuestionUploadResponse'];
