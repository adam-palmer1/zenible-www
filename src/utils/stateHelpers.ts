/**
 * State update helper functions
 * Reduces verbose array/object state mutations
 */

interface HasId {
  id: string | number;
}

export const removeItem = <T extends HasId>(array: T[], id: string | number): T[] => {
  return array.filter(item => item.id !== id);
};

export const updateItem = <T extends HasId>(array: T[], id: string | number, updated: T | ((item: T) => T)): T[] => {
  return array.map(item => {
    if (item.id !== id) return item;
    return typeof updated === 'function' ? updated(item) : updated;
  });
};

export const addItem = <T>(array: T[], newItem: T): T[] => {
  return [...array, newItem];
};

export const prependItem = <T>(array: T[], newItem: T): T[] => {
  return [newItem, ...array];
};

export const toggleItem = <T>(array: T[], item: T): T[] => {
  return array.includes(item)
    ? array.filter(i => i !== item)
    : [...array, item];
};

export const replaceArray = <T>(newArray: T[]): T[] => {
  return [...newArray];
};
