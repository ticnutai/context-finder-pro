import { useState, useCallback, useEffect } from 'react';
import { SearchCondition, SmartSearchOptions, FilterRules } from '@/types/search';

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  conditions: SearchCondition[];
  smartOptions?: SmartSearchOptions;
  filterRules?: FilterRules;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

const STORAGE_KEY = 'advanced-saved-searches';

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved searches:', e);
    }
  }, []);

  // Save to localStorage
  const persistSearches = useCallback((searches: SavedSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (e) {
      console.error('Failed to save searches:', e);
    }
  }, []);

  // Add a new saved search
  const saveSearch = useCallback((
    name: string,
    conditions: SearchCondition[],
    options?: {
      description?: string;
      smartOptions?: SmartSearchOptions;
      filterRules?: FilterRules;
      tags?: string[];
    }
  ): SavedSearch => {
    const newSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      description: options?.description,
      conditions,
      smartOptions: options?.smartOptions,
      filterRules: options?.filterRules,
      tags: options?.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSavedSearches(prev => {
      const updated = [newSearch, ...prev];
      persistSearches(updated);
      return updated;
    });

    return newSearch;
  }, [persistSearches]);

  // Update an existing saved search
  const updateSearch = useCallback((
    id: string,
    updates: Partial<Omit<SavedSearch, 'id' | 'createdAt'>>
  ) => {
    setSavedSearches(prev => {
      const updated = prev.map(search => 
        search.id === id 
          ? { ...search, ...updates, updatedAt: Date.now() }
          : search
      );
      persistSearches(updated);
      return updated;
    });
  }, [persistSearches]);

  // Delete a saved search
  const deleteSearch = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.id !== id);
      persistSearches(updated);
      return updated;
    });
  }, [persistSearches]);

  // Duplicate a saved search
  const duplicateSearch = useCallback((id: string): SavedSearch | null => {
    const original = savedSearches.find(s => s.id === id);
    if (!original) return null;

    const duplicate: SavedSearch = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (העתק)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSavedSearches(prev => {
      const updated = [duplicate, ...prev];
      persistSearches(updated);
      return updated;
    });

    return duplicate;
  }, [savedSearches, persistSearches]);

  // Search within saved searches
  const searchSavedSearches = useCallback((query: string): SavedSearch[] => {
    if (!query.trim()) return savedSearches;
    
    const lowerQuery = query.toLowerCase();
    return savedSearches.filter(search => 
      search.name.toLowerCase().includes(lowerQuery) ||
      search.description?.toLowerCase().includes(lowerQuery) ||
      search.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [savedSearches]);

  // Get by tag
  const getByTag = useCallback((tag: string): SavedSearch[] => {
    return savedSearches.filter(search => 
      search.tags?.includes(tag)
    );
  }, [savedSearches]);

  // Get all tags
  const getAllTags = useCallback((): string[] => {
    const tags = new Set<string>();
    savedSearches.forEach(search => {
      search.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [savedSearches]);

  return {
    savedSearches,
    saveSearch,
    updateSearch,
    deleteSearch,
    duplicateSearch,
    searchSavedSearches,
    getByTag,
    getAllTags,
  };
}
