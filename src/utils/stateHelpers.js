/**
 * State update helper functions
 * Reduces verbose array/object state mutations
 */

/**
 * Remove item from array by id
 * @param {Array} array - Current state array
 * @param {string|number} id - ID to remove
 * @returns {Array} New array without item
 */
export const removeItem = (array, id) => {
  return array.filter(item => item.id !== id);
};

/**
 * Update item in array by id
 * @param {Array} array - Current state array
 * @param {string|number} id - ID to update
 * @param {Object} updated - Updated item or updater function
 * @returns {Array} New array with updated item
 */
export const updateItem = (array, id, updated) => {
  return array.map(item => {
    if (item.id !== id) return item;
    return typeof updated === 'function' ? updated(item) : updated;
  });
};

/**
 * Add item to end of array
 * @param {Array} array - Current state array
 * @param {Object} newItem - Item to add
 * @returns {Array} New array with item added
 */
export const addItem = (array, newItem) => {
  return [...array, newItem];
};

/**
 * Add item to start of array
 * @param {Array} array - Current state array
 * @param {Object} newItem - Item to add
 * @returns {Array} New array with item prepended
 */
export const prependItem = (array, newItem) => {
  return [newItem, ...array];
};

/**
 * Toggle item in array (add if not present, remove if present)
 * @param {Array} array - Current state array
 * @param {*} item - Item to toggle
 * @returns {Array} New array with item toggled
 */
export const toggleItem = (array, item) => {
  return array.includes(item)
    ? array.filter(i => i !== item)
    : [...array, item];
};

/**
 * Replace entire array
 * @param {Array} newArray - New array
 * @returns {Array} New array
 */
export const replaceArray = (newArray) => {
  return [...newArray];
};
