import { useState, useEffect } from 'react';
import aiCharacterAPI from '../services/aiCharacterAPI';
import userAPI from '../services/userAPI';
import { getCharacterTools } from '../services/toolDiscoveryAPI';

/**
 * Custom hook for managing AI character selection and tools
 * Handles loading, filtering, and state management for characters
 *
 * @param {Object} config
 * @param {string} config.featureKey - Feature key for filtering characters (e.g., 'proposal_wizard', 'viral_post_generator')
 * @param {Function} config.onCharacterChange - Optional callback when character changes
 * @returns {Object} Character state and methods
 */
export function useCharacterManagement({ featureKey, onCharacterChange }) {
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState(null);
  const [selectedCharacterDescription, setSelectedCharacterDescription] = useState('');
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [characterTools, setCharacterTools] = useState(null);

  // Load AI characters on mount
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoadingCharacters(true);

        // Get user features to see which characters are available for this feature
        const userFeatures = await userAPI.getCurrentUserFeatures();
        const featurePath = `system_features.${featureKey}_model`;
        const allowedCharacterNames = userFeatures?.system_features?.[`${featureKey}_model`] || [];

        // Get all characters
        const characters = await aiCharacterAPI.getUserCharacters();

        // Filter characters based on what's allowed for this feature
        let filteredCharacters = characters;
        if (allowedCharacterNames.length > 0) {
          filteredCharacters = characters.filter(char =>
            allowedCharacterNames.includes(char.internal_name) ||
            allowedCharacterNames.includes(char.name.toLowerCase())
          );
        }

        setAvailableCharacters(filteredCharacters);

        // Set first character as default if none selected
        if (filteredCharacters.length > 0 && !selectedCharacterId) {
          const defaultChar = filteredCharacters[0];
          setSelectedCharacterId(defaultChar.id);
          setSelectedCharacterName(defaultChar.name);
          setSelectedCharacterAvatar(defaultChar.avatar_url);
          setSelectedCharacterDescription(defaultChar.description || '');
        }
      } catch (error) {
        console.error('[useCharacterManagement] Failed to load AI characters:', error);

        // Fallback: load all characters if feature filtering fails
        try {
          const characters = await aiCharacterAPI.getUserCharacters();
          setAvailableCharacters(characters);

          if (characters.length > 0 && !selectedCharacterId) {
            const defaultChar = characters[0];
            setSelectedCharacterId(defaultChar.id);
            setSelectedCharacterName(defaultChar.name);
            setSelectedCharacterAvatar(defaultChar.avatar_url);
            setSelectedCharacterDescription(defaultChar.description || '');
          }
        } catch (fallbackError) {
          console.error('[useCharacterManagement] Failed to load characters even in fallback:', fallbackError);
          setAvailableCharacters([]);
        }
      } finally {
        setLoadingCharacters(false);
      }
    };

    loadCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureKey]);

  // Load character tools when character is selected
  useEffect(() => {
    const loadTools = async () => {
      if (!selectedCharacterId) return;

      try {
        const tools = await getCharacterTools(selectedCharacterId);
        console.log('[useCharacterManagement] Character tools loaded:', {
          characterId: selectedCharacterId,
          toolsCount: tools?.available_tools?.length,
          tools: tools?.available_tools?.map(t => ({
            name: t.name,
            questionsCount: t.completion_questions?.length
          }))
        });
        setCharacterTools(tools);
      } catch (error) {
        console.error('[useCharacterManagement] Failed to load character tools:', error);
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

    // Notify parent component if callback provided
    if (onCharacterChange) {
      onCharacterChange(character);
    }
  };

  return {
    // State
    availableCharacters,
    selectedCharacterId,
    selectedCharacterName,
    selectedCharacterAvatar,
    selectedCharacterDescription,
    loadingCharacters,
    characterTools,

    // Methods
    handleCharacterSelect,
    setSelectedCharacterId,
    setSelectedCharacterName,
    setSelectedCharacterAvatar,
    setSelectedCharacterDescription
  };
}
