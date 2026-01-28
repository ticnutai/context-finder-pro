import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  text: string; // The full text to generate suggestions from
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function AutocompleteInput({
  value,
  onChange,
  text,
  placeholder = 'הקלד לחיפוש...',
  className,
  onKeyDown: externalKeyDown,
}: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    getSuggestions,
    handleKeyDown,
  } = useAutocomplete(text);

  const suggestions = getSuggestions(value);

  const handleSelect = (word: string) => {
    onChange(word);
    setIsOpen(false);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    setSelectedIndex(0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle autocomplete navigation
    if (isOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        handleKeyDown(e, suggestions, handleSelect);
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          return;
        }
      }
    }
    
    // Pass to external handler
    externalKeyDown?.(e);
  };

  const handleInputFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={cn('text-right', className)}
        dir="rtl"
        autoComplete="off"
      />

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full bg-white border-2 border-gold/30 rounded-xl shadow-lg overflow-hidden animate-fade-in"
          dir="rtl"
        >
          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.word}
                onClick={() => handleSelect(suggestion.word)}
                className={cn(
                  'w-full px-4 py-2.5 text-right flex items-center justify-between transition-colors',
                  index === selectedIndex
                    ? 'bg-gold/20 text-navy'
                    : 'hover:bg-secondary'
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {suggestion.frequency}×
                </span>
                <span className="font-medium">{suggestion.word}</span>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 bg-secondary/50 text-xs text-muted-foreground text-center border-t">
            ↑↓ לניווט • Enter לבחירה
          </div>
        </div>
      )}
    </div>
  );
}
