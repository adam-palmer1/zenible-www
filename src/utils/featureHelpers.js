/**
 * Helper functions for managing user features and character access
 */

/**
 * Get available characters for a specific feature
 * @param {Object} userFeatures - The response from /users/me/features
 * @param {string} featureName - The feature name (e.g., 'proposal_wizard', 'profile_analyzer')
 * @returns {Array} Array of character objects with id and name for the feature
 */
export function getFeatureCharacters(userFeatures, featureName) {
  if (!userFeatures) return [];

  // Check if the feature is enabled
  const isFeatureEnabled = userFeatures.system_features?.[featureName];
  if (!isFeatureEnabled) {
    return [];
  }

  // Get the allowed character models for this feature
  const featureModelKey = `${featureName}_model`;
  const allowedModels = userFeatures.system_features?.[featureModelKey] || [];

  if (allowedModels.length === 0) {
    return [];
  }

  // Get character access details
  const characterAccess = userFeatures.character_access || [];

  // Match allowed models with character access to get full character info
  const availableCharacters = [];

  for (const modelName of allowedModels) {
    // Find the character in character_access by matching the internal name
    const character = characterAccess.find(
      char => char.character_internal_name === modelName
    );

    if (character) {
      availableCharacters.push({
        id: character.character_id,
        name: character.character_name,
        internal_name: character.character_internal_name,
        description: character.character_description,
        daily_message_limit: character.daily_message_limit,
        daily_token_limit: character.daily_token_limit,
        rate_limit_per_minute: character.rate_limit_per_minute,
        priority: character.priority
      });
    }
  }

  return availableCharacters;
}

/**
 * Check if a feature is enabled for the user
 * @param {Object} userFeatures - The response from /users/me/features
 * @param {string} featureName - The feature name (e.g., 'proposal_wizard', 'profile_analyzer')
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(userFeatures, featureName) {
  return userFeatures?.system_features?.[featureName] === true;
}

/**
 * Get the default character for a feature
 * @param {Object} userFeatures - The response from /users/me/features
 * @param {string} featureName - The feature name
 * @returns {Object|null} The default character object or null
 */
export function getDefaultFeatureCharacter(userFeatures, featureName) {
  const characters = getFeatureCharacters(userFeatures, featureName);

  if (characters.length === 0) {
    return null;
  }

  // Return the character with highest priority, or first one if no priority
  return characters.reduce((prev, current) => {
    if (!prev) return current;
    if (!current.priority) return prev;
    if (!prev.priority) return current;
    return current.priority > prev.priority ? current : prev;
  }, null);
}

/**
 * Get all enabled features for the user
 * @param {Object} userFeatures - The response from /users/me/features
 * @returns {Array} Array of enabled feature names
 */
export function getEnabledFeatures(userFeatures) {
  if (!userFeatures?.system_features) return [];

  return Object.entries(userFeatures.system_features)
    .filter(([key, value]) => {
      // Only include boolean features that are true (not the _model arrays)
      return typeof value === 'boolean' && value === true;
    })
    .map(([key]) => key);
}

/**
 * Get character limits and usage info
 * @param {Object} userFeatures - The response from /users/me/features
 * @param {string} characterId - The character UUID
 * @returns {Object|null} Character limits and usage info
 */
export function getCharacterLimits(userFeatures, characterId) {
  const characterAccess = userFeatures?.character_access || [];

  return characterAccess.find(char => char.character_id === characterId) || null;
}