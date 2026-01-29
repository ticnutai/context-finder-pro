import { useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  id: string;
  resultId: string;
  text: string;
  matchedTerms: string[];
  note: string;
  color: string;
  tags: string[];
  createdAt: number;
  searchQuery?: string;
}

const STORAGE_KEY = 'search-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever bookmarks change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    }
  }, [bookmarks, isLoaded]);

  const addBookmark = useCallback((bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark.id;
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBookmark = useCallback((id: string, updates: Partial<Bookmark>) => {
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  }, []);

  const clearAllBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  const exportBookmarks = useCallback(() => {
    const data = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bookmarks]);

  const importBookmarks = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as Bookmark[];
          if (Array.isArray(imported)) {
            // Merge with existing, avoiding duplicates by text
            const existingTexts = new Set(bookmarks.map(b => b.text));
            const newBookmarks = imported.filter(b => !existingTexts.has(b.text));
            setBookmarks(prev => [...prev, ...newBookmarks]);
            resolve(newBookmarks.length);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [bookmarks]);

  const getBookmarkByResultId = useCallback((resultId: string) => {
    return bookmarks.find(b => b.resultId === resultId);
  }, [bookmarks]);

  const isBookmarked = useCallback((resultId: string) => {
    return bookmarks.some(b => b.resultId === resultId);
  }, [bookmarks]);

  const filterBookmarks = useCallback((query: string) => {
    if (!query.trim()) return bookmarks;
    const lowerQuery = query.toLowerCase();
    return bookmarks.filter(b => 
      b.text.toLowerCase().includes(lowerQuery) ||
      b.note.toLowerCase().includes(lowerQuery) ||
      b.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }, [bookmarks]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    clearAllBookmarks,
    exportBookmarks,
    importBookmarks,
    getBookmarkByResultId,
    isBookmarked,
    filterBookmarks,
    isLoaded,
  };
}
