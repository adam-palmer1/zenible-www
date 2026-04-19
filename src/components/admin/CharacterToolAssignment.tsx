import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';
import logger from '../../utils/logger';
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
      logger.error('Error loading data:', err);
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

      setShowAssignModal(false);
      setEditingAssignment(null);
      setOriginalToolId(null);
      await loadData();
    } catch (err) {
      logger.error('Error saving assignment:', err);
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
      logger.error('Error deleting assignment:', err);
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
      logger.error('Error toggling assignment:', err);
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
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setOriginalToolId(null);
                    setEditingAssignment(null);
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