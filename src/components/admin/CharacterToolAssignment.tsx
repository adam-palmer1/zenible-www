import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { LoadingSpinner } from '../shared';
import Combobox from '../ui/combobox/Combobox';

interface CharacterToolAssignmentProps {
  onError?: (error: string | null) => void;
  darkMode?: boolean;
}

interface CharacterRecord {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface ToolRecord {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}

interface ToolAssignment {
  id: string;
  character_id: string;
  tool_id: string;
  instructions?: string | null;
  is_enabled: boolean;
  tool?: ToolRecord | null;
}

interface CompletionQuestionRecord {
  id: string;
  question_text: string;
  order_index: number;
}

export default function CharacterToolAssignment({ onError }: CharacterToolAssignmentProps) {
  const [characters, setCharacters] = useState<CharacterRecord[]>([]);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [assignments, setAssignments] = useState<ToolAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<ToolAssignment | null>(null);
  const [originalToolId, setOriginalToolId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    character_id: '',
    tool_id: '',
    instructions: '',
    is_enabled: true
  });

  // Completion Questions state
  const [completionQuestions, setCompletionQuestions] = useState<CompletionQuestionRecord[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<CompletionQuestionRecord | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('assignment');
  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    order_index: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      onError && onError(null);

      // Load characters, tools, and assignments in parallel
      const [charactersRes, toolsRes, assignmentsRes] = await Promise.all([
        adminAPI.getAICharacters(),
        adminAPI.getAITools({ active_only: 'false' }),
        adminAPI.getCharacterToolInstructions({ enabled_only: 'false' })
      ]);

      const typedCharsRes = charactersRes as { characters?: CharacterRecord[] };
      setCharacters(Array.isArray(typedCharsRes?.characters) ? typedCharsRes.characters : []);
      setTools(Array.isArray(toolsRes) ? toolsRes as ToolRecord[] : []);
      setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes as ToolAssignment[] : []);
    } catch (err) {
      console.error('Error loading data:', err);
      onError && onError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = (preselectedCharacterId: string | null = null) => {
    setEditingAssignment(null);
    setOriginalToolId(null);
    setFormData({
      character_id: preselectedCharacterId || selectedCharacter || '',
      tool_id: '',
      instructions: '',
      is_enabled: true
    });
    // Reset completion questions state
    setCompletionQuestions([]);
    setEditingQuestion(null);
    setShowQuestionForm(false);
    resetQuestionForm();
    setActiveTab('assignment'); // Reset to assignment tab
    setShowAssignModal(true);
  };

  const handleEditAssignment = async (assignment: ToolAssignment) => {
    setEditingAssignment(assignment);
    setOriginalToolId(assignment.tool_id);
    setFormData({
      character_id: assignment.character_id,
      tool_id: assignment.tool_id,
      instructions: assignment.instructions || '',
      is_enabled: assignment.is_enabled
    });

    // Load completion questions for this assignment
    try {
      const questions = await adminAPI.getCompletionQuestions(assignment.id);
      setCompletionQuestions(Array.isArray(questions) ? questions : []);
    } catch (err) {
      console.error('Error loading completion questions:', err);
      setCompletionQuestions([]);
    }

    setActiveTab('assignment'); // Start with assignment tab when editing
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    try {
      let assignmentId;

      if (editingAssignment) {
        // Update existing assignment
        await adminAPI.updateCharacterToolInstructions(editingAssignment.id, {
          instructions: formData.instructions,
          is_enabled: formData.is_enabled
        });
        assignmentId = editingAssignment.id;
      } else {
        // Create new assignment
        const newAssignment = await adminAPI.assignToolToCharacter(formData) as { id: string };
        assignmentId = newAssignment.id;
      }

      // Handle completion questions if there are any
      if (completionQuestions.length > 0) {
        // Filter out questions that don't have valid data
        const validQuestions = completionQuestions.filter(q => q.question_text.trim());

        if (validQuestions.length > 0) {
          // Prepare questions for bulk submission
          const questionsData = validQuestions.map((question, index) => ({
            question_text: question.question_text.trim(),
            order_index: index
          }));

          try {
            // Bulk create/replace questions (this replaces all existing questions)
            await adminAPI.bulkCreateCompletionQuestions(assignmentId, questionsData);
          } catch (questionErr) {
            console.error('Error saving completion questions:', questionErr);
            onError && onError('Assignment saved but failed to save completion questions: ' + (questionErr instanceof Error ? questionErr.message : 'Unknown error'));
            return; // Don't close modal if questions failed to save
          }
        }
      } else if (editingAssignment) {
        // If editing and no questions, send empty array to clear existing questions
        try {
          await adminAPI.bulkCreateCompletionQuestions(assignmentId, []);
        } catch (deleteErr) {
          console.warn('Failed to clear existing questions:', deleteErr);
        }
      }

      setShowAssignModal(false);
      setEditingAssignment(null);
      setOriginalToolId(null);
      // Reset completion questions state
      setCompletionQuestions([]);
      setEditingQuestion(null);
      setShowQuestionForm(false);
      resetQuestionForm();
      setActiveTab('assignment'); // Reset to assignment tab
      await loadData();
    } catch (err) {
      console.error('Error saving assignment:', err);
      onError && onError(err instanceof Error ? err.message : 'Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (assignment: ToolAssignment) => {
    const characterName = characters.find(c => c.id === assignment.character_id)?.name || 'Unknown';
    const toolName = assignment.tool?.name || 'Unknown';

    if (!confirm(`Remove tool "${toolName}" from character "${characterName}"?`)) {
      return;
    }

    try {
      await adminAPI.removeToolFromCharacter(assignment.id);
      await loadData();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      onError && onError(err instanceof Error ? err.message : 'Failed to remove assignment');
    }
  };

  const handleToggleAssignment = async (assignment: ToolAssignment) => {
    try {
      await adminAPI.updateCharacterToolInstructions(assignment.id, {
        is_enabled: !assignment.is_enabled
      });
      await loadData();
    } catch (err) {
      console.error('Error toggling assignment:', err);
      onError && onError(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  };

  const getCharacterAssignments = (characterId: string) => {
    return assignments.filter(a => a.character_id === characterId);
  };

  const getAvailableTools = () => {
    if (!formData.character_id) return tools;

    const characterAssignments = getCharacterAssignments(formData.character_id);
    const assignedToolIds = characterAssignments.map(a => a.tool_id);

    return tools.filter(tool => {
      // If we're editing an assignment, include the originally selected tool
      if (editingAssignment && tool.id === originalToolId) {
        return true;
      }
      // Otherwise, filter out already assigned tools
      return !assignedToolIds.includes(tool.id);
    });
  };

  const filteredCharacters = selectedCharacter
    ? characters.filter(c => c.id === selectedCharacter)
    : characters;

  // Completion Questions Management Functions
  const resetQuestionForm = () => {
    setQuestionFormData({
      question_text: '',
      order_index: completionQuestions.length
    });
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    resetQuestionForm();
    setQuestionFormData(prev => ({ ...prev, order_index: completionQuestions.length }));
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: CompletionQuestionRecord) => {
    setEditingQuestion(question);
    setQuestionFormData({
      question_text: question.question_text,
      order_index: question.order_index
    });
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!questionFormData.question_text.trim()) {
      return;
    }

    if (editingQuestion) {
      // Update existing question
      setCompletionQuestions(prev =>
        prev.map(q =>
          q.id === editingQuestion.id
            ? { ...q, ...questionFormData }
            : q
        )
      );
    } else {
      // Add new question
      const newQuestion = {
        id: `temp-${Date.now()}`, // Temporary ID for new questions
        ...questionFormData
      };
      setCompletionQuestions(prev => [...prev, newQuestion]);
    }

    setShowQuestionForm(false);
    setEditingQuestion(null);
    resetQuestionForm();
  };

  const handleDeleteQuestion = (questionId: string) => {
    setCompletionQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleMoveQuestion = (questionId: string, direction: string) => {
    setCompletionQuestions(prev => {
      const questions = [...prev];
      const index = questions.findIndex(q => q.id === questionId);

      if (direction === 'up' && index > 0) {
        [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
      } else if (direction === 'down' && index < questions.length - 1) {
        [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
      }

      // Update order_index
      return questions.map((q, i) => ({ ...q, order_index: i }));
    });
  };

  if (loading) {
    return <LoadingSpinner height="py-12" />;
  }

  return (
    <div>
      {/* Header with Character Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Character Tool Assignments</h3>
            <p className="text-gray-600">Assign tools to characters and customize their usage instructions</p>
          </div>
          <button
            onClick={() => handleCreateAssignment()}
            className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
          >
            + Assign Tool
          </button>
        </div>

        {/* Character Filter */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <Combobox
              options={characters.map(character => ({ id: character.id, label: character.name }))}
              value={selectedCharacter}
              onChange={(value) => setSelectedCharacter(value)}
              placeholder="All Characters"
              allowClear
            />
          </div>
        </div>
      </div>

      {/* Character List with Assignments */}
      <div className="space-y-6">
        {filteredCharacters.map(character => {
          const characterAssignments = getCharacterAssignments(character.id);

          return (
            <div key={character.id} className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-purple text-white flex items-center justify-center">
                        {character.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{character.name}</h4>
                      <p className="text-sm text-gray-500">
                        {characterAssignments.length} tool{characterAssignments.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateAssignment(character.id)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    + Add Tool
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                {characterAssignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tools assigned to this character</p>
                ) : (
                  <div className="space-y-3">
                    {characterAssignments.map(assignment => (
                      <div
                        key={assignment.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-medium text-gray-900">
                              {assignment.tool?.name || 'Unknown Tool'}
                            </h5>
                            <button
                              onClick={() => handleToggleAssignment(assignment)}
                              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                assignment.is_enabled
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {assignment.is_enabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {assignment.tool?.description || 'No description'}
                          </p>
                          {assignment.instructions && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Instructions:</span>
                              <p className="mt-1 text-gray-600 bg-white p-2 rounded border">
                                {assignment.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredCharacters.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No characters found</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => {
                setShowAssignModal(false);
                setOriginalToolId(null);
                setEditingAssignment(null);
                setActiveTab('assignment'); // Reset to assignment tab
                setCompletionQuestions([]);
                setEditingQuestion(null);
                setShowQuestionForm(false);
                resetQuestionForm();
              }}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-[95vw] sm:w-full md:max-w-4xl">
              <div className="bg-white px-6 py-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAssignment ? 'Edit Tool Assignment' : 'Assign Tool to Character'}
                </h3>

                {/* Tab Navigation */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('assignment')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'assignment'
                            ? 'border-brand-purple text-brand-purple'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Assignment Details
                      </button>
                      <button
                        onClick={() => setActiveTab('questions')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'questions'
                            ? 'border-brand-purple text-brand-purple'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Completion Questions ({completionQuestions.length})
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Assignment Details Tab */}
                {activeTab === 'assignment' && (
                  <div className="space-y-4">
                  {/* Character Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Character
                    </label>
                    <Combobox
                      options={characters.map(character => ({ id: character.id, label: character.name }))}
                      value={formData.character_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, character_id: value }))}
                      disabled={!!editingAssignment}
                      placeholder="Select Character"
                      allowClear={false}
                    />
                  </div>

                  {/* Tool Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tool
                    </label>
                    <Combobox
                      options={getAvailableTools().map(tool => ({ id: tool.id, label: `${tool.name} - ${tool.description}` }))}
                      value={formData.tool_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, tool_id: value }))}
                      placeholder="Select Tool"
                      allowClear={false}
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Instructions
                    </label>
                    <textarea
                      rows={4}
                      value={formData.instructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="Provide specific instructions for how this character should use this tool..."
                    />
                  </div>

                    {/* Enabled Toggle */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_enabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
                          className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable this assignment</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Completion Questions Tab */}
                {activeTab === 'questions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">Completion Questions</h4>
                        <p className="text-sm text-gray-500">Questions presented to users after tool completion</p>
                      </div>
                      {!showQuestionForm && (
                        <button
                          onClick={handleAddQuestion}
                          className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors text-sm"
                        >
                          + Add Question
                        </button>
                      )}
                    </div>

                    {/* Inline Question Form */}
                    {showQuestionForm && (
                      <div className="border border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-md font-medium text-gray-900">
                            {editingQuestion ? 'Edit Question' : 'Add New Question'}
                          </h5>
                          <button
                            onClick={() => {
                              setShowQuestionForm(false);
                              setEditingQuestion(null);
                              resetQuestionForm();
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Question Text */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Text *
                            </label>
                            <textarea
                              rows={3}
                              value={questionFormData.question_text}
                              onChange={(e) => setQuestionFormData(prev => ({
                                ...prev,
                                question_text: e.target.value
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                              placeholder="Enter your question..."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              This question will be presented to users after the tool completes its response.
                            </p>
                          </div>

                          {/* Form Actions */}
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                setShowQuestionForm(false);
                                setEditingQuestion(null);
                                resetQuestionForm();
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveQuestion}
                              disabled={!questionFormData.question_text.trim()}
                              className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {editingQuestion ? 'Update Question' : 'Add Question'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Questions List */}
                    <div className="space-y-3">
                      {completionQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500 font-medium">#{question.order_index + 1}</span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{question.question_text}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {/* Move buttons */}
                              <button
                                onClick={() => handleMoveQuestion(question.id, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleMoveQuestion(question.id, 'down')}
                                disabled={index === completionQuestions.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {/* Edit button */}
                              <button
                                onClick={() => handleEditQuestion(question)}
                                className="text-brand-purple hover:text-brand-purple-hover text-sm"
                              >
                                Edit
                              </button>
                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {completionQuestions.length === 0 && !showQuestionForm && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No completion questions configured.</p>
                          <p className="text-sm">Add questions to collect user feedback after tool completion.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setOriginalToolId(null);
                    setEditingAssignment(null);
                    setActiveTab('assignment'); // Reset to assignment tab
                    setCompletionQuestions([]);
                    setEditingQuestion(null);
                    setShowQuestionForm(false);
                    resetQuestionForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignment}
                  disabled={!formData.character_id || !formData.tool_id}
                  className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingAssignment ? 'Update Assignment' : 'Assign Tool'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}