import { useState, useMemo, useCallback } from 'react';
import { extractUniqueWords, similarity } from '@/utils/fuzzySearch';

interface AutocompleteResult {
  word: string;
  frequency: number;
  relevance: number;
}

export function useAutocomplete(text: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Extract words and calculate frequency
  const wordData = useMemo(() => {
    const words = text.split(/\s+/);
    const frequency: Record<string, number> = {};
    
    for (const word of words) {
      const cleaned = word.replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '').trim();
      if (cleaned && cleaned.length >= 2) {
        frequency[cleaned] = (frequency[cleaned] || 0) + 1;
      }
    }
    
    return frequency;
  }, [text]);

  // Get unique words sorted by frequency
  const allWords = useMemo(() => {
    return Object.entries(wordData)
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }, [wordData]);

  // Get suggestions for a query
  const getSuggestions = useCallback((query: string, maxResults: number = 8): AutocompleteResult[] => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: AutocompleteResult[] = [];
    
    for (const { word, frequency } of allWords) {
      const lowerWord = word.toLowerCase();
      
      // Exact prefix match
      if (lowerWord.startsWith(lowerQuery)) {
        results.push({
          word,
          frequency,
          relevance: 1 + (frequency * 0.1),
        });
        continue;
      }
      
      // Contains query
      if (lowerWord.includes(lowerQuery)) {
        results.push({
          word,
          frequency,
          relevance: 0.8 + (frequency * 0.05),
        });
        continue;
      }
      
      // Fuzzy match for short queries
      if (query.length >= 3) {
        const sim = similarity(lowerQuery, lowerWord);
        if (sim >= 0.6) {
          results.push({
            word,
            frequency,
            relevance: sim * 0.5 + (frequency * 0.01),
          });
        }
      }
    }
    
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }, [allWords]);

  // Keyboard navigation
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    suggestions: AutocompleteResult[],
    onSelect: (word: string) => void
  ) => {
    if (!isOpen || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(suggestions[selectedIndex].word);
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, selectedIndex]);

  return {
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    getSuggestions,
    handleKeyDown,
    wordCount: allWords.length,
  };
}
