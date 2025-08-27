import type { Generation } from '../types';

const STORAGE_KEY = 'modelia_history';
const MAX_HISTORY_ITEMS = 5;

export const saveGeneration = (generation: Generation): void => {
  try {
    const existingHistory = getHistory();
    // Remove any existing generation with the same ID to avoid duplicates
    const filteredHistory = existingHistory.filter(item => item.id !== generation.id);
    const newHistory = [generation, ...filteredHistory.slice(0, MAX_HISTORY_ITEMS - 1)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save generation to localStorage:', error);
  }
};

export const getHistory = (): Generation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

export const removeFromHistory = (id: string): void => {
  try {
    const history = getHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Failed to remove item from history:', error);
  }
};